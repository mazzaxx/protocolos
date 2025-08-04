import express from 'express';
import cors from 'cors';
import { initializeDb, testConnection, getDatabaseStats, closeConnection } from './db.js';
import authRoutes from './auth.js';
import protocolRoutes from './protocols.js';
import adminRoutes from './admin.js';

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Iniciando servidor otimizado...');
console.log('🌐 Porta:', PORT);
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');

// Lista otimizada de origens permitidas
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://ncasistemaprotocolos.netlify.app',
  'https://sistema-protocolos-juridicos-production.up.railway.app',
  // Regex para subdomínios
  /^https:\/\/.*\.netlify\.app$/,
  /^https:\/\/.*\.up\.railway\.app$/
];

// CORS otimizado
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar origins permitidas
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log('✅ CORS permitido:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS bloqueado:', origin);
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
  exposedHeaders: ['Content-Length'],
  maxAge: 86400, // 24 horas
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware otimizado
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de logging otimizado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const origin = req.headers.origin;
  
  // Log apenas para requests importantes
  if (method !== 'OPTIONS') {
    console.log(`📡 ${timestamp.substring(11, 19)} - ${method} ${path} (${origin || 'no-origin'})`);
  }
  
  next();
});

// Health check básico (otimizado)
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Sistema de Protocolos Jurídicos - API funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    status: 'healthy',
    version: '2.0.0'
  });
});

// Health check detalhado (otimizado)
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Teste rápido de conectividade
    await Promise.race([
      testConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health timeout')), 5000)
      )
    ]);
    
    const stats = await getDatabaseStats();
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Health check OK (${responseTime}ms)`);
    
    res.status(200).json({
      status: 'healthy',
      message: 'Sistema funcionando perfeitamente',
      timestamp: new Date().toISOString(),
      database: 'connected',
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      uptime: process.uptime(),
      stats,
      version: '2.0.0'
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Health check falhou (${responseTime}ms):`, error);
    
    res.status(503).json({
      status: 'unhealthy',
      message: 'Problemas de conectividade',
      error: error.message,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      version: '2.0.0'
    });
  }
});

// Ping endpoint para monitoramento
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Status do ambiente
app.get('/env-check', (req, res) => {
  res.status(200).json({
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: PORT,
    HAS_DATABASE_URL: !!process.env.DATABASE_URL,
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'unknown',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Rotas da API
app.use('/api', authRoutes);
app.use('/api', protocolRoutes);
app.use('/api/admin', adminRoutes);

// Middleware de tratamento de erros otimizado
app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err.message);
  
  if (err.message === 'Não permitido pelo CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado por política CORS',
      origin: req.headers.origin,
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno',
    timestamp: new Date().toISOString()
  });
});

// 404 handler otimizado
app.use('*', (req, res) => {
  console.log(`❌ Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /ping',
      'POST /api/login',
      'GET /api/protocolos',
      'POST /api/protocolos',
      'PUT /api/protocolos/:id',
      'DELETE /api/protocolos/:id',
      'GET /api/admin/funcionarios',
      'POST /api/admin/funcionarios',
      'PUT /api/admin/funcionarios/:id',
      'DELETE /api/admin/funcionarios/:id'
    ]
  });
});

// Função para inicializar servidor otimizado
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor Railway otimizado...');
    
    // Iniciar servidor primeiro (para Railway health checks)
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🎉 SERVIDOR RAILWAY INICIADO!');
      console.log('=' .repeat(60));
      console.log(`🌐 Servidor: https://sistema-protocolos-juridicos-production.up.railway.app`);
      console.log(`🏥 Health: https://sistema-protocolos-juridicos-production.up.railway.app/health`);
      console.log(`🎯 Frontend: https://ncasistemaprotocolos.netlify.app`);
      console.log(`⚡ Porta: ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log('=' .repeat(60));
    });
    
    // Configurar timeouts otimizados
    server.timeout = 30000; // 30 segundos
    server.keepAliveTimeout = 65000; // 65 segundos
    server.headersTimeout = 66000; // 66 segundos
    
    // Inicializar banco em background
    console.log('🗄️ Inicializando banco em background...');
    
    const initializeDatabase = async () => {
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        attempts++;
        try {
          console.log(`🔄 Inicialização do banco - Tentativa ${attempts}/${maxAttempts}`);
          await initializeDb();
          console.log('✅ Banco inicializado com sucesso!');
          
          // Health check periódico
          setInterval(async () => {
            try {
              await testConnection();
              console.log('✅ Health check periódico: OK');
            } catch (error) {
              console.error('❌ Health check periódico: FALHA', error.message);
            }
          }, 60000); // A cada 1 minuto
          
          return;
        } catch (error) {
          console.error(`❌ Tentativa ${attempts}/${maxAttempts} falhou:`, error.message);
          
          if (attempts < maxAttempts) {
            const delay = Math.min(3000 * attempts, 10000);
            console.log(`⏳ Aguardando ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error('❌ AVISO: Banco não inicializado após todas as tentativas');
            console.error('⚠️ Servidor rodando, mas funcionalidades podem não funcionar');
          }
        }
      }
    };
    
    // Executar inicialização em background
    initializeDatabase().catch(error => {
      console.error('❌ Erro crítico na inicialização:', error);
    });
    
    // Graceful shutdown otimizado
    const gracefulShutdown = (signal) => {
      console.log(`🛑 ${signal} recebido - encerrando graciosamente...`);
      
      server.close(() => {
        console.log('🔒 Servidor HTTP fechado');
        closeConnection().then(() => {
          console.log('🔒 Conexões do banco fechadas');
          process.exit(0);
        }).catch(() => {
          process.exit(1);
        });
      });
      
      // Force exit após 10 segundos
      setTimeout(() => {
        console.log('⏰ Forçando encerramento...');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de exceções não capturadas
process.on('uncaughtException', (error) => {
  console.error('❌ EXCEÇÃO NÃO CAPTURADA:', error);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ PROMISE REJEITADA:', reason);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Iniciar servidor
startServer();