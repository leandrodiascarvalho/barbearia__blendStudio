/**
 * @file simplybook.js
 * @description Rotas para integração com a API do SimplyBook.me.
 *              Atua como proxy seguro — a API key nunca vai ao frontend.
 */

'use strict';

const express              = require('express');
const axios                = require('axios');
const { z }                = require('zod');
const { agendamentoLimiter } = require('../middlewares/rateLimiter');
const env                  = require('../config/env');

const router = express.Router();

// ─── CONFIGURAÇÃO DO CLIENTE HTTP ─────────────────────────────────

/** Token de autenticação em memória (renovado automaticamente) */
let authToken    = null;
let tokenExpires = 0; // timestamp em ms

/**
 * URL base da API SimplyBook.me (JSON-RPC).
 * Documentação: https://simplybook.me/en/api/developer-api
 */
const SIMPLYBOOK_API_URL = `https://user-api.simplybook.me`;

/**
 * Obtém token de autenticação da API SimplyBook.me.
 * Cacheia o token para evitar chamadas desnecessárias.
 * @returns {Promise<string>} Token JWT
 */
async function getAuthToken() {
  const now = Date.now();

  // Reutiliza o token se ainda válido (com 1 min de margem)
  if (authToken && now < tokenExpires - 60_000) {
    return authToken;
  }

  const response = await axios.post(
    `${SIMPLYBOOK_API_URL}/login`,
    {
      jsonrpc: '2.0',
      id:      1,
      method:  'getToken',
      params:  {
        company:  env.SIMPLYBOOK_COMPANY,
        login:    'api',
        password: env.SIMPLYBOOK_API_KEY,
      },
    },
    {
      timeout: 8000, // 8 segundos de timeout
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (response.data.error) {
    const err = new Error(
      `SimplyBook.me auth error: ${response.data.error.message}`
    );
    err.statusCode = 502;
    throw err;
  }

  authToken    = response.data.result;
  // Tokens SimplyBook.me expiram em 10 minutos por padrão
  tokenExpires = now + 10 * 60 * 1000;

  return authToken;
}

/**
 * Faz uma chamada JSON-RPC autenticada para a API SimplyBook.me.
 * @param {string} method  - Nome do método RPC
 * @param {Array}  params  - Parâmetros do método
 * @returns {Promise<any>} Resultado da chamada
 */
async function callSimplyBook(method, params = []) {
  const token = await getAuthToken();

  const response = await axios.post(
    `${SIMPLYBOOK_API_URL}/api/v2`,
    {
      jsonrpc: '2.0',
      id:      1,
      method,
      params,
    },
    {
      timeout: 10_000,
      headers: {
        'Content-Type': 'application/json',
        'X-Company-Login': env.SIMPLYBOOK_COMPANY,
        'X-Token':         token,
      },
    }
  );

  if (response.data.error) {
    const err = new Error(response.data.error.message);
    err.statusCode = 502;
    throw err;
  }

  return response.data.result;
}

// ─── SCHEMAS DE VALIDAÇÃO ─────────────────────────────────────────

/** Valida os dados de entrada do agendamento */
const agendamentoSchema = z.object({
  service_id:   z.number().int().positive(),
  provider_id:  z.number().int().positive(),
  date:         z
    .string()
    .regex(/
^
\d{4}-\d{2}-\d{2}
$
/, 'Data deve estar no formato YYYY-MM-DD'),
  time:         z
    .string()
    .regex(/
^
\d{2}:\d{2}
$
/, 'Horário deve estar no formato HH:MM'),
  client_name:  z
    .string()
    .min(2,  'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .transform((s) => s.trim()),
  client_email: z
    .string()
    .email('E-mail inválido')
    .max(254, 'E-mail muito longo')
    .transform((s) => s.trim().toLowerCase()),
  client_phone: z
    .string()
    .regex(
      /
^
\+?[\d\s\-().]{8,20}
$
/,
      'Telefone inválido'
    )
    .transform((s) => s.trim()),
});

// ─── ROTAS ────────────────────────────────────────────────────────

/**
 * GET /api/simplybook/services
 * Retorna os serviços disponíveis na barbearia.
 */
router.get('/services', async (req, res, next) => {
  try {
    const services = await callSimplyBook('getCatalogData');
    res.json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/simplybook/providers
 * Retorna os barbeiros (providers) disponíveis.
 * Query param opcional: ?service_id=1
 */
router.get('/providers', async (req, res, next) => {
  try {
    const serviceId = req.query.service_id
      ? parseInt(req.query.service_id, 10)
      : undefined;

    // Valida se service_id é um número válido quando fornecido
    if (req.query.service_id && (isNaN(serviceId) || serviceId <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'service_id deve ser um número positivo',
      });
    }

    const providers = await callSimplyBook(
      'getPerformerList',
      serviceId ? [serviceId] : []
    );

    res.json({ success: true, data: providers });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/simplybook/slots
 * Retorna horários disponíveis para um serviço/barbeiro/data.
 * Query params obrigatórios: service_id, provider_id, date (YYYY-MM-DD)
 */
router.get('/slots', async (req, res, next) => {
  try {
    const slotSchema = z.object({
      service_id:  z.string().regex(/
^
\d+
$
/).transform(Number),
      provider_id: z.string().regex(/
^
\d+
$
/).transform(Number),
      date:        z.string().regex(/
^
\d{4}-\d{2}-\d{2}
$
/),
    });

    const parsed = slotSchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error:   'Parâmetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { service_id, provider_id, date } = parsed.data;

    const slots = await callSimplyBook('getStartTimeMatrix', [
      date,
      date,
      service_id,
      provider_id,
    ]);

    res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/simplybook/agendar
 * Cria um novo agendamento.
 * Rate limit mais restrito aplicado nesta rota.
 *
 * Body esperado:
 * {
 *   service_id, provider_id, date, time,
 *   client_name, client_email, client_phone
 * }
 */
router.post('/agendar', agendamentoLimiter, async (req, res, next) => {
  try {
    // 1. Valida e sanitiza os dados de entrada
    const parsed = agendamentoSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error:   'Dados inválidos. Verifique os campos e tente novamente.',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const {
      service_id,
      provider_id,
      date,
      time,
      client_name,
      client_email,
      client_phone,
    } = parsed.data;

    // 2. Cria o agendamento via API SimplyBook.me
    const booking = await callSimplyBook('book', [
      service_id,
      provider_id,
      date,
      time,
      {
        // Dados do cliente — já sanitizados pelo Zod
        name:  client_name,
        email: client_email,
        phone: client_phone,
      },
    ]);

    res.status(201).json({
      success: true,
      message: 'Agendamento realizado com sucesso!',
      data: {
        // Retorna apenas o necessário — nunca dados sensíveis internos
        booking_id: booking.id,
        date,
        time,
        service_id,
        provider_id,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/simplybook/cancelar/:booking_id
 * Cancela um agendamento existente.
 */
router.delete('/cancelar/:booking_id', agendamentoLimiter, async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.booking_id, 10);

    if (isNaN(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID de agendamento inválido',
      });
    }

    await callSimplyBook('cancelBooking', [bookingId]);

    res.json({
      success: true,
      message: 'Agendamento cancelado com sucesso.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;