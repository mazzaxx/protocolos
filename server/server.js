import express from 'express';
import cors from 'cors';
import { initializeDb, testConnection, getDatabaseStats, closeConnection, query } from './db.js';
import authRoutes from './auth.js';
import protocolRoutes from './protocols.js';
import adminRoutes from './admin.js';

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Iniciando servidor...');
console.log('🌐 Porta:', PORT);
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');

// Lista de origens permitidas para CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://ncasistemaprotocolos.netlify.app',
  'https://sistema-protocolos-juridicos-production.up.railway.app',
  // Permitir qualquer subdomínio do Netlify para flexibilidade
  /^https:\/\/.*\.netlify\.app$/,
  // Permitir qualquer subdomínio do Railway para flexibilidade
  /^https:\/\/.*\.up\.railway\.app$/
];

// Configuração CORS mais permissiva
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🌐 CORS - Origin recebido:', origin);
    
    // Permitir requisições sem origin (ex: Postman, aplicações mobile)
    if (!origin) {
      console.log('✅ CORS - Permitindo requisição sem origin');
      return callback(null, true);
    }
    
    // Verificar se a origin está na lista permitida
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log('✅ CORS - Origin permitida:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS - Origin bloqueada:', origin);
      console.log('📋 Origins permitidas:', allowedOrigins);
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
  maxAge: 86400 // 24 horas
};

// Aplicar CORS
app.use(cors(corsOptions));

// Middleware para parsing JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📡 ${timestamp} - ${req.method} ${req.path}`);
  console.log('🌐 Origin:', req.headers.origin);
  console.log('🔗 Referer:', req.headers.referer);
  console.log('🌍 User-Agent:', req.headers['user-agent']?.substring(0, 100));
  
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('📦 Body size:', JSON.stringify(req.body).length, 'chars');
  }
  
  next();
});

// Rota de health check básica
app.get('/', (req, res) => {
  console.log('🏥 Health check básico solicitado');
  res.status(200).json({ 
    message: 'Servidor de autenticação funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    status: 'healthy'
  });
});

// Rota de health check específica (Railway usa esta)
app.get('/health', async (req, res) => {
  console.log('🏥 Health check detalhado solicitado');
  
  const startTime = Date.now();
  
  try {
    // Teste básico de conectividade (mais rápido)
    const basicTest = await Promise.race([
      query("SELECT 1 as test", [], 1),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 8000))
    ]);
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ Health check passou - banco conectado');
    
    res.status(200).json({
      status: 'healthy',
      message: 'Servidor funcionando perfeitamente',
      timestamp: new Date().toISOString(),
      database: 'connected',
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('❌ Health check falhou:', error);
    const responseTime = Date.now() - startTime;
    
    res.status(503).json({
      status: 'unhealthy',
      message: 'Problemas de conectividade com banco',
      error: error.message,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV || 'development',
      port: PORT
    });
  }
});

// Rotas da API
app.use('/api', authRoutes);
app.use('/api', protocolRoutes);
app.use('/api/admin', adminRoutes);

// Middleware de tratamento de erros
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

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  console.log('❌ Rota não encontrada:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Inicializar banco de dados e servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor Railway...');
    console.log('🌐 PORT:', PORT);
    console.log('🗄️ DATABASE_URL presente:', !!process.env.DATABASE_URL);
    
    // Iniciar servidor PRIMEIRO (para responder ao healthcheck)
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🎉 SERVIDOR RAILWAY INICIADO!');
      console.log('=' .repeat(50));
      console.log(`🌐 Servidor rodando na porta: ${PORT}`);
      console.log(`🔗 URL Railway: https://sistema-protocolos-juridicos-production.up.railway.app`);
      console.log(`🏥 Health check: https://sistema-protocolos-juridicos-production.up.railway.app/health`);
      console.log('=' .repeat(50));
    });
    
    // Inicializar banco em background (não bloquear o servidor)
    console.log('🗄️ Inicializando banco de dados em background...');
    
    // Tentar inicializar o banco com retry em background
    const initializeDatabase = async () => {
      let dbInitialized = false;
      let attempts = 0;
      const maxAttempts = 3; // Reduzir tentativas
      
      while (!dbInitialized && attempts < maxAttempts) {
        attempts++;
        try {
          console.log(`🔄 Tentativa ${attempts}/${maxAttempts} de inicialização do banco...`);
          await initializeDb();
          dbInitialized = true;
          console.log('✅ Banco de dados inicializado com sucesso!');
          
          // Health check periódico após inicialização
          setInterval(async () => {
            try {
              await query("SELECT 1 as test", [], 1);
              console.log('✅ Health check do banco: OK');
            } catch (error) {
              console.error('❌ Health check do banco: FALHA', error.message);
            }
          }, 60000); // A cada 1 minuto
          
        } catch (error) {
          console.error(`❌ Tentativa ${attempts}/${maxAttempts} falhou:`, error.message);
          
          if (attempts < maxAttempts) {
            const delay = Math.min(5000 * attempts, 15000); // Delay maior
            console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error('❌ AVISO: Não foi possível inicializar o banco após todas as tentativas');
            console.error('⚠️ Servidor continuará rodando, mas funcionalidades do banco podem não funcionar');
          }
        }
      }
    };
    
    // Executar inicialização do banco em background
    initializeDatabase().catch(error => {
      console.error('❌ Erro na inicialização do banco:', error);
    });
    
    // Configurar graceful shutdown
    const gracefulShutdown = () => {
      console.log('🛑 Recebido sinal de shutdown, encerrando servidor graciosamente...');
      server.close(() => {
        console.log('🔒 Servidor HTTP fechado');
        closeConnection().then(() => {
          console.log('🔒 Conexões do banco fechadas');
          process.exit(0);
        });
      });
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Rota adicional para teste rápido
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Rota para verificar variáveis de ambiente (sem expor dados sensíveis)
app.get('/env-check', (req, res) => {
  res.status(200).json({
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: PORT,
    HAS_DATABASE_URL: !!process.env.DATABASE_URL,
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// Tratamento de exceções não capturadas
process.on('uncaughtException', (error) => {
  console.error('❌ ERRO NÃO CAPTURADO:', error);
  // Não encerrar o processo em produção para manter o servidor rodando
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ PROMISE REJEITADA NÃO TRATADA:', reason);
  console.error('Promise:', promise);
  // Não encerrar o processo em produção para manter o servidor rodando
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Iniciar o servidor
startServer();