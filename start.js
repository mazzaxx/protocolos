#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando Sistema de Protocolos Jurídicos - Square Cloud');
console.log('☁️ Ambiente:', process.env.NODE_ENV || 'production');
console.log('🔧 Versão Node:', process.version);
console.log('📁 Diretório atual:', __dirname);

// Verificar se a pasta dist existe
const distPath = path.join(__dirname, 'dist');
const hasBuiltFiles = existsSync(distPath);

console.log('📁 Verificando arquivos do frontend...');
console.log('📍 Caminho dist:', distPath);
console.log('✅ Arquivos buildados:', hasBuiltFiles ? 'SIM' : 'NÃO');

// Configurar variáveis de ambiente para Square Cloud
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '80';

// Verificar se estamos no Square Cloud
const isSquareCloud = process.env.SQUARECLOUD || process.env.NODE_ENV === 'production';
console.log('🌐 Executando no Square Cloud:', isSquareCloud ? 'SIM' : 'NÃO');

if (!hasBuiltFiles) {
  console.log('🔨 Buildando frontend...');
  
  // Instalar dependências primeiro
  const installProcess = spawn('npm', ['install'], {
    stdio: 'inherit',
    shell: true
  });
  
  installProcess.on('close', (installCode) => {
    if (installCode === 0) {
      console.log('✅ Dependências instaladas!');
      buildFrontend();
    } else {
      console.error('❌ Erro na instalação das dependências');
      process.exit(1);
    }
  });
} else {
  console.log('✅ Arquivos do frontend já existem');
  startServer();
}

function buildFrontend() {
  console.log('🔨 Iniciando build do frontend...');
  
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build do frontend concluído!');
      startServer();
    } else {
      console.error('❌ Erro no build do frontend');
      process.exit(1);
    }
  });
}

function startServer() {
  console.log('🌐 Iniciando servidor na porta:', process.env.PORT || '80');
  
  const serverProcess = spawn('node', ['server/server.js'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });
  
  serverProcess.on('close', (code) => {
    console.log(`🛑 Servidor encerrado com código: ${code}`);
    if (code !== 0) {
      console.log('🔄 Tentando reiniciar servidor...');
      setTimeout(startServer, 5000);
    } else {
      process.exit(code);
    }
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Erro ao iniciar servidor:', error);
    console.log('🔄 Tentando reiniciar servidor em 10 segundos...');
    setTimeout(startServer, 10000);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, encerrando servidor...');
    serverProcess.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 Recebido SIGINT, encerrando servidor...');
    serverProcess.kill('SIGINT');
  });
}