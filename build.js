#!/usr/bin/env node

/**
 * SCRIPT DE BUILD PARA SQUARE CLOUD
 * 
 * Garante que o frontend seja buildado corretamente antes do deploy.
 * Essencial para que o site funcione na Square Cloud.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 [SQUARE CLOUD] Iniciando build do frontend...');

try {
  // Verificar se node_modules existe
  if (!fs.existsSync('node_modules')) {
    console.log('📦 [SQUARE CLOUD] Instalando dependências...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // Executar build do Vite
  console.log('🔨 [SQUARE CLOUD] Executando build do Vite...');
  execSync('npm run build', { stdio: 'inherit' });

  // Verificar se a pasta dist foi criada
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    console.log('✅ [SQUARE CLOUD] Build concluído com sucesso!');
    console.log('📋 [SQUARE CLOUD] Arquivos gerados:', files);
    
    // Verificar se index.html existe
    if (files.includes('index.html')) {
      console.log('✅ [SQUARE CLOUD] index.html encontrado');
    } else {
      console.error('❌ [SQUARE CLOUD] index.html não encontrado!');
      process.exit(1);
    }
  } else {
    console.error('❌ [SQUARE CLOUD] Pasta dist não foi criada!');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ [SQUARE CLOUD] Erro no build:', error.message);
  process.exit(1);
}