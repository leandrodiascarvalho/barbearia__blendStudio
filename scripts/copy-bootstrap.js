/**
 * @file copy-bootstrap.js
 * @description Copia Bootstrap e Bootstrap Icons de node_modules
 *              para blend-frontend/css/vendor e blend-frontend/js/vendor
 *
 * Execute com: node scripts/copy-bootstrap.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Arquivos a copiar ────────────────────────────────────────────
const copies = [
  // Bootstrap CSS
  {
    src:  'node_modules/bootstrap/dist/css/bootstrap.min.css',
    dest: 'blend-frontend/css/vendor/bootstrap.min.css',
  },
  // Bootstrap JS Bundle (já inclui Popper.js)
  {
    src:  'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
    dest: 'blend-frontend/js/vendor/bootstrap.bundle.min.js',
  },
  // Bootstrap Icons CSS
  {
    src:  'node_modules/bootstrap-icons/font/bootstrap-icons.min.css',
    dest: 'blend-frontend/css/vendor/bootstrap-icons.min.css',
  },
  // Bootstrap Icons — fonte woff2
  {
    src:  'node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2',
    dest: 'blend-frontend/css/vendor/fonts/bootstrap-icons.woff2',
  },
  // Bootstrap Icons — fonte woff
  {
    src:  'node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff',
    dest: 'blend-frontend/css/vendor/fonts/bootstrap-icons.woff',
  },
];

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Cria diretório recursivamente se não existir.
 * @param {string} filePath
 */
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  📁 Criado: ${dir}`);
  }
}

/**
 * Copia arquivo de src → dest com verificação de existência.
 * @param {string} src
 * @param {string} dest
 */
function copyFile(src, dest) {
  const srcPath  = path.resolve(src);
  const destPath = path.resolve(dest);

  if (!fs.existsSync(srcPath)) {
    console.warn(`  ⚠️  Não encontrado: ${src}`);
    console.warn(`     → Rode "npm install" primeiro.\n`);
    return;
  }

  ensureDir(destPath);
  fs.copyFileSync(srcPath, destPath);

  // Mostra tamanho do arquivo copiado
  const size = (fs.statSync(destPath).size / 1024).toFixed(1);
  console.log(`  ✅ ${path.basename(src).padEnd(40)} → ${dest} (${size} KB)`);
}

// ── Execução ─────────────────────────────────────────────────────

console.log('\n🚀 Copiando dependências npm → blend-frontend/\n');
console.log('─'.repeat(60));

copies.forEach(({ src, dest }) => copyFile(src, dest));

console.log('─'.repeat(60));
console.log('\n✨ Concluído! Verifique blend-frontend/css/vendor/\n');