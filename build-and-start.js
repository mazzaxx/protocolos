#!/usr/bin/env node

/**
 * SCRIPT DE BUILD E START PARA SQUARE CLOUD - VERSÃO OTIMIZADA
 * 
 * Este script verifica se o build já existe e inicia o servidor.
 * O build deve ser feito ANTES do deploy para evitar problemas.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 [SQUARE CLOUD] Iniciando servidor otimizado...');

try {
  // 1. Verificar se estamos na Square Cloud
  const isSquareCloud = process.env.NODE_ENV === 'production';
  console.log(`🌍 [SQUARE CLOUD] Ambiente: ${isSquareCloud ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);

  // 2. Verificar se o build existe
  const distPath = path.join(__dirname, 'dist');
  const indexPath = path.join(distPath, 'index.html');
  
  if (!fs.existsSync(distPath) || !fs.existsSync(indexPath)) {
    console.error('❌ [SQUARE CLOUD] ERRO CRÍTICO: Build não encontrado!');
    console.error('💡 [SQUARE CLOUD] Execute "npm run build" antes do deploy');
    
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
    <title>Sistema de Protocolos - Build Necessário</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container { 
            text-align: center; 
            padding: 3rem;
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            max-width: 500px;
        }
        .error {
            color: #ff6b6b;
            font-size: 48px;
            margin-bottom: 1rem;
        }
        .code {
            background: rgba(0,0,0,0.3);
            padding: 1rem;
            border-radius: 8px;
            font-family: monospace;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error">🔧</div>
        <h1>⚖️ Sistema de Protocolos Jurídicos</h1>
        <h3>Neycampos Advocacia</h3>
        <p>❌ Build necessário antes do deploy</p>
        <div class="code">
            npm run build
        </div>
        <p><small>Execute o comando acima antes de fazer o deploy</small></p>
        <br>
        <p><small>Powered by Square Cloud 🚀</small></p>
    </div>
</body>
</html>`;
    
    fs.writeFileSync(indexPath, fallbackHtml);
    console.log('🆘 [SQUARE CLOUD] Fallback criado - Execute npm run build');
  } else {
    // Verificar se é um build real do React
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    if (indexContent.includes('id="root"') && indexContent.includes('script') && !indexContent.includes('Build necessário')) {
      console.log('✅ [SQUARE CLOUD] Build do React encontrado!');
      console.log('📁 [SQUARE CLOUD] Arquivos gerados em:', distPath);
      
      const files = fs.readdirSync(distPath);
      console.log('📋 [SQUARE CLOUD] Arquivos:', files);
    } else {
      console.log('⚠️ [SQUARE CLOUD] Build incompleto detectado');
    }
  }

  // 3. Aguardar um pouco antes de iniciar o servidor
  console.log('⏳ [SQUARE CLOUD] Aguardando 1 segundo antes de iniciar servidor...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 4. Iniciar o servidor
  console.log('🚀 [SQUARE CLOUD] Iniciando servidor...');
  
  // Usar spawn para manter o processo vivo
  const serverProcess = spawn('node', ['server/server.js'], {
    stdio: 'inherit',
    env: { 
      ...process.env,
      NODE_ENV: 'production'
    }
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