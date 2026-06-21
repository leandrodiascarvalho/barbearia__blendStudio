/**
 * @file securityHeaders.js
 * @description Aplica todos os cabeçalhos de segurança HTTP via Helmet.
 *
 * Por que servidor > meta tag?
 * ─────────────────────────────
 * Headers HTTP chegam ANTES do HTML ser baixado e parseado.
 * Meta tags só funcionam depois que o browser leu o HTML — tarde demais
 * para alguns ataques (ex: o browser já pode ter carregado recursos
 * inseguros antes de ler a meta CSP).
 */

'use strict';

const helmet  = require('helmet');
const { csp } = require('../config/security');

/**
 * Middleware que aplica cabeçalhos de segurança HTTP.
 * Use como: app.use(securityHeaders);
 *
 * Headers aplicados pelo Helmet:
 * ┌──────────────────────────────────────┬──────────────────────────────────────────┐
 * │ Header                               │ Proteção                                 │
 * ├──────────────────────────────────────┼──────────────────────────────────────────┤
 * │ Content-Security-Policy              │ XSS, injeção de scripts                  │
 * │ X-Frame-Options: DENY                │ Clickjacking                             │
 * │ X-Content-Type-Options: nosniff      │ MIME sniffing                            │
 * │ Referrer-Policy                      │ Vazamento de URL em requisições          │
 * │ Strict-Transport-Security (HSTS)     │ Força HTTPS (produção)                   │
 * │ Permissions-Policy                   │ Restringe APIs do browser                │
 * │ X-DNS-Prefetch-Control               │ Controla DNS prefetch                    │
 * │ Cross-Origin-Opener-Policy           │ Isolamento de processo (Spectre)         │
 * │ Cross-Origin-Resource-Policy         │ Controla quem embute seus recursos       │
 * └──────────────────────────────────────┴──────────────────────────────────────────┘
 */
const securityHeaders = helmet({

  // ── Content Security Policy ──────────────────────────────────
  contentSecurityPolicy: csp,

  // ── X-Frame-Options ──────────────────────────────────────────
  // DENY = ninguém pode embutir este site em iframe (previne clickjacking)
  frameguard: { action: 'deny' },

  // ── HSTS (HTTP Strict Transport Security) ────────────────────
  // Força HTTPS por 1 ano + subdomínios + preload list
  // ATENÇÃO: só ative em produção com HTTPS configurado!
  hsts: {
    maxAge: 31_536_000,    // 1 ano em segundos
    includeSubDomains: true,
    preload: true,
  },

  // ── Referrer Policy ──────────────────────────────────────────
  // Envia apenas a origem (sem path/query) para requisições cross-origin
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // ── Permissions Policy ───────────────────────────────────────
  // Desabilita APIs do browser que não são usadas no site
  // Reduz superfície de ataque se XSS ocorrer
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },

  // ── Cross-Origin Opener Policy ───────────────────────────────
  crossOriginOpenerPolicy: { policy: 'same-origin' },

  // ── Cross-Origin Resource Policy ─────────────────────────────
  crossOriginResourcePolicy: { policy: 'same-site' },

  // ── DNS Prefetch Control ─────────────────────────────────────
  dnsPrefetchControl: { allow: false },

  // ── X-Content-Type-Options ───────────────────────────────────
  // Já habilitado por padrão no Helmet — explícito para documentação
  noSniff: true,

  // ── X-XSS-Protection ─────────────────────────────────────────
  // Desabilitado pois a CSP é mais eficaz e este header pode causar
  // vulnerabilidades em browsers antigos
  xssFilter: false,
});

module.exports = securityHeaders;