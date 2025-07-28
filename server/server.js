import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initializeDb, testConnection, getDatabaseStats } from './db.js';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';
import protocolRoutes from './protocols.js';

// Middleware para simular autenticação (desenvolvimento)
app.use((req, res, next) => {
  // Para desenvolvimento, simular usuário logado
  if (!req.user) {
    req.user = {
      id: 1,
      email: 'admin@escritorio.com',
      permissao: 'admin'
    };
  }
  next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Lista de origens permitidas para CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'https://localhost:5173',
  'https://127.0.0.1:5173',
  // URL real do Netlify
  'https://ncasistemaprotocolos.netlify.app',
  // URLs alternativas do Netlify (caso mude)
  'https://sistema-juridico.netlify.app',
  'https://sistema-protocolos.netlify.app',
  // URLs de deploy preview do Netlify
  /https:\/\/.*--ncasistemaprotocolos\.netlify\.app$/,
  /https:\/\/deploy-preview-.*--ncasistemaprotocolos\.netlify\.app$/,
  // Permitir qualquer localhost para desenvolvimento
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^https:\/\/localhost:\d+$/,
  /^https:\/\/127\.0\.0\.1:\d+$/,
];

// Middlewares
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar se a origem está na lista ou corresponde a um padrão regex
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS warning - origin not in allowedOrigins:', origin);
      // Em desenvolvimento, permitir qualquer origem localhost ou netlify
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('netlify.app') || origin.includes('bolt.new')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Middleware adicional para garantir CORS em todas as respostas
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Middleware para parsing JSON com limite maior e tratamento de erro
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (err) {
      console.error('❌ Erro ao parsear JSON:', err.message);
      res.status(400).json({
        success: false,
        message: 'JSON inválido na requisição',
        error: 'INVALID_JSON'
      });
      return;
    }
  }
}));

// Middleware para parsing URL encoded
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Inicializar o banco de dados antes de configurar as rotas
console.log('Inicializando banco de dados...');

try {
  await initializeDb();
  console.log('Banco de dados inicializado com sucesso!');
  
  // Testar conectividade
  await testConnection();
  
  // Obter estatísticas iniciais
  const stats = await getDatabaseStats();
  console.log('📊 Estatísticas do banco:', stats);
  
} catch (error) {
  console.error('Erro ao inicializar banco de dados:', error);
  process.exit(1);
}

// Log de todas as requisições para debug
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🌐 ${req.method} ${req.path} - ${timestamp}`);
  console.log('📍 Origin:', req.headers.origin);
  
  // Log apenas para requisições importantes (não health checks)
  if (!req.path.includes('/health') && !req.path.includes('/test')) {
    console.log('🔧 User-Agent:', req.headers['user-agent']?.substring(0, 50) + '...');
    
    // Log apenas headers importantes para reduzir ruído
    const importantHeaders = {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'authorization': req.headers.authorization ? '[PRESENTE]' : '[AUSENTE]',
    };
    console.log('📋 Headers importantes:', importantHeaders);
  }
  
  next();
});

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error('❌ ERRO GLOBAL:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Dados JSON inválidos',
      error: 'INVALID_JSON_FORMAT'
    });
  }
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Dados muito grandes',
      error: 'PAYLOAD_TOO_LARGE'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: 'INTERNAL_SERVER_ERROR'
  });
});

// Rotas
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/protocolos', protocolRoutes);

// Rota de teste
app.get('/', (req, res) => {
  console.log('🏠 Rota raiz acessada');
  res.json({ 
    message: 'Servidor de autenticação funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    database: 'SQLite conectado',
    cors: 'Configurado para Netlify',
    routes: [
      'GET /',
      'POST /api/login',
      'GET /api/verify',
      'GET /api/admin/funcionarios',
      'POST /api/admin/funcionarios',
      'PUT /api/admin/funcionarios/:id',
      'DELETE /api/admin/funcionarios/:id',
      'GET /api/protocolos',
      'POST /api/protocolos',
      'PUT /api/protocolos/:id',
      'DELETE /api/protocolos/:id'
    ]
  });
});

// Rota de teste para admin
app.get('/api/admin/test', (req, res) => {
  res.json({ 
    message: 'Rotas admin funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota de teste para API
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  console.log('🏥 Health check solicitado');
  console.log('📍 Origin do health check:', req.headers.origin);
  
  // Verificar se o banco está funcionando e obter estatísticas completas
  getDatabaseStats().then(stats => {
    console.log('✅ Health check OK - Stats:', stats);
    res.json({
      status: 'healthy',
      database: 'connected',
      stats,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      message: 'Sistema funcionando - Dados sincronizados entre todos os usuários',
      cors: 'Configurado e funcionando',
      port: PORT
    });
  }).catch(err => {
    console.error('❌ Erro no health check:', err);
    res.status(500).json({
      status: 'unhealthy',
      database: 'error',
      timestamp: new Date().toISOString(),
      error: err.message,
      uptime: process.uptime(),
      message: 'Erro no servidor - Sincronização pode estar comprometida',
      cors: 'Pode estar com problemas'
    });
  });
});

// Rota de teste para protocolos
app.get('/api/protocolos/test', (req, res) => {
  res.json({ 
    message: 'Rotas de protocolos funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro 404
app.use('*', (req, res) => {
  console.log(`❌ Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    error: 'ROUTE_NOT_FOUND'
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ========================================`);
  console.log(`🚀 SERVIDOR INICIADO COM SUCESSO!`);
  console.log(`🚀 ========================================`);
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Banco: SQLite inicializado`);
  console.log(`🔐 CORS: Configurado para Netlify`);
  console.log(`📦 JSON Limit: 50MB`);
  console.log(`🔄 Sincronização: Tempo real ativada`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔗 Local: http://localhost:${PORT}`);
  }
  console.log(`🌐 Frontend: https://ncasistemaprotocolos.netlify.app`);
  console.log(`📋 Rotas principais:`);
  console.log(`   - POST /api/login (Autenticação)`);
  console.log(`   - GET /api/protocolos (Listar protocolos)`);
  console.log(`   - POST /api/protocolos (Criar protocolo)`);
  console.log(`   - GET /api/admin/funcionarios (Admin)`);
  console.log(`🚀 ========================================\n`);
});