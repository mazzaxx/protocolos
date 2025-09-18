#!/usr/bin/env node

/**
 * SCRIPT DE BUILD PARA SQUARE CLOUD
 * 
 * Este script garante que o build do frontend seja executado
 * corretamente na Square Cloud antes do servidor iniciar.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 [SQUARE CLOUD] Iniciando processo de build...');

try {
  // Verificar se node_modules existe
  if (!fs.existsSync('node_modules')) {
    console.log('📦 [SQUARE CLOUD] Instalando dependências...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // Executar build do Vite
  console.log('🔨 [SQUARE CLOUD] Executando build do frontend...');
  execSync('npm run build', { stdio: 'inherit' });

  // Verificar se o build foi bem-sucedido
  const distPath = path.join(__dirname, 'dist');
  const indexPath = path.join(distPath, 'index.html');

  if (fs.existsSync(indexPath)) {
    console.log('✅ [SQUARE CLOUD] Build concluído com sucesso!');
    console.log('📁 [SQUARE CLOUD] Arquivos gerados em:', distPath);
    
    const files = fs.readdirSync(distPath);
    console.log('📋 [SQUARE CLOUD] Arquivos:', files);
  } else {
    throw new Error('Build falhou - index.html não encontrado');
  }

} catch (error) {
  console.error('❌ [SQUARE CLOUD] Erro no build:', error.message);
  process.exit(1);
}