import express from 'express';
import cors from 'cors';
import { initializeDb, testConnection, getDatabaseStats, closeConnection } from './db.js';
import authRoutes from './auth.js';
import protocolRoutes from './protocols.js';
import adminRoutes from './admin.js';
import { maintenanceDb } from './db.js';

const app = express();
const PORT = process.env.PORT || 80;

console.log('🚀 Iniciando servidor...');
console.log('🌐 Porta:', PORT);
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
console.log('☁️ Plataforma: Square Cloud');
console.log('🗄️ Banco: SQLite Conexão Única');

// Lista de origens permitidas para CORS (Square Cloud)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  // Square Cloud domains
  /^https:\/\/.*\.squarecloud\.app$/,
  /^https:\/\/.*\.squareweb\.app$/,
];

// Configuração CORS otimizada para Square Cloud
const corsOptions = {
  origin: function (origin, callback) {
    // Log apenas em desenvolvimento para evitar spam
    if (process.env.NODE_ENV !== 'production') {
      console.log('🌐 CORS - Origin recebido:', origin);
    }
    
    // Permitir requisições sem origin (ex: Postman, aplicações mobile)
    if (!origin) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ CORS - Permitindo requisição sem origin');
      }
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
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ CORS - Origin permitida:', origin);
      }
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

// Middleware de logging otimizado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  
  // Log detalhado apenas para operações importantes
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
    // Log simples em desenvolvimento
    console.log(`📡 ${req.method} ${req.path}`);
  }
  
  next();
});

// Rota de health check
app.get('/', (req, res) => {
  console.log('🏥 Health check solicitado');
  res.json({ 
    message: 'Sistema de Protocolos Jurídicos funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    platform: 'Square Cloud',
    port: PORT
  });
});

// Rota de health check específica
app.get('/health', async (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🏥 Health check detalhado solicitado');
  }
  
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
      platform: 'Square Cloud',
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
    console.log('🗄️ Inicializando banco de dados...');
    await initializeDb();
    console.log('✅ Banco de dados inicializado com sucesso!');
    
    // Agendar manutenção periódica (a cada 12 horas para Square Cloud)
    setInterval(async () => {
      console.log('🔧 Executando manutenção automática do banco...');
      try {
        await maintenanceDb();
        console.log('✅ Manutenção automática concluída');
      } catch (error) {
        console.error('❌ Erro na manutenção automática:', error);
      }
    }, 12 * 60 * 60 * 1000); // 12 horas
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🎉 SERVIDOR INICIADO COM SUCESSO!');
      console.log('=' .repeat(50));
      console.log(`🌐 Servidor rodando na porta: ${PORT}`);
      console.log(`☁️ Plataforma: Square Cloud`);
      console.log(`🗄️ Banco: SQLite Conexão Única`);
      console.log(`👥 Capacidade: 100+ usuários simultâneos`);
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
      console.log('☁️ Otimizado para Square Cloud');
      
      // Teste de conectividade inicial
      testConnection()
        .then(() => console.log('✅ Teste de conectividade inicial: SUCESSO'))
        .catch(err => console.error('❌ Teste de conectividade inicial: FALHA', err.message));
    });
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao iniciar servidor:', error);
    console.error('💡 Verifique se o banco de dados está acessível');
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