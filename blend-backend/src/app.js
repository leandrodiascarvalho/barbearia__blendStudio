/**
 * @file app.js
 * @description Configuração principal do Express.
 *              Middlewares, rotas e handlers registrados em ordem correta.
 */

'use strict';

const express        = require('express');
const cors           = require('cors');
const compression    = require('compression');
const morgan         = require('morgan');
const path           = require('path');

const env             = require('./config/env');
const { cors: corsCfg } = require('./config/security');
const securityHeaders  = require('./middlewares/securityHeaders');
const { apiLimiter }   = require('./middlewares/rateLimiter');
const errorHandler     = require('./middlewares/errorHandler');
const simplybookRoutes = require('./routes/simplybook');

const app = express();

// ─── 1. SEGURANÇA (primeiro middleware — antes de tudo) ────────────
app.use(securityHeaders);

// ─── 2. CORS ──────────────────────────────────────────────────────
app.use(cors(corsCfg));

// ─── 3. COMPRESSÃO GZIP ───────────────────────────────────────────
app.use(compression());

// ─── 4. LOGGING ───────────────────────────────────────────────────
// Em produção usa 'combined' (formato Apache), em dev usa 'dev' (colorido)
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── 5. PARSE DE BODY ─────────────────────────────────────────────
app.use(express.json({
  limit: '10kb', // Previne payload bombing (DoS via JSON gigante)
}));
app.use(express.urlencoded({
  extended: false,
  limit: '10kb',
}));

// ─── 6. PROXY REVERSO (Nginx/Apache à frente do Node) ────────────
// Necessário para que req.ip e rate limiter peguem o IP real do cliente
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ─── 7. ARQUIVOS ESTÁTICOS ────────────────────────────────────────
// Serve HTML/CSS/JS/imagens da pasta blend-frontend/
app.use(
  express.static(path.join(__dirname, '../../blend-frontend'), {
    // Cache de 1 dia para assets estáticos em produção
    maxAge: env.NODE_ENV === 'production' ? '1d' : 0,
    // Não lista diretórios
    index: 'index.html',
  })
);

// ─── 8. ROTAS DA API ──────────────────────────────────────────────
// Rate limiter geral aplicado a toda a API
app.use('/api', apiLimiter);
app.use('/api/simplybook', simplybookRoutes);

// ─── 9. ROTA DE SAÚDE (Health Check) ─────────────────────────────
// Usada por monitoramento (UptimeRobot, load balancer, etc.)
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    env:       env.NODE_ENV,
  });
});

// ─── 10. FALLBACK SPA ─────────────────────────────────────────────
// Para qualquer rota não encontrada na API, serve o index.html
// Isso permite que o roteamento client-side funcione corretamente
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../blend-frontend/index.html'));
});

// ─── 11. ERROR HANDLER (deve ser último) ──────────────────────────
app.use(errorHandler);

module.exports = app;