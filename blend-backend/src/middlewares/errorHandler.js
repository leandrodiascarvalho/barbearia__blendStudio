/**
 * @file errorHandler.js
 * @description Handler global de erros — garante que nenhum erro
 *              vaze detalhes internos para o cliente em produção.
 */

'use strict';

const env = require('../config/env');

/**
 * Middleware de erro do Express (4 parâmetros obrigatórios).
 * Deve ser registrado APÓS todas as rotas e middlewares.
 *
 * @param {Error}                      err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {Function}                   next  - necessário mesmo sem uso
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Em produção: log completo no servidor, resposta genérica ao cliente.
  // Em desenvolvimento: mostra detalhes para facilitar o debug.
  const isDev = env.NODE_ENV === 'development';

  // Log sempre no servidor (substitua por Winston/Pino em produção)
  console.error(`[${new Date().toISOString()}] ERROR:`, {
    message: err.message,
    stack:   err.stack,
    url:     req.originalUrl,
    method:  req.method,
    ip:      req.ip,
  });

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    error: isDev
      ? err.message                          // Dev: mensagem real
      : 'Ocorreu um erro interno no servidor.', // Prod: mensagem genérica

    // Stack trace apenas em desenvolvimento
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
