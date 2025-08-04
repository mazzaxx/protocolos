import express from 'express';
import cors from 'cors';
import { initializeDb, testConnection, getDatabaseStats, closeConnection } from './db.js';
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

// Rota de health check
app.get('/', (req, res) => {
  console.log('🏥 Health check solicitado');
  res.json({ 
    message: 'Servidor de autenticação funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Rota de health check específica
app.get('/health', async (req, res) => {
  console.log('🏥 Health check detalhado solicitado');
  
  try {
    // Testar conexão com banco
    await testConnection();
    
    // Obter estatísticas
    const stats = await getDatabaseStats();
    
    res.json({
      status: 'healthy',
      message: 'Servidor funcionando perfeitamente',
      timestamp: new Date().toISOString(),
      database: 'connected',
      stats: stats,
      environment: process.env.NODE_ENV || 'development',
      port: PORT
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
    console.log('🗄️ Inicializando banco de dados com retry...');
    
    // Tentar inicializar o banco com retry
    let dbInitialized = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!dbInitialized && attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`🔄 Tentativa ${attempts}/${maxAttempts} de inicialização do banco...`);
        await initializeDb();
        dbInitialized = true;
        console.log('✅ Banco de dados inicializado com sucesso!');
      } catch (error) {
        console.error(`❌ Tentativa ${attempts}/${maxAttempts} falhou:`, error.message);
        
        if (attempts < maxAttempts) {
          const delay = Math.min(5000 * attempts, 30000); // Delay progressivo até 30s
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('❌ FALHA CRÍTICA: Não foi possível inicializar o banco após todas as tentativas');
          throw error;
        }
      }
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🎉 SERVIDOR INICIADO COM SUCESSO!');
      console.log('=' .repeat(50));
      console.log(`🌐 Servidor rodando na porta: ${PORT}`);
      console.log(`🔗 URL local: http://localhost:${PORT}`);
      console.log(`🌍 URL Railway: https://sistema-protocolos-juridicos-production.up.railway.app`);
      console.log(`🎯 Frontend Netlify: https://ncasistemaprotocolos.netlify.app`);
      console.log('=' .repeat(50));
      console.log('📋 Rotas disponíveis:');
      console.log('  GET  / - Health check básico');
      console.log('  GET  /health - Health check detalhado');
      console.log('  POST /api/login - Login de usuários');
      console.log('  GET  /api/protocolos - Listar protocolos');
      console.log('  POST /api/protocolos - Criar protocolo');
      console.log('  PUT  /api/protocolos/:id - Atualizar protocolo');
      console.log('  GET  /api/admin/funcionarios - Listar funcionários');
      console.log('=' .repeat(50));
      console.log('🔄 Sistema pronto para receber requisições!');
      
      // Teste de conectividade periódico
      setInterval(async () => {
        try {
          await testConnection();
          console.log('✅ Health check do banco: OK');
        } catch (error) {
          console.error('❌ Health check do banco: FALHA', error.message);
        }
      }, 60000); // A cada 1 minuto
    });
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao iniciar servidor:', error);
    console.error('💡 Verifique se o Railway PostgreSQL está acessível');
    console.error('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'Presente' : 'AUSENTE');
    process.exit(1);
  }
}

// Tratamento de sinais do sistema
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, encerrando servidor graciosamente...');
  closeConnection().then(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recebido, encerrando servidor graciosamente...');
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

// Iniciar o servidor
startServer();