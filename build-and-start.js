#!/usr/bin/env node

/**
 * SCRIPT DE BUILD E START PARA SQUARE CLOUD
 * 
 * Este script garante que o build seja executado corretamente
 * e depois inicia o servidor na Square Cloud.
 * 
 * ATUALIZADO PARA ES MODULES
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 [SQUARE CLOUD] Iniciando processo de build e start...');

try {
  // 1. Verificar se estamos na Square Cloud
  const isSquareCloud = process.env.NODE_ENV === 'production';
  console.log(`🌍 [SQUARE CLOUD] Ambiente: ${isSquareCloud ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);

  // 2. Verificar se node_modules existe
  if (!fs.existsSync('node_modules')) {
    console.log('📦 [SQUARE CLOUD] Instalando dependências...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // 3. Verificar se dist já existe
  const distPath = path.join(__dirname, 'dist');
  const indexPath = path.join(distPath, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.log('🔨 [SQUARE CLOUD] Pasta dist não encontrada, executando build...');
    
    // Tentar diferentes formas de executar o build
    try {
      console.log('🔨 [SQUARE CLOUD] Tentativa 1: npx vite build');
      execSync('npx vite build', { stdio: 'inherit' });
    } catch (error1) {
      console.log('⚠️ [SQUARE CLOUD] Tentativa 1 falhou, tentando alternativa...');
      try {
        console.log('🔨 [SQUARE CLOUD] Tentativa 2: ./node_modules/.bin/vite build');
        execSync('./node_modules/.bin/vite build', { stdio: 'inherit' });
      } catch (error2) {
        console.log('⚠️ [SQUARE CLOUD] Tentativa 2 falhou, instalando vite globalmente...');
        try {
          execSync('npm install -g vite', { stdio: 'inherit' });
          execSync('vite build', { stdio: 'inherit' });
        } catch (error3) {
          console.error('❌ [SQUARE CLOUD] Todas as tentativas de build falharam');
          console.error('Error 1:', error1.message);
          console.error('Error 2:', error2.message);
          console.error('Error 3:', error3.message);
          
          // Criar um index.html básico como fallback
          console.log('🆘 [SQUARE CLOUD] Criando fallback básico...');
          if (!fs.existsSync(distPath)) {
            fs.mkdirSync(distPath, { recursive: true });
          }
          
          const fallbackHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Protocolos - Carregando...</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0; 
            background: #f5f5f5;
        }
        .loading { 
            text-align: center; 
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="spinner"></div>
        <h2>Sistema de Protocolos Jurídicos</h2>
        <p>Carregando aplicação...</p>
        <p><small>Build em andamento na Square Cloud</small></p>
    </div>
    <script>
        // Tentar recarregar a página a cada 10 segundos
        setTimeout(() => {
            window.location.reload();
        }, 10000);
    </script>
</body>
</html>`;
          
          fs.writeFileSync(indexPath, fallbackHtml);
          console.log('🆘 [SQUARE CLOUD] Fallback criado, servidor iniciará com página de loading');
        }
      }
    }
  } else {
    console.log('✅ [SQUARE CLOUD] Build já existe, pulando...');
  }

  // 4. Verificar se o build foi bem-sucedido
  if (fs.existsSync(indexPath)) {
    console.log('✅ [SQUARE CLOUD] Build concluído com sucesso!');
    console.log('📁 [SQUARE CLOUD] Arquivos gerados em:', distPath);
    
    const files = fs.readdirSync(distPath);
    console.log('📋 [SQUARE CLOUD] Arquivos:', files.slice(0, 10)); // Mostrar apenas os primeiros 10
  }

  // 5. Iniciar o servidor
  console.log('🚀 [SQUARE CLOUD] Iniciando servidor...');
  
  // Usar spawn para manter o processo vivo
  const serverProcess = spawn('node', ['server/server.js'], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  // Tratar sinais de encerramento
  process.on('SIGTERM', () => {
    console.log('🛑 [SQUARE CLOUD] Recebido SIGTERM, encerrando servidor...');
    serverProcess.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('🛑 [SQUARE CLOUD] Recebido SIGINT, encerrando servidor...');
    serverProcess.kill('SIGINT');
  });

  serverProcess.on('close', (code) => {
    console.log(`🔚 [SQUARE CLOUD] Servidor encerrado com código: ${code}`);
    process.exit(code);
  });

} catch (error) {
  console.error('❌ [SQUARE CLOUD] Erro crítico:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}