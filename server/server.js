import express from 'express';
import cors from 'cors';
import { initializeDb } from './db.js';
import authRoutes from './auth.js';
import protocolRoutes from './protocols.js';
import adminRoutes from './admin.js';
import teamsRoutes from './teams.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;
const isProduction = process.env.NODE_ENV === 'production';

console.log('🚀 Iniciando servidor Express - Square Cloud Extension');
console.log('🌍 Ambiente:', isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
console.log('🔌 Porta:', PORT);

// Middleware de CORS otimizado para Square Cloud
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:80',
      /\.squarecloud\.app$/,
      /protocolos-juridicos.*\.squarecloud\.app$/
    ];
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      return allowedOrigin.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('🚫 Origem bloqueada pelo CORS:', origin);
      callback(null, true); // Permitir mesmo assim em produção
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'X-Sync-Mode', 'X-Sync-Action', 'X-Client-Time'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
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
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    platform: 'Square Cloud Extension',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Rotas da API
app.use('/api', authRoutes);
app.use('/api', protocolRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', teamsRoutes);

// Servir arquivos estáticos do frontend
const distPath = path.join(__dirname, '..', 'dist');
console.log('📁 Servindo arquivos estáticos de:', distPath);
app.use(express.static(distPath));

// Fallback para SPA (Single Page Application)
app.get('*', (req, res) => {
  // Não aplicar fallback para rotas da API
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.sendFile(path.join(distPath, 'index.html'));
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
      console.log('🎉 SERVIDOR INICIADO COM SUCESSO!');
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📊 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
      console.log(`🔧 Plataforma: Square Cloud Extension`);
      console.log('📋 Endpoints disponíveis:');
      console.log('   - GET  /health (Health check)');
      console.log('   - POST /api/login (Autenticação)');
      console.log('   - GET  /api/protocolos (Listar protocolos)');
      console.log('   - POST /api/protocolos (Criar protocolo)');
      console.log('   - GET  /api/admin/* (Rotas administrativas)');
      console.log('🚀 Sistema pronto para uso!');
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