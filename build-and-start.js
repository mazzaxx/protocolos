#!/usr/bin/env node

/**
 * SCRIPT DE BUILD E START PARA SQUARE CLOUD - VERSÃO OTIMIZADA PARA 1024MB
 * 
 * Este script executa o build automaticamente se necessário e inicia o servidor.
 * Otimizado para funcionar com apenas 1024MB de RAM na Square Cloud.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 [SQUARE CLOUD] Iniciando sistema otimizado para 1024MB...');

async function executeCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 [SQUARE CLOUD] Executando: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ [SQUARE CLOUD] Comando executado com sucesso: ${command}`);
        resolve(code);
      } else {
        console.error(`❌ [SQUARE CLOUD] Comando falhou com código ${code}: ${command}`);
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      console.error(`❌ [SQUARE CLOUD] Erro ao executar comando:`, error);
      reject(error);
    });
  });
}

async function checkAndBuild() {
  try {
    // 1. Verificar se estamos na Square Cloud
    const isSquareCloud = process.env.NODE_ENV === 'production';
    console.log(`🌍 [SQUARE CLOUD] Ambiente: ${isSquareCloud ? 'PRODUÇÃO (1024MB)' : 'DESENVOLVIMENTO'}`);

    // 2. Verificar se o build existe e é válido
    const distPath = path.join(__dirname, 'dist');
    const indexPath = path.join(distPath, 'index.html');
    
    let needsBuild = false;
    
    if (!fs.existsSync(distPath) || !fs.existsSync(indexPath)) {
      console.log('❌ [SQUARE CLOUD] Build não encontrado, será executado automaticamente');
      needsBuild = true;
    } else {
      // Verificar se é um build real do React
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      if (!indexContent.includes('id="root"') || 
          !indexContent.includes('script') || 
          indexContent.includes('Build necessário') ||
          indexContent.includes('Erro durante o build')) {
        console.log('❌ [SQUARE CLOUD] Build incompleto detectado, será refeito');
        needsBuild = true;
      } else {
        console.log('✅ [SQUARE CLOUD] Build válido encontrado!');
      }
    }

    // 3. Executar build se necessário
    if (needsBuild) {
      console.log('🔨 [SQUARE CLOUD] Executando build do React (otimizado para 1024MB)...');
      
      // Remover pasta dist antiga se existir
      if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true, force: true });
        console.log('🗑️ [SQUARE CLOUD] Pasta dist antiga removida');
      }
      
      try {
        // SQUARE CLOUD: Usar npx para garantir que o Vite seja encontrado
        console.log('🔧 [SQUARE CLOUD] Usando npx vite para build (compatível com 1024MB)...');
        await executeCommand('npx', ['vite', 'build', '--mode', 'production'], {
          env: { 
            ...process.env,
            NODE_ENV: 'production',
            // SQUARE CLOUD: Otimizações para 1024MB
            NODE_OPTIONS: '--max-old-space-size=768', // Usar apenas 768MB para build
            VITE_BUILD_CHUNK_SIZE_LIMIT: '500', // Chunks menores
            VITE_BUILD_ROLLUP_OPTIONS_EXTERNAL: 'true' // Externalizar dependências grandes
          }
        });
      } catch (buildError) {
        console.error('❌ [SQUARE CLOUD] Build com npx falhou, tentando com npm...');
        
        try {
          // Fallback: tentar com npm run build
          await executeCommand('npm', ['run', 'build'], {
            env: { 
              ...process.env,
              NODE_ENV: 'production',
              NODE_OPTIONS: '--max-old-space-size=768'
            }
          });
        } catch (npmError) {
          console.error('❌ [SQUARE CLOUD] Build com npm também falhou, tentando instalação local...');
          
          // Último recurso: instalar vite localmente e tentar build
          try {
            console.log('📦 [SQUARE CLOUD] Instalando Vite localmente...');
            await executeCommand('npm', ['install', 'vite@latest', '--no-save'], {
              env: { 
                ...process.env,
                NODE_OPTIONS: '--max-old-space-size=512'
              }
            });
            
            console.log('🔧 [SQUARE CLOUD] Tentando build com Vite local...');
            await executeCommand('npx', ['vite', 'build'], {
              env: { 
                ...process.env,
                NODE_ENV: 'production',
                NODE_OPTIONS: '--max-old-space-size=768'
              }
            });
          } catch (localError) {
            throw new Error(`Todos os métodos de build falharam: ${localError.message}`);
          }
        }
      }
      
      // Verificar se o build foi bem-sucedido
      if (!fs.existsSync(indexPath)) {
        throw new Error('Build falhou - index.html não foi criado');
      }
      
      const newIndexContent = fs.readFileSync(indexPath, 'utf8');
      if (!newIndexContent.includes('id="root"') || !newIndexContent.includes('script')) {
        throw new Error('Build falhou - conteúdo inválido no index.html');
      }
      
      console.log('✅ [SQUARE CLOUD] Build executado com sucesso (1024MB)!');
      
      // Listar arquivos criados
      const files = fs.readdirSync(distPath);
      console.log('📋 [SQUARE CLOUD] Arquivos do build:', files);
    }

    // 4. Aguardar um pouco antes de iniciar o servidor
    console.log('⏳ [SQUARE CLOUD] Aguardando 1 segundo antes de iniciar servidor...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. Iniciar o servidor
    console.log('🚀 [SQUARE CLOUD] Iniciando servidor Express...');
    
    // Usar spawn para manter o processo vivo
    const serverProcess = spawn('node', ['server/server.js'], {
      stdio: 'inherit',
      env: { 
        ...process.env,
        NODE_ENV: 'production',
        // SQUARE CLOUD: Otimizações de memória para servidor
        NODE_OPTIONS: '--max-old-space-size=256' // Servidor usa apenas 256MB
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

    serverProcess.on('error', (error) => {
      console.error('❌ [SQUARE CLOUD] Erro no servidor:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ [SQUARE CLOUD] Erro crítico:', error.message);
    console.error('Stack:', error.stack);
    
    // Em caso de erro, criar um HTML de erro mais informativo
    const distPath = path.join(__dirname, 'dist');
    const indexPath = path.join(distPath, 'index.html');
    
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
    }
    
    const errorHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Protocolos - Erro de Build</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            max-width: 600px;
            border: 1px solid rgba(255,255,255,0.2);
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
            font-family: 'Courier New', monospace;
            margin: 1rem 0;
            font-size: 14px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .details {
            background: rgba(255,255,255,0.1);
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            text-align: left;
            font-size: 12px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .refresh-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 1rem;
            transition: background 0.3s;
        }
        .refresh-btn:hover {
            background: #45a049;
        }
        .memory-info {
            background: rgba(255,165,0,0.2);
            border: 1px solid rgba(255,165,0,0.3);
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error">🔧</div>
        <h1>⚖️ Sistema de Protocolos Jurídicos</h1>
        <h3>Neycampos Advocacia</h3>
        <p>❌ Erro durante o build automático</p>
        
        <div class="memory-info">
            <strong>⚠️ Limitação de Memória Detectada</strong><br>
            Configuração: 1024MB RAM<br>
            O build pode falhar devido à limitação de memória da hospedagem.
        </div>
        
        <div class="details">
            <strong>Erro:</strong> ${error.message}<br>
            <strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}<br>
            <strong>Ambiente:</strong> Square Cloud Production (1024MB)<br>
            <strong>Solução:</strong> Considere upgrade para plano com mais memória
        </div>
        
        <div class="code">
            Tentativa de build automático falhou.<br>
            Possíveis soluções:<br>
            1. Upgrade para plano com mais RAM (recomendado: 2048MB)<br>
            2. Fazer build local e commitar pasta dist/<br>
            3. Otimizar dependências do projeto
        </div>
        
        <button class="refresh-btn" onclick="window.location.reload()">
            🔄 Tentar Novamente
        </button>
        
        <br><br>
        <p><small>Powered by Square Cloud 🚀</small></p>
        <p><small>Se o problema persistir, considere upgrade de plano</small></p>
    </div>
</body>
</html>`;
    
    fs.writeFileSync(indexPath, errorHtml);
    console.log('🆘 [SQUARE CLOUD] HTML de erro criado (limitação de memória)');
    
    // Ainda assim, tentar iniciar o servidor
    console.log('🚀 [SQUARE CLOUD] Tentando iniciar servidor mesmo com erro...');
    const serverProcess = spawn('node', ['server/server.js'], {
      stdio: 'inherit',
      env: { 
        ...process.env,
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=256'
      }
    });

    serverProcess.on('close', (code) => {
      process.exit(code);
    });
  }
}

// Executar função principal
checkAndBuild();