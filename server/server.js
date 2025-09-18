import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDb, testConnection, getDatabaseStats, closeConnection } from './db.js';
import authRoutes from './auth.js';
import protocolRoutes from './protocols.js';
import adminRoutes from './admin.js';
import { maintenanceDb } from './db.js';

/**
 * SERVIDOR PRINCIPAL
 * 
 * Servidor Express principal para o sistema de protocolos jurídicos.
 * Otimizado para funcionar na Square Cloud.
 * 
 * Funcionalidades principais:
 * - Autenticação de usuários
 * - Gerenciamento de protocolos jurídicos
 * - API REST completa
 * - Banco SQLite otimizado
 * - CORS configurado
 */

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando servidor...');
console.log('🌐 Porta:', PORT);
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
console.log('🗄️ Banco: SQLite Otimizado');

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  
  // Square Cloud domains
  /^https:\/\/.*\.squareweb\.app$/,
];

const corsOptions = {
  origin: function (origin, callback) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🌐 Origin recebido:', origin);
    }
    
    if (!origin) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Permitindo requisição sem origin');
      }
      return callback(null, true);
    }
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Origin permitida:', origin);
      }
      callback(null, true);
    } else {
      console.log('❌ Origin bloqueada:', origin);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Sync-Mode',
    'X-Sync-Action'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400
};

app.use(cors(corsOptions));

const distPath = path.join(__dirname, '..', 'dist');
console.log('📁 Caminho dos arquivos estáticos:', distPath);

// SQUARE CLOUD: Verificar se pasta dist existe e criar se necessário
import fs from 'fs';
if (!fs.existsSync(distPath)) {
  console.warn('⚠️ AVISO: Pasta dist não encontrada!');
  console.warn('💡 Isso é normal durante o primeiro deploy na Square Cloud');
  console.warn('🔄 O build será executado automaticamente...');
  
  // SQUARE CLOUD: Criar estrutura básica se não existir
  try {
    fs.mkdirSync(distPath, { recursive: true });
    fs.writeFileSync(path.join(distPath, 'index.html'), `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sistema de Protocolos - Build em Andamento</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 0;
    }
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      color: white;
    }
    .content {
      text-align: center;
      background: rgba(255,255,255,0.1);
      padding: 2rem;
      border-radius: 10px;
      backdrop-filter: blur(10px);
    }
    .spinner {
      border: 4px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top: 4px solid white;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <div class="spinner"></div>
      <h1>⚖️ Neycampos Advocacia</h1>
      <h2>🔄 Sistema Inicializando...</h2>
      <p>O frontend está sendo preparado pela Square Cloud.</p>
      <p>Aguarde alguns instantes e recarregue a página.</p>
      <p><small>🌐 Square Cloud - Build em andamento</small></p>
      <br>
      <button onclick="location.reload()" style="
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
      ">🔄 Recarregar Página</button>
    </div>
  </div>
  <script>
    // Auto-reload a cada 10 segundos durante o build
    setTimeout(() => {
      location.reload();
    }, 10000);
  </script>
</body>
</html>
    `);
    console.log('✅ Página de build criada temporariamente');
  } catch (error) {
    console.error('❌ Erro ao criar página de build:', error);
  }
} else {
  console.log('✅ Pasta dist encontrada');
  const files = fs.readdirSync(distPath);
  console.log('📋 Arquivos na pasta dist:', files);
}

app.use(express.static(distPath));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  
  if (req.path.includes('/api/') && (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE')) {
    console.log(`📡 ${timestamp} - ${req.method} ${req.path}`);
    console.log('🌐 Origin:', req.headers.origin);
    
    if (req.method === 'POST' || req.method === 'PUT') {
      const bodySize = JSON.stringify(req.body || {}).length;
      if (bodySize > 1000) {
        console.log('📦 Body size:', bodySize, 'chars');
      }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    console.log(`📡 ${req.method} ${req.path}`);
  }
  
  next();
});

app.get('/health', (req, res) => {
  console.log('🏥 Health check solicitado');
  res.json({ 
    message: 'Sistema de Protocolos Jurídicos funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    database: 'SQLite',
    status: 'online'
  });
});


app.use('/api', authRoutes);
app.use('/api', protocolRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', async (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🏥 Health check detalhado solicitado');
  }
  
  try {
    await testConnection();
    
    const stats = await getDatabaseStats();
    
    res.json({
      status: 'healthy',
      message: 'Sistema funcionando perfeitamente',
      timestamp: new Date().toISOString(),
      database: 'connected',
      stats: stats,
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
    });
  } catch (error) {
    console.error('❌ Health check falhou:', error);
    res.status(500).json({
      status: 'unhealthy',
      message: 'Problemas de conectividade',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path === '/health') {
    return res.status(404).json({
      success: false,
      message: 'Rota da API não encontrada',
      path: req.originalUrl,
      method: req.method,
    });
  }
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🌐 Servindo frontend para: ${req.path}`);
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ index.html não encontrado em:', indexPath);
      console.warn('🔄 Aguardando build do frontend...');
    }
    
    // SQUARE CLOUD: Servir página de build em andamento
    const buildPagePath = path.join(distPath, 'build-in-progress.html');
    if (fs.existsSync(buildPagePath)) {
      res.sendFile(buildPagePath);
    } else {
      res.status(503).send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sistema de Protocolos - Build em Andamento</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0; padding: 0; color: white;
    }
    .container { display: flex; justify-content: center; align-items: center; height: 100vh; }
    .content { text-align: center; background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 10px; backdrop-filter: blur(10px); }
    .spinner { border: 4px solid rgba(255,255,255,0.3); border-radius: 50%; border-top: 4px solid white; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <div class="spinner"></div>
      <h1>⚖️ Neycampos Advocacia</h1>
      <h2>🔄 Build em Andamento...</h2>
      <p>O sistema está sendo preparado pela Square Cloud.</p>
      <p>Aguarde alguns instantes e recarregue a página.</p>
      <button onclick="location.reload()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 10px 20px; border-radius: 5px; cursor: pointer;">🔄 Recarregar</button>
    </div>
  </div>
  <script>setTimeout(() => location.reload(), 15000);</script>
</body>
</html>
      `);
    }
  }
});

app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err);
  
  if (err.message === 'Não permitido pelo CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado por política CORS',
      origin: req.headers.origin
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err);
  
  if (err.message === 'Não permitido pelo CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado por política CORS',
      origin: req.headers.origin
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
  });
});

async function startServer() {
  try {
    console.log('🗄️ Inicializando banco SQLite...');
    await initializeDb();
    console.log('✅ Banco SQLite inicializado com sucesso!');
    
    setInterval(async () => {
      console.log('🔧 Manutenção automática do banco...');
      try {
        await maintenanceDb();
        console.log('✅ Manutenção automática concluída');
      } catch (error) {
        console.error('❌ Erro na manutenção automática:', error);
      }
    }, 6 * 60 * 60 * 1000);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🎉 SERVIDOR INICIADO COM SUCESSO!');
      console.log('=' .repeat(50));
      console.log(`🏢 Escritório: Neycampos Advocacia`);
      console.log(`🌐 Frontend: Servindo React SPA na rota raiz (/)`);
      console.log(`🌐 Porta: ${PORT}`);
      console.log(`🔗 URL local: http://localhost:${PORT}`);
      console.log(`🗄️ Banco: SQLite Otimizado`);
      console.log(`⚡ Performance: WAL mode, 15 conexões simultâneas`);
      console.log(`👥 Capacidade: 100+ usuários simultâneos`);
      console.log('=' .repeat(50));
      console.log('📋 API Endpoints disponíveis:');
      console.log('  GET  / - Frontend React (SPA)');
      console.log('  GET  /health - Health check detalhado');
      console.log('  POST /api/login - Login de usuários');
      console.log('  GET  /api/protocolos - Listar protocolos');
      console.log('  POST /api/protocolos - Criar protocolo');
      console.log('  PUT  /api/protocolos/:id - Atualizar protocolo');
      console.log('  GET  /api/admin/funcionarios - Listar funcionários');
      console.log('=' .repeat(50));
      console.log('🔄 Sistema pronto!');
      console.log('⚖️ Neycampos Advocacia - Sistema de Protocolos');
      
      testConnection()
        .then(() => console.log('✅ Conectividade inicial: SUCESSO'))
        .catch(err => console.error('❌ Conectividade inicial: FALHA', err.message));
    });
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao iniciar servidor:', error);
    console.error('💡 Verifique configurações do banco SQLite');
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, encerrando graciosamente...');
  closeConnection().then(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recebido, encerrando graciosamente...');
  closeConnection().then(() => {
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('❌ ERRO NÃO CAPTURADO:', error);
  closeConnection().then(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ PROMISE REJEITADA NÃO TRATADA:', reason);
  console.error('Promise:', promise);
  closeConnection().then(() => {
    process.exit(1);
  });
});

startServer();