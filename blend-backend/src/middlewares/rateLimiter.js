/**
 * @file rateLimiter.js
 * @description Rate limiters para proteger a API contra abuso,
 *              DDoS e brute-force.
 */

'use strict';

const rateLimit         = require('express-rate-limit');
const { rateLimit: cfg } = require('../config/security');

/**
 * Formata a resposta de erro do rate limiter como JSON consistente.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {Function}                   next
 * @param {Object}                     options
 */
const rateLimitHandler = (req, res, _next, options) => {
  res.status(options.statusCode).json({
    success: false,
    error:   options.message.error,
    // Informa quando o cliente pode tentar novamente
    retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutos',
  });
};

// ── Rate Limiter Geral (todas as rotas /api/*) ─────────────────────
const apiLimiter = rateLimit({
  ...cfg.api,
  standardHeaders: true,  // Adiciona headers RateLimit-* na resposta
  legacyHeaders:   false, // Remove X-RateLimit-* (padrão antigo)
  handler:         rateLimitHandler,

  // Chave de identificação: IP real (considera proxy reverso)
  keyGenerator: (req) => {
    return (
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.ip
    );
  },
});

// ── Rate Limiter de Agendamento (mais restrito) ────────────────────
const agendamentoLimiter = rateLimit({
  ...cfg.agendamento,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         rateLimitHandler,
  keyGenerator: (req) => {
    return (
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.ip
    );
  },
});

module.exports = { apiLimiter, agendamentoLimiter };