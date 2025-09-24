import express from 'express';
import cors from 'cors';
import { initializeDb } from './db.js';
import authRoutes from './auth.js';
import protocolRoutes from './protocols.js';
import adminRoutes from './admin.js';
import teamsRoutes from './teams.js';

const app = express();
const PORT = process.env.PORT || 80;
const isProduction = process.env.NODE_ENV === 'production';

console.log('🚀 Iniciando Backend API - Sistema de Protocolos Jurídicos');
console.log('🌍 Ambiente:', isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
console.log('🔌 Porta:', PORT);

// Middleware de CORS - Permitir requisições do frontend
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de origens permitidas (adicione suas URLs de produção aqui)
    const allowedOrigins = [
      'http://localhost:5173', // Vite dev
      'http://localhost:3000', // React dev
      'https://protocolosnca.netlify.app',
      'https://main--protocolosnca.netlify.app',
      'https://deploy-preview-*--protocolosnca.netlify.app',
      /^https:\/\/.*\.netlify\.app$/,
      'https://protocolos.squareweb.app',
      // Adicione outras URLs conforme necessário
    ];
    
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar se a origem está na lista permitida
    if (allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    })) {
      callback(null, true);
    } else {
      console.log('🚫 Origem bloqueada pelo CORS:', origin);
      // Em desenvolvimento, permitir mesmo assim
      callback(null, !isProduction);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin', 
    'Cache-Control',
    'X-Sync-Mode', 
    'X-Sync-Action', 
    'X-Client-Time'
  ],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));

// Middleware para parsing JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de logging para debug
if (!isProduction) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Protocolos Jurídicos Backend API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Rotas da API
app.use('/api', authRoutes);
app.use('/api', protocolRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', teamsRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Protocolos Jurídicos - Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/login',
      protocols: '/api/protocolos',
      admin: '/api/admin/*'
    }
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: isProduction ? 'Internal Server Error' : err.message
  });
});

// Inicializar banco de dados e iniciar servidor
async function startServer() {
  try {
    console.log('🗄️ Inicializando banco de dados...');
    await initializeDb();
    console.log('✅ Banco de dados inicializado com sucesso!');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🎉 BACKEND API INICIADO COM SUCESSO!');
      console.log(`🌐 URL: ${isProduction ? 'https://protocolos-backend.squarecloud.app' : `http://localhost:${PORT}`}`);
      console.log(`📊 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
      console.log('📋 Endpoints disponíveis:');
      console.log('   - GET  / (Informações da API)');
      console.log('   - GET  /health (Health check)');
      console.log('   - POST /api/login (Autenticação)');
      console.log('   - GET  /api/protocolos (Listar protocolos)');
      console.log('   - POST /api/protocolos (Criar protocolo)');
      console.log('   - GET  /api/admin/* (Rotas administrativas)');
      console.log('🚀 Backend pronto para receber requisições!');
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`🛑 Recebido ${signal}, encerrando servidor graciosamente...`);
      server.close(() => {
        console.log('✅ Servidor HTTP encerrado');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao iniciar servidor:', error);
    console.error('📋 Stack trace:', error.stack);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();