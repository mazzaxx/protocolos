#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

console.log('🚀 [SQUARE CLOUD] Iniciando build otimizado para 4GB RAM...');
console.log('💾 [SQUARE CLOUD] Configuração: 4096MB RAM disponível');

// Função para executar comandos com melhor tratamento de erro
async function runCommand(command, description) {
  console.log(`🔧 [SQUARE CLOUD] ${description}...`);
  console.log(`🔧 [SQUARE CLOUD] Executando: ${command}`);
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=3072', // 3GB para build
        NODE_ENV: 'production'
      }
    });
    
    if (stdout) console.log(`✅ [SQUARE CLOUD] ${stdout}`);
    if (stderr && !stderr.includes('warn')) console.log(`⚠️ [SQUARE CLOUD] ${stderr}`);
    
    console.log(`✅ [SQUARE CLOUD] Comando executado com sucesso: ${command.split(' ')[0]}`);
    return true;
  } catch (error) {
    console.log(`❌ [SQUARE CLOUD] Comando falhou com código ${error.code}: ${command.split(' ')[0]}`);
    if (error.stdout) console.log(`📤 [SQUARE CLOUD] stdout: ${error.stdout}`);
    if (error.stderr) console.log(`📤 [SQUARE CLOUD] stderr: ${error.stderr}`);
    return false;
  }
}

// Função para verificar se o build foi bem-sucedido
function checkBuildSuccess() {
  const distPath = path.join(process.cwd(), 'dist');
  const indexPath = path.join(distPath, 'index.html');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ [SQUARE CLOUD] Pasta dist não encontrada');
    return false;
  }
  
  if (!fs.existsSync(indexPath)) {
    console.log('❌ [SQUARE CLOUD] index.html não encontrado');
    return false;
  }
  
  // Verificar se o index.html não é apenas um fallback de erro
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (indexContent.includes('Erro durante o build automático') || indexContent.length < 500) {
    console.log('❌ [SQUARE CLOUD] Build incompleto detectado');
    return false;
  }
  
  const files = fs.readdirSync(distPath);
  console.log('📁 [SQUARE CLOUD] Arquivos no dist:', files);
  
  // Verificar se há arquivos JS e CSS
  const hasJS = files.some(file => file.endsWith('.js'));
  const hasCSS = files.some(file => file.endsWith('.css'));
  
  if (!hasJS || !hasCSS) {
    console.log('⚠️ [SQUARE CLOUD] Build pode estar incompleto (faltam JS/CSS)');
    return false;
  }
  
  console.log('✅ [SQUARE CLOUD] Build verificado com sucesso');
  return true;
}

// Função para criar HTML de fallback em caso de erro
function createFallbackHTML() {
  const distPath = path.join(process.cwd(), 'dist');
  const indexPath = path.join(distPath, 'index.html');
  
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
  }
  
  const fallbackHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Protocolos Jurídicos - Neycampos Advocacia</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            padding: 20px;
        }
        .container { 
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 600px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .icon { font-size: 4rem; margin-bottom: 20px; }
        h1 { font-size: 2rem; margin-bottom: 10px; font-weight: 600; }
        h2 { font-size: 1.2rem; margin-bottom: 30px; opacity: 0.9; font-weight: 400; }
        .error { 
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .info { 
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }
        .warning { 
            background: rgba(245, 158, 11, 0.2);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .btn { 
            background: #10b981;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            margin: 10px;
            transition: all 0.3s;
        }
        .btn:hover { background: #059669; transform: translateY(-2px); }
        .footer { margin-top: 30px; opacity: 0.7; font-size: 0.9rem; }
        ul { text-align: left; margin: 10px 0; }
        li { margin: 5px 0; }
        .timestamp { font-size: 0.8rem; opacity: 0.6; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">⚖️</div>
        <h1>Sistema de Protocolos Jurídicos</h1>
        <h2>Neycampos Advocacia</h2>
        
        <div class="error">
            <h3>❌ Erro durante o build automático</h3>
        </div>
        
        <div class="warning">
            <h3>⚠️ Limitação de Memória Detectada</h3>
            <p><strong>Configuração:</strong> 4096MB RAM</p>
            <p>O build pode falhar devido à limitação de memória da hospedagem.</p>
        </div>
        
        <div class="info">
            <p><strong>Erro:</strong> Todos os métodos de build falharam: Command failed with code 1</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Ambiente:</strong> Square Cloud Production (4096MB)</p>
            <p><strong>Solução:</strong> Considere upgrade para plano com mais memória</p>
        </div>
        
        <div class="info">
            <h4>Tentativa de build automático falhou.</h4>
            <p><strong>Possíveis soluções:</strong></p>
            <ul>
                <li>1. Upgrade para plano com mais RAM (recomendado: 4096MB+)</li>
                <li>2. Fazer build local e commitar pasta dist/</li>
                <li>3. Otimizar dependências do projeto</li>
            </ul>
        </div>
        
        <button class="btn" onclick="window.location.reload()">🔄 Tentar Novamente</button>
        
        <div class="footer">
            <p>Powered by Square Cloud 🚀</p>
            <p>Se o problema persistir, considere upgrade de plano</p>
            <div class="timestamp">Build falhou em: ${new Date().toISOString()}</div>
        </div>
    </div>
</body>
</html>`;
  
  fs.writeFileSync(indexPath, fallbackHTML);
  console.log('🆘 [SQUARE CLOUD] HTML de erro criado (4GB RAM disponível)');
}

// Função principal de build
async function checkAndBuild() {
  console.log('🔍 [SQUARE CLOUD] Verificando se build é necessário...');
  
  // Verificar se já existe um build válido
  if (checkBuildSuccess()) {
    console.log('✅ [SQUARE CLOUD] Build válido encontrado, pulando rebuild');
    return true;
  }
  
  console.log('🔨 [SQUARE CLOUD] Iniciando processo de build otimizado...');
  console.log('💾 [SQUARE CLOUD] RAM disponível: 4096MB');
  console.log('⚙️ [SQUARE CLOUD] Node options: --max-old-space-size=3072');
  
  // Limpar cache antes do build
  console.log('🧹 [SQUARE CLOUD] Limpando cache...');
  try {
    await execAsync('rm -rf node_modules/.vite dist');
    console.log('✅ [SQUARE CLOUD] Cache limpo');
  } catch (error) {
    console.log('⚠️ [SQUARE CLOUD] Erro ao limpar cache (continuando...)');
  }
  
  // Método 1: Tentar com npx vite build
  console.log('🔧 [SQUARE CLOUD] Método 1: Build com npx vite...');
  const method1 = await runCommand('npx vite build', 'Build com npx vite');
  
  if (method1 && checkBuildSuccess()) {
    console.log('✅ [SQUARE CLOUD] Build bem-sucedido com npx vite!');
    return true;
  }
  
  // Método 2: Tentar com npm run build
  console.log('🔧 [SQUARE CLOUD] Método 2: Build com npm...');
  const method2 = await runCommand('npm run build', 'Build com npm');
  
  if (method2 && checkBuildSuccess()) {
    console.log('✅ [SQUARE CLOUD] Build bem-sucedido com npm!');
    return true;
  }
  
  // Método 3: Instalar vite localmente e tentar novamente
  console.log('📦 [SQUARE CLOUD] Método 3: Instalando Vite localmente...');
  const installVite = await runCommand('npm install vite@latest --no-save', 'Instalação do Vite');
  
  if (installVite) {
    console.log('🔧 [SQUARE CLOUD] Tentando build com Vite local...');
    const method3 = await runCommand('npx vite build', 'Build com Vite local');
    
    if (method3 && checkBuildSuccess()) {
      console.log('✅ [SQUARE CLOUD] Build bem-sucedido com Vite local!');
      return true;
    }
  }
  
  // Método 4: Build com mais memória
  console.log('🔧 [SQUARE CLOUD] Método 4: Build com configuração de memória otimizada...');
  const method4 = await runCommand('NODE_OPTIONS="--max-old-space-size=3072" npx vite build', 'Build com mais memória');
  
  if (method4 && checkBuildSuccess()) {
    console.log('✅ [SQUARE CLOUD] Build bem-sucedido com configuração otimizada!');
    return true;
  }
  
  // Se todos os métodos falharam
  console.log('❌ [SQUARE CLOUD] Todos os métodos de build falharam');
  createFallbackHTML();
  throw new Error('Todos os métodos de build falharam: Command failed with code 1');
}

// Função para iniciar o servidor
function startServer() {
  console.log('🚀 [SQUARE CLOUD] Iniciando servidor...');
  
  const server = spawn('node', ['server/server.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: process.env.PORT || 80,
      SQUARE_CLOUD: 'true'
    }
  });
  
  server.on('error', (error) => {
    console.error('❌ [SQUARE CLOUD] Erro ao iniciar servidor:', error);
    process.exit(1);
  });
  
  server.on('exit', (code) => {
    console.log(`🛑 [SQUARE CLOUD] Servidor encerrado com código: ${code}`);
    if (code !== 0) {
      process.exit(code);
    }
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 [SQUARE CLOUD] SIGTERM recebido, encerrando...');
    server.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 [SQUARE CLOUD] SIGINT recebido, encerrando...');
    server.kill('SIGINT');
  });
}

// Execução principal
async function main() {
  try {
    console.log('🎯 [SQUARE CLOUD] Iniciando deploy otimizado para 4GB RAM...');
    console.log('📊 [SQUARE CLOUD] Configurações:');
    console.log('   - RAM: 4096MB');
    console.log('   - Node Memory: 3072MB');
    console.log('   - Build: Automático otimizado');
    console.log('   - Cache: Habilitado');
    
    await checkAndBuild();
    console.log('✅ [SQUARE CLOUD] Build concluído, iniciando servidor...');
    startServer();
  } catch (error) {
    console.error('❌ [SQUARE CLOUD] Erro crítico:', error.message);
    console.error('Stack:', error.stack);
    createFallbackHTML();
    console.log('🚀 [SQUARE CLOUD] Tentando iniciar servidor mesmo com erro...');
    startServer();
  }
}

// Iniciar
main();