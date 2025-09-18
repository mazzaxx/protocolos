#!/usr/bin/env node

/**
 * SCRIPT DE BUILD E START PARA SQUARE CLOUD - VERSÃO CORRIGIDA
 * 
 * Este script garante que o build seja executado corretamente
 * e depois inicia o servidor na Square Cloud.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 [SQUARE CLOUD] Iniciando processo de build e start (versão corrigida)...');

try {
  // 1. Verificar se estamos na Square Cloud
  const isSquareCloud = process.env.NODE_ENV === 'production';
  console.log(`🌍 [SQUARE CLOUD] Ambiente: ${isSquareCloud ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);

  // 2. Verificar se node_modules existe
  if (!fs.existsSync('node_modules')) {
    console.log('📦 [SQUARE CLOUD] Instalando dependências...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // 3. Executar build obrigatoriamente
  const distPath = path.join(__dirname, 'dist');
  
  console.log('🔨 [SQUARE CLOUD] Executando build obrigatório...');
  
  try {
    // Limpar dist se existir
    if (fs.existsSync(distPath)) {
      console.log('🧹 [SQUARE CLOUD] Limpando pasta dist existente...');
      fs.rmSync(distPath, { recursive: true, force: true });
    }
    
    console.log('🔨 [SQUARE CLOUD] Executando: npm run build');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Verificar se o build foi bem-sucedido
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('✅ [SQUARE CLOUD] Build concluído com sucesso!');
      const files = fs.readdirSync(distPath);
      console.log('📋 [SQUARE CLOUD] Arquivos gerados:', files.slice(0, 10));
    } else {
      throw new Error('Build falhou - index.html não encontrado');
    }
    
  } catch (buildError) {
    console.error('❌ [SQUARE CLOUD] Erro no build:', buildError.message);
    
    // Criar fallback apenas se o build falhar
    console.log('🆘 [SQUARE CLOUD] Criando fallback de emergência...');
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
    }
    
    const fallbackHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Protocolos - Erro de Build</title>
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
            margin: 1rem 0;
        }
        .retry-btn {
            background: white;
            color: #667eea;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚖️ Sistema de Protocolos Jurídicos</h1>
        <h3>Neycampos Advocacia</h3>
        <div class="error">
            <p>❌ Erro no processo de build</p>
            <p><small>O sistema não pôde ser compilado corretamente</small></p>
        </div>
        <p>🔧 Tentando recompilação automática...</p>
        <button class="retry-btn" onclick="window.location.reload()">
            Tentar Novamente
        </button>
        <br><br>
        <p><small>Powered by Square Cloud 🚀</small></p>
    </div>
    <script>
        // Tentar recarregar automaticamente após 30 segundos
        setTimeout(() => {
            window.location.reload();
        }, 30000);
    </script>
</body>
</html>`;
    
    fs.writeFileSync(path.join(distPath, 'index.html'), fallbackHtml);
    console.log('🆘 [SQUARE CLOUD] Fallback de emergência criado');
  }

  // 4. Iniciar o servidor
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

  serverProcess.on('error', (error) => {
    console.error('❌ [SQUARE CLOUD] Erro no processo do servidor:', error);
    process.exit(1);
  });

} catch (error) {
  console.error('❌ [SQUARE CLOUD] Erro crítico:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}