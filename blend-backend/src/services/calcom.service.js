/**
 * @file calcom.service.js
 * @description Serviço de integração com a API Cal.com v2 (REST).
 *              Centraliza autenticação e chamadas HTTP.
 *              Nenhuma rota Express aqui — apenas lógica de negócio.
 *
 * Documentação: https://cal.com/docs/api-reference/v2
 */

'use strict';

const axios = require('axios');
const env   = require('../config/env');

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────

/** URL base da API Cal.com v2 */
const CALCOM_API_URL = 'https://api.cal.com/v2';

/** Versão da API Cal.com (obrigatória em cada requisição) */
const CALCOM_API_VERSION = '2024-08-13';

/**
 * Headers padrão para todas as requisições à API Cal.com.
 * @returns {Object} Headers com autenticação e versionamento
 */
function getHeaders() {
  return {
    'Authorization':   `Bearer ${env.CALCOM_API_KEY}`,
    'Content-Type':    'application/json',
    'cal-api-version': CALCOM_API_VERSION,
  };
}

/**
 * Faz uma requisição GET para a API Cal.com.
 * @param {string} path       - Caminho do endpoint (ex: '/event-types')
 * @param {Object} [params]   - Query params
 * @returns {Promise<any>}
 */
async function calGet(path, params = {}) {
  const response = await axios.get(`${CALCOM_API_URL}${path}`, {
    headers: getHeaders(),
    params,
    timeout: 10_000,
  });

  if (response.data.status === 'error') {
    const err = new Error(response.data.error?.message || 'Erro na API Cal.com');
    err.statusCode = 502;
    throw err;
  }

  return response.data;
}

/**
 * Faz uma requisição POST para a API Cal.com.
 * @param {string} path   - Caminho do endpoint
 * @param {Object} body   - Body da requisição
 * @returns {Promise<any>}
 */
async function calPost(path, body = {}) {
  const response = await axios.post(`${CALCOM_API_URL}${path}`, body, {
    headers: getHeaders(),
    timeout: 10_000,
  });

  if (response.data.status === 'error') {
    const err = new Error(response.data.error?.message || 'Erro na API Cal.com');
    err.statusCode = 502;
    throw err;
  }

  return response.data;
}

// ─── MÉTODOS PÚBLICOS ─────────────────────────────────────────────

/**
 * Retorna os tipos de evento (serviços) disponíveis.
 * Endpoint: GET /v2/event-types
 * @returns {Promise<Object>}
 */
async function getEventTypes() {
  const result = await calGet('/event-types');
  return result.data;
}

/**
 * Retorna horários disponíveis para um tipo de evento em um intervalo de datas.
 * Endpoint: GET /v2/slots
 *
 * @param {number} eventTypeId - ID do tipo de evento (serviço)
 * @param {string} startDate   - Data início (YYYY-MM-DD)
 * @param {string} endDate     - Data fim (YYYY-MM-DD)
 * @param {string} [timeZone]  - Timezone (ex: 'America/Sao_Paulo')
 * @returns {Promise<Object>}
 */
async function getAvailableSlots(eventTypeId, startDate, endDate, timeZone = 'America/Sao_Paulo') {
  const result = await calGet('/slots', {
    eventTypeId,
    start: startDate,
    end:   endDate,
    timeZone,
  });
  return result.data;
}

/**
 * Cria um novo agendamento (booking).
 * Endpoint: POST /v2/bookings
 *
 * @param {Object} data
 * @param {number} data.eventTypeId  - ID do tipo de evento
 * @param {string} data.start        - Data/hora de início (ISO 8601, ex: '2025-01-15T10:00:00Z')
 * @param {string} data.name         - Nome do cliente
 * @param {string} data.email        - E-mail do cliente
 * @param {string} [data.timeZone]   - Timezone do cliente
 * @param {string} [data.language]   - Idioma (ex: 'pt-BR')
 * @param {Object} [data.metadata]   - Dados adicionais (ex: telefone)
 * @returns {Promise<Object>}
 */
async function createBooking({ eventTypeId, start, name, email, timeZone = 'America/Sao_Paulo', language = 'pt-BR', metadata = {} }) {
  const result = await calPost('/bookings', {
    eventTypeId,
    start,
    attendee: {
      name,
      email,
      timeZone,
      language,
    },
    metadata,
  });
  return result.data;
}

/**
 * Cancela um agendamento existente.
 * Endpoint: POST /v2/bookings/{uid}/cancel
 *
 * @param {string} bookingUid         - UID do agendamento
 * @param {string} [cancellationReason] - Motivo do cancelamento
 * @returns {Promise<Object>}
 */
async function cancelBooking(bookingUid, cancellationReason = '') {
  const body = cancellationReason
    ? { cancellationReason }
    : {};

  const result = await calPost(`/bookings/${bookingUid}/cancel`, body);
  return result.data;
}

/**
 * Reagenda um agendamento existente.
 * Endpoint: POST /v2/bookings/{uid}/reschedule
 *
 * @param {string} bookingUid         - UID do agendamento
 * @param {string} newStart           - Nova data/hora (ISO 8601)
 * @param {string} [reason]           - Motivo do reagendamento
 * @returns {Promise<Object>}
 */
async function rescheduleBooking(bookingUid, newStart, reason = '') {
  const body = {
    start: newStart,
    ...(reason && { reschedulingReason: reason }),
  };

  const result = await calPost(`/bookings/${bookingUid}/reschedule`, body);
  return result.data;
}

module.exports = {
  getEventTypes,
  getAvailableSlots,
  createBooking,
  cancelBooking,
  rescheduleBooking,
};
