/**
 * @file server.js
 * @description Entry point do servidor.
 *              Inicializa o Express e escuta na porta configurada.
 */

'use strict';

const app = require('./src/app');
const env = require('./src/config/env');

const server = app.listen(env.PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║        Blend Studio — Backend          ║
  ╠════════════════════════════════════════╣
  ║  Ambiente : ${env.NODE_ENV.padEnd(26)}║
  ║  Porta    : ${String(env.PORT).padEnd(26)}║
  ║  URL      : http://localhost:${String(env.PORT).padEnd(10)}║
  ╚════════════════════════════════════════╝
  `);
});

// ─── GRACEFUL SHUTDOWN ────────────────────────────────────────────
// Encerra o servidor limpo ao receber sinal de término (SIGTERM/SIGINT).
// Importante em ambientes com containers (Docker, Railway, Render, etc.)

const shutdown = (signal) => {
  console.log(`\n[${signal}] Encerrando servidor...`);

  server.close((err) => {
    if (err) {
      console.error('Erro ao encerrar servidor:', err);
      process.exit(1);
    }
    console.log('Servidor encerrado com sucesso.');
    process.exit(0);
  });

  // Força encerramento após 10 segundos se não fechar limpo
  setTimeout(() => {
    console.error('Forçando encerramento após timeout.');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Captura erros não tratados — loga e encerra com segurança
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
  shutdown('unhandledRejection');
});
