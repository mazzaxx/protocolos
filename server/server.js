import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDb, testConnection, getDatabaseStats, closeConnection } from './db.js';
import authRoutes from './auth.js';
import protocolRoutes from './protocols.js';
import adminRoutes from './admin.js';
import { maintenanceDb } from './db.js';

/**
 * SERVIDOR COMPLETO PARA SQUARE CLOUD
 * 
 * Sistema jurídico completo com frontend React + backend Node.js
 * Hospedado inteiramente na Square Cloud no mesmo domínio
 * 
 * CARACTERÍSTICAS:
 * - Frontend React servido estaticamente
 * - Backend Node.js com SQLite
 * - Porta 80 para Square Cloud
 * - Host 0.0.0.0 para aceitar conexões externas
 * - CORS configurado para Square Cloud
 */

const app = express();
const PORT = process.env.PORT || 80;
const HOST = process.env.HOST || '0.0.0.0';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 [SQUARE CLOUD] Iniciando Sistema Jurídico Completo...');
console.log('🌐 [SQUARE CLOUD] Porta:', PORT);
console.log('🌍 [SQUARE CLOUD] Host:', HOST);
console.log('🗄️ [SQUARE CLOUD] Banco: SQLite Otimizado');
console.log('☁️ [SQUARE CLOUD] Plataforma: Square Cloud Brasil');

/**
 * CONFIGURAÇÃO DE CORS PARA SQUARE CLOUD
 * 
 * Permite acesso do próprio domínio e desenvolvimento local
 */
const allowedOrigins = [
  // Square Cloud - será o domínio real da aplicação
  /^https:\/\/.*\.squareweb\.app$/,
  // Desenvolvimento local
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (apps mobile, Postman)
    if (!origin) return callback(null, true);
    
    // Verificar se a origin está na lista permitida
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else {
        return allowedOrigin.test(origin);
      }
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('❌ [SQUARE CLOUD] CORS bloqueado para:', origin);
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
    'X-Sync-Action',
    'X-Platform',
    'X-Client-Type'
  ],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400
};

app.use(cors(corsOptions));

/**
 * SERVIR ARQUIVOS ESTÁTICOS DO FRONTEND REACT
 * 
 * O frontend buildado fica na pasta 'dist'
 * Square Cloud serve tudo do mesmo domínio
 */
const distPath = path.join(__dirname, '..', 'dist');
console.log('📁 [SQUARE CLOUD] Pasta do frontend:', distPath);

// Servir arquivos estáticos
app.use(express.static(distPath, {
  maxAge: '1d', // Cache de 1 dia para arquivos estáticos
  etag: true
}));

/**
 * MIDDLEWARE DE PARSING
 */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * MIDDLEWARE DE LOGGING OTIMIZADO
 */
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  
  // Log apenas operações importantes
  if (req.path.includes('/api/') || req.path === '/health') {
    console.log(`📡 [SQUARE CLOUD] ${timestamp} - ${req.method} ${req.path}`);
  }
  
  next();
});

/**
 * ROTAS DA API
 */
app.use('/api', authRoutes);
app.use('/api', protocolRoutes);
app.use('/api/admin', adminRoutes);

/**
 * HEALTH CHECK PARA MONITORAMENTO
 */
app.get('/health', async (req, res) => {
  try {
    await testConnection();
    const stats = await getDatabaseStats();
    
    res.json({
      status: 'healthy',
      message: 'Sistema Jurídico funcionando na Square Cloud',
      timestamp: new Date().toISOString(),
      database: 'connected',
      stats: stats,
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      host: HOST,
      platform: 'Square Cloud',
      region: 'Brasil'
    });
  } catch (error) {
    console.error('❌ [SQUARE CLOUD] Health check falhou:', error);
    res.status(500).json({
      status: 'unhealthy',
      message: 'Problemas no sistema',
      error: error.message,
      timestamp: new Date().toISOString(),
      platform: 'Square Cloud'
    });
  }
});

/**
 * ROTA CATCH-ALL PARA SPA REACT
 * 
 * CRÍTICO: Todas as rotas não-API devem retornar o index.html
 * para que o React Router funcione corretamente
 */
app.get('*', (req, res) => {
  // Não servir index.html para rotas da API
  if (req.path.startsWith('/api/') || req.path === '/health') {
    return res.status(404).json({
      success: false,
      message: 'Rota da API não encontrada',
      path: req.originalUrl,
      method: req.method,
      platform: 'Square Cloud'
    });
  }
  
  // Servir index.html para todas as outras rotas (React Router)
  const indexPath = path.join(distPath, 'index.html');
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ [SQUARE CLOUD] Erro ao servir index.html:', err);
      res.status(500).json({
        success: false,
        message: 'Frontend não encontrado - Execute npm run build',
        path: indexPath,
        platform: 'Square Cloud'
      });
    }
  });
});

/**
 * TRATAMENTO DE ERROS GLOBAL
 */
app.use((err, req, res, next) => {
  console.error('❌ [SQUARE CLOUD] Erro no servidor:', err);
  
  if (err.message === 'Não permitido pelo CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado por política CORS',
      origin: req.headers.origin,
      platform: 'Square Cloud'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno',
    platform: 'Square Cloud'
  });
});

/**
 * INICIALIZAÇÃO DO SERVIDOR
 */
async function startServer() {
  try {
    console.log('🗄️ [SQUARE CLOUD] Inicializando banco SQLite...');
    await initializeDb();
    console.log('✅ [SQUARE CLOUD] Banco SQLite inicializado!');
    
    // Manutenção automática do banco a cada 6 horas
    setInterval(async () => {
      try {
        await maintenanceDb();
        console.log('✅ [SQUARE CLOUD] Manutenção automática concluída');
      } catch (error) {
        console.error('❌ [SQUARE CLOUD] Erro na manutenção:', error);
      }
    }, 6 * 60 * 60 * 1000);
    
    // Iniciar servidor
    app.listen(PORT, HOST, () => {
      console.log('🎉 [SQUARE CLOUD] SISTEMA INICIADO COM SUCESSO!');
      console.log('=' .repeat(60));
      console.log(`☁️  Plataforma: Square Cloud (Brasil)`);
      console.log(`🌐 URL: https://seu-app.squareweb.app`);
      console.log(`🚀 Servidor: ${HOST}:${PORT}`);
      console.log(`📱 Frontend: React SPA servido estaticamente`);
      console.log(`🔧 Backend: Node.js + Express + SQLite`);
      console.log(`🗄️ Banco: SQLite com WAL mode`);
      console.log(`👥 Capacidade: 100+ usuários simultâneos`);
      console.log(`🇧🇷 Região: Brasil (baixa latência)`);
      console.log('=' .repeat(60));
      console.log('📋 Endpoints disponíveis:');
      console.log('  GET  / - Frontend React (SPA)');
      console.log('  GET  /health - Health check');
      console.log('  POST /api/login - Login');
      console.log('  GET  /api/protocolos - Listar protocolos');
      console.log('  POST /api/protocolos - Criar protocolo');
      console.log('  GET  /api/admin/funcionarios - Funcionários');
      console.log('=' .repeat(60));
      console.log('🔄 Sistema pronto para uso!');
      
      // Teste inicial
      testConnection()
        .then(() => console.log('✅ [SQUARE CLOUD] Conectividade: OK'))
        .catch(err => console.error('❌ [SQUARE CLOUD] Conectividade: ERRO', err.message));
    });
  } catch (error) {
    console.error('❌ [SQUARE CLOUD] ERRO CRÍTICO:', error);
    process.exit(1);
  }
}

/**
 * TRATAMENTO DE SINAIS DO SISTEMA
 */
process.on('SIGTERM', () => {
  console.log('🛑 [SQUARE CLOUD] SIGTERM recebido, encerrando...');
  closeConnection().then(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('🛑 [SQUARE CLOUD] SIGINT recebido, encerrando...');
  closeConnection().then(() => process.exit(0));
});

process.on('uncaughtException', (error) => {
  console.error('❌ [SQUARE CLOUD] ERRO NÃO CAPTURADO:', error);
  closeConnection().then(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [SQUARE CLOUD] PROMISE REJEITADA:', reason);
  closeConnection().then(() => process.exit(1));
});

// Iniciar servidor
startServer();