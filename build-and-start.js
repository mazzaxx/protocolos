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

  // 3. SEMPRE executar o build em produção
  const distPath = path.join(__dirname, 'dist');
  const indexPath = path.join(distPath, 'index.html');
  
  console.log('🔨 [SQUARE CLOUD] Executando build obrigatório...');
  
  // Remover dist antigo se existir
  if (fs.existsSync(distPath)) {
    console.log('🗑️ [SQUARE CLOUD] Removendo build antigo...');
    fs.rmSync(distPath, { recursive: true, force: true });
  }
  
  // Executar build com tratamento de erro melhorado
  try {
    console.log('🔨 [SQUARE CLOUD] Executando: npm run build');
    execSync('npm run build', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    console.log('✅ [SQUARE CLOUD] Build concluído com sucesso!');
  } catch (buildError) {
    console.error('❌ [SQUARE CLOUD] Erro no build:', buildError.message);
    
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
            font-size: 48px;
            margin-bottom: 1rem;
        }
        .retry-btn {
            background: white;
            color: #667eea;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 1rem;
        }
        .retry-btn:hover {
            background: #f0f0f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error">⚠️</div>
        <h1>⚖️ Sistema de Protocolos Jurídicos</h1>
        <h3>Neycampos Advocacia</h3>
        <p>❌ Erro no build da aplicação</p>
        <p><small>O build do React falhou na Square Cloud</small></p>
        <button class="retry-btn" onclick="window.location.reload()">
            🔄 Tentar Novamente
        </button>
        <br><br>
        <p><small>Powered by Square Cloud 🚀</small></p>
    </div>
</body>
</html>`;
    
    fs.writeFileSync(indexPath, fallbackHtml);
    console.log('🆘 [SQUARE CLOUD] Fallback de erro criado');
  }

  // 4. Verificar se o build foi bem-sucedido
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    if (indexContent.includes('id="root"') && indexContent.includes('script')) {
      console.log('✅ [SQUARE CLOUD] Build do React concluído com sucesso!');
      console.log('📁 [SQUARE CLOUD] Arquivos gerados em:', distPath);
      
      const files = fs.readdirSync(distPath);
      console.log('📋 [SQUARE CLOUD] Arquivos:', files);
    } else {
      console.log('⚠️ [SQUARE CLOUD] Build incompleto, usando fallback');
    }
  } else {
    console.error('❌ [SQUARE CLOUD] Nenhum arquivo index.html encontrado após build');
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

  serverProcess.on('error', (error) => {
    console.error('❌ [SQUARE CLOUD] Erro no processo do servidor:', error);
    process.exit(1);
  });

} catch (error) {
  console.error('❌ [SQUARE CLOUD] Erro crítico:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}