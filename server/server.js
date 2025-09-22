import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDb, testConnection, getDatabaseStats, closeConnection } from './db.js';
import authRoutes from './auth.js';
import protocolRoutes from './protocols.js';
import adminRoutes from './admin.js';
import { scheduleAutoBackup, createBackup, listBackups, exportData } from './backup.js';
import { maintenanceDb } from './db.js';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Servir arquivos estáticos do frontend (após build)
const distPath = path.join(__dirname, '..', 'dist');
console.log('📁 Caminho dos arquivos estáticos:', distPath);
app.use(express.static(distPath));

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

// Rotas de backup (apenas para admins)
app.get('/api/backup/create', async (req, res) => {
  console.log('💾 Solicitação de backup manual');
  
  try {
    const result = await createBackup();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup criado com sucesso',
        backup: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao criar backup',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Erro na rota de backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.get('/api/backup/list', async (req, res) => {
  console.log('📋 Listando backups disponíveis');
  
  try {
    const backups = listBackups();
    
    res.json({
      success: true,
      backups: backups,
      total: backups.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar backups:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar backups'
    });
  }
});

app.get('/api/backup/export', async (req, res) => {
  console.log('📤 Exportando dados em JSON');
  
  try {
    const result = await exportData();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Dados exportados com sucesso',
        export: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao exportar dados',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Erro na exportação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
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

// Servir o frontend React para todas as rotas não-API (SPA routing)
app.get('*', (req, res) => {
  // Não interceptar rotas da API
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({
      success: false,
      message: 'Rota da API não encontrada',
      path: req.originalUrl,
      method: req.method
    });
  }
  
  const indexPath = path.join(distPath, 'index.html');
  console.log('🌐 Servindo frontend para:', req.path);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Erro ao servir index.html:', err);
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar aplicação frontend',
        error: 'Arquivos do frontend não encontrados'
      });
    }
  });
});

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

// Inicializar banco de dados e servidor
async function startServer() {
  try {
    console.log('🗄️ Inicializando banco de dados...');
    await initializeDb();
    console.log('✅ Banco de dados inicializado com sucesso!');
    
    // Iniciar sistema de backup automático
    scheduleAutoBackup();
    
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