/**
 * @file security.js
 * @description Configuração centralizada de segurança.
 * Altere este arquivo para ajustar políticas de CSP, CORS, etc.
 */

'use strict';

const env = require('./env');

const IS_PROD = env.NODE_ENV === 'production';

module.exports = {

  // ─── CORS ─────────────────────────────────────────────────────
  cors: {
    // Em produção: apenas o domínio oficial.
    // Em desenvolvimento: permite localhost para facilitar o dev.
    origin: IS_PROD
      ? env.ALLOWED_ORIGIN
      : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'], // Adicionado 5500 para Live Server

    methods: ['GET', 'POST'],                // Cal.com v2 usa POST para cancelar/reagendar
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,             // Não usar cookies cross-origin
    optionsSuccessStatus: 200,      // Compatibilidade com IE11
  },

  // ─── CONTENT SECURITY POLICY ──────────────────────────────────
  // Helmet aceita o formato de objeto para CSP.
  // Gere os hashes de scripts inline em: https://report-uri.com/home/hash
  csp: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   [
        "'self'",
        'https://cdn.jsdelivr.net',
        // Adicione hashes de scripts inline se necessário:
        // "'sha256-HASH_AQUI'"
      ],
      styleSrc:    [
        "'self'",
        'https://cdn.jsdelivr.net',
        'https://fonts.googleapis.com',
        "'unsafe-inline'", // Necessário para Bootstrap icons inline
      ],
      fontSrc:     [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net',
      ],
      imgSrc:      ["'self'", 'data:', 'https:'],
      frameSrc:    ['https://www.google.com'],   // Google Maps embed
      connectSrc:  ["'self'", 'http://localhost:3000'], // Permite conexão com o próprio backend
      objectSrc:   ["'none'"],                   // Bloqueia Flash/plugins
      baseUri:     ["'self'"],
      formAction:  ["'self'"],
      // Em produção, adicione um endpoint para receber violações de CSP:
      // reportUri:  ['/api/csp-report'],
      // upgradeInsecureRequests só é aplicado em produção (com HTTPS)
      ...(IS_PROD && { upgradeInsecureRequests: [] }),
    },
    reportOnly: false, // true = só loga, não bloqueia (útil para testar)
  },

  // ─── RATE LIMIT ───────────────────────────────────────────────
  rateLimit: {
    // Limite geral da API
    api: {
      windowMs: 15 * 60 * 1000, // Janela de 15 minutos
      max: 100,                  // Máximo de 100 requisições por IP
      message: {
        error: 'Muitas requisições. Tente novamente em alguns minutos.',
      },
    },
    // Limite mais restrito para agendamentos (evita spam)
    agendamento: {
      windowMs: 60 * 60 * 1000, // Janela de 1 hora
      max: 10,                   // Máximo de 10 tentativas por IP
      message: {
        error: 'Limite de agendamentos atingido. Tente novamente em 1 hora.',
      },
    },
  },
};