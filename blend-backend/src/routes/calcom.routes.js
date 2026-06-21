/**
 * @file calcom.routes.js
 * @description Rotas para integração com a API do Cal.com.
 *              Atua como proxy seguro — a API key nunca vai ao frontend.
 *              Apenas definição de rotas e validação — lógica de negócio
 *              fica em services/calcom.service.js.
 */

'use strict';

const express                = require('express');
const { z }                  = require('zod');
const { agendamentoLimiter } = require('../middlewares/rateLimiter');
const calcomService          = require('../services/calcom.service');

const router = express.Router();

// ─── SCHEMAS DE VALIDAÇÃO ─────────────────────────────────────────

/** Valida os dados de entrada do agendamento */
const bookingSchema = z.object({
  event_type_id: z.number().int().positive(),
  start:         z.string().datetime({ message: 'Data/hora deve estar no formato ISO 8601 (ex: 2025-01-15T10:00:00Z)' }),
  name:          z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .transform((s) => s.trim()),
  email:         z
    .string()
    .email('E-mail inválido')
    .max(254, 'E-mail muito longo')
    .transform((s) => s.trim().toLowerCase()),
  phone:         z
    .string()
    .regex(/^\+?[\d\s\-().]{8,20}$/, 'Telefone inválido')
    .transform((s) => s.trim())
    .optional(),
  time_zone:     z
    .string()
    .default('America/Sao_Paulo'),
});

/** Valida query params de slots */
const slotQuerySchema = z.object({
  event_type_id: z.string().regex(/^\d+$/).transform(Number),
  start_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  end_date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  time_zone:     z.string().optional().default('America/Sao_Paulo'),
});

// ─── ROTAS ────────────────────────────────────────────────────────

/**
 * GET /api/calcom/event-types
 * Retorna os tipos de evento (serviços) disponíveis na barbearia.
 */
router.get('/event-types', async (req, res, next) => {
  try {
    const eventTypes = await calcomService.getEventTypes();
    res.json({ success: true, data: eventTypes });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/calcom/slots
 * Retorna horários disponíveis para um tipo de evento em um intervalo.
 * Query params obrigatórios: event_type_id, start_date, end_date
 * Query param opcional: time_zone (default: America/Sao_Paulo)
 */
router.get('/slots', async (req, res, next) => {
  try {
    const parsed = slotQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error:   'Parâmetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { event_type_id, start_date, end_date, time_zone } = parsed.data;
    const slots = await calcomService.getAvailableSlots(event_type_id, start_date, end_date, time_zone);

    res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/calcom/agendar
 * Cria um novo agendamento.
 * Rate limit mais restrito aplicado nesta rota.
 *
 * Body esperado:
 * {
 *   event_type_id, start, name, email, phone (opcional), time_zone (opcional)
 * }
 */
router.post('/agendar', agendamentoLimiter, async (req, res, next) => {
  try {
    // 1. Valida e sanitiza os dados de entrada
    const parsed = bookingSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error:   'Dados inválidos. Verifique os campos e tente novamente.',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { event_type_id, start, name, email, phone, time_zone } = parsed.data;

    // 2. Cria o agendamento via Cal.com
    const booking = await calcomService.createBooking({
      eventTypeId: event_type_id,
      start,
      name,
      email,
      timeZone: time_zone,
      metadata: phone ? { phone } : {},
    });

    res.status(201).json({
      success: true,
      message: 'Agendamento realizado com sucesso!',
      data: {
        booking_uid:   booking.uid,
        start:         booking.start,
        end:           booking.end,
        event_type_id,
        status:        booking.status,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/calcom/cancelar/:booking_uid
 * Cancela um agendamento existente.
 * Na API v2 do Cal.com, cancelamento é via POST, não DELETE.
 */
router.post('/cancelar/:booking_uid', agendamentoLimiter, async (req, res, next) => {
  try {
    const { booking_uid } = req.params;
    const { reason } = req.body || {};

    if (!booking_uid || booking_uid.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'UID de agendamento inválido',
      });
    }

    await calcomService.cancelBooking(booking_uid, reason);

    res.json({
      success: true,
      message: 'Agendamento cancelado com sucesso.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/calcom/reagendar/:booking_uid
 * Reagenda um agendamento existente para um novo horário.
 *
 * Body esperado:
 * {
 *   start: "2025-01-15T14:00:00Z",
 *   reason: "Conflito de horário" (opcional)
 * }
 */
router.post('/reagendar/:booking_uid', agendamentoLimiter, async (req, res, next) => {
  try {
    const { booking_uid } = req.params;

    if (!booking_uid || booking_uid.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'UID de agendamento inválido',
      });
    }

    const rescheduleSchema = z.object({
      start:  z.string().datetime({ message: 'Data/hora deve estar no formato ISO 8601' }),
      reason: z.string().max(500).optional(),
    });

    const parsed = rescheduleSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error:   'Dados inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const booking = await calcomService.rescheduleBooking(
      booking_uid,
      parsed.data.start,
      parsed.data.reason
    );

    res.json({
      success: true,
      message: 'Agendamento reagendado com sucesso.',
      data: booking,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
