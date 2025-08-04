import express from 'express';
import cors from 'cors';
import { initializeDb, testConnection, getDatabaseStats, closeConnection } from './db.js';
import authRoutes from './auth.js';
import protocolRoutes from './protocols.js';
import adminRoutes from './admin.js';

const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 Iniciando servidor Railway otimizado...');
console.log('🌐 Porta:', PORT);
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
console.log('🔗 DATABASE_URL presente:', !!process.env.DATABASE_URL);

// Lista de origens permitidas
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
  maxAge: 86400,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const origin = req.headers.origin;
  
  if (method !== 'OPTIONS') {
    console.log(`📡 ${timestamp.substring(11, 19)} - ${method} ${path} (${origin || 'no-origin'})`);
  }
  
  next();
});

// Health check básico
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Sistema de Protocolos Jurídicos Railway - API funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    status: 'healthy',
    version: '3.0.0',
    database: 'PostgreSQL Railway'
  });
});

// Health check detalhado
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('🏥 Executando health check Railway...');
    
    // Teste de conectividade com timeout menor
    await Promise.race([
      testConnection(1), // Apenas 1 tentativa no health check
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 8000)
      )
    ]);
    
    const stats = await getDatabaseStats();
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Health check Railway OK (${responseTime}ms)`);
    
    res.status(200).json({
      status: 'healthy',
      message: 'Sistema Railway funcionando perfeitamente',
      timestamp: new Date().toISOString(),
      database: 'connected',
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      uptime: process.uptime(),
      stats,
      version: '3.0.0',
      railway: {
        connected: true,
        databaseUrl: !!process.env.DATABASE_URL
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Health check Railway falhou (${responseTime}ms):`, error.message);
    
    res.status(503).json({
      status: 'unhealthy',
      message: 'Problemas de conectividade Railway',
      error: error.message,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      version: '3.0.0',
      railway: {
        connected: false,
        databaseUrl: !!process.env.DATABASE_URL,
        errorType: error.message.includes('timeout') ? 'timeout' : 'connection'
      }
    });
  }
});

// Ping endpoint
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
    version: '3.0.0'
  });
});

// Rotas da API
app.use('/api', authRoutes);
app.use('/api', protocolRoutes);
app.use('/api/admin', adminRoutes);

// Middleware de tratamento de erros
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

// 404 handler
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
      'DELETE /api/protocolos/:id'
    ]
  });
});

// Função para inicializar servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor Railway...');
    
    // Iniciar servidor primeiro (para Railway health checks)
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🎉 SERVIDOR RAILWAY INICIADO!');
      console.log('=' .repeat(60));
      console.log(`🌐 Servidor: https://sistema-protocolos-juridicos-production.up.railway.app`);
      console.log(`🏥 Health: https://sistema-protocolos-juridicos-production.up.railway.app/health`);
      console.log(`🎯 Frontend: https://ncasistemaprotocolos.netlify.app`);
      console.log(`⚡ Porta: ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 DATABASE_URL: ${process.env.DATABASE_URL ? 'PRESENTE' : 'AUSENTE'}`);
      console.log('=' .repeat(60));
    });
    
    // Configurar timeouts
    server.timeout = 60000; // 60 segundos
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    
    // Inicializar banco em background com retry
    console.log('🗄️ Inicializando banco Railway em background...');
    
    const initializeDatabase = async () => {
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        attempts++;
        try {
          console.log(`🔄 Inicialização Railway - Tentativa ${attempts}/${maxAttempts}`);
          await initializeDb();
          console.log('✅ Banco Railway inicializado com sucesso!');
          
          // Health check periódico
          setInterval(async () => {
            try {
              await testConnection(1);
              console.log('✅ Health check periódico Railway: OK');
            } catch (error) {
              console.error('❌ Health check periódico Railway: FALHA', error.message);
            }
          }, 120000); // A cada 2 minutos
          
          return;
        } catch (error) {
          console.error(`❌ Tentativa ${attempts}/${maxAttempts} falhou:`, error.message);
          
          if (attempts < maxAttempts) {
            const delay = Math.min(5000 * attempts, 15000);
            console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error('❌ AVISO: Banco Railway não inicializado após todas as tentativas');
            console.error('⚠️ Servidor rodando, mas funcionalidades podem não funcionar');
            console.error('🔧 Verifique se DATABASE_URL está configurada corretamente');
          }
        }
      }
    };
    
    // Executar inicialização em background
    initializeDatabase().catch(error => {
      console.error('❌ Erro crítico na inicialização Railway:', error);
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`🛑 ${signal} recebido - encerrando Railway graciosamente...`);
      
      server.close(() => {
        console.log('🔒 Servidor HTTP Railway fechado');
        closeConnection().then(() => {
          console.log('🔒 Conexões Railway fechadas');
          process.exit(0);
        }).catch(() => {
          process.exit(1);
        });
      });
      
      // Force exit após 15 segundos
      setTimeout(() => {
        console.log('⏰ Forçando encerramento Railway...');
        process.exit(1);
      }, 15000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao iniciar servidor Railway:', error);
    process.exit(1);
  }
}

// Tratamento de exceções não capturadas
process.on('uncaughtException', (error) => {
  console.error('❌ EXCEÇÃO NÃO CAPTURADA Railway:', error);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ PROMISE REJEITADA Railway:', reason);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Iniciar servidor
startServer();