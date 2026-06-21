/**
 * @file env.js
 * @description Valida e exporta todas as variáveis de ambiente.
 * Falha rapidamente (fail-fast) se alguma obrigatória estiver ausente.
 * Nunca acesse process.env diretamente fora deste arquivo.
 */

'use strict';

const path = require('path');
const { z } = require('zod');

// Carrega o .env da raiz do blend-backend (não de src/config/)
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

// Schema de validação das variáveis de ambiente
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z
    .string()
    .transform(Number)
    .refine((n) => n > 0 && n < 65536, {
      message: 'PORT deve ser um número entre 1 e 65535',
    })
    .default('3000'),

  ALLOWED_ORIGIN: z
    .string()
    .url({ message: 'ALLOWED_ORIGIN deve ser uma URL válida' }),

  CALCOM_API_KEY: z
    .string()
    .min(10, 'CALCOM_API_KEY parece inválida (mínimo 10 caracteres)'),

  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET deve ter no mínimo 32 caracteres'),
});

// Valida e parseia — lança erro detalhado se algo estiver errado
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:\n');
  parsed.error.issues.forEach((issue) => {
    console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1); // Encerra o processo — não sobe o servidor com config inválida
}

module.exports = parsed.data;
