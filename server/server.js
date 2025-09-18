import express from 'express';
import cors from 'cors';
import { initializeDb, testConnection, getDatabaseStats, closeConnection } from './db.js';
import authRoutes from './auth.js';
import protocolRoutes from './protocols.js';
import adminRoutes from './admin.js';
import { maintenanceDb } from './db.js';

/**
 * SERVIDOR PRINCIPAL - SQUARE CLOUD
 * 
 * Este é o servidor Express principal que gerencia toda a aplicação.
 * Configurado especificamente para funcionar na Square Cloud (plataforma brasileira).
 * 
 * Funcionalidades principais:
 * - Autenticação de usuários
 * - Gerenciamento de protocolos jurídicos
 * - API REST completa
 * - Banco SQLite otimizado
 * - CORS configurado para Square Cloud
 * 
 * HOSPEDAGEM SQUARE CLOUD:
 * - Porta 80 obrigatória para Square Cloud
 * - Domínio: https://seu-app.squareweb.app
 * - Suporte completo ao Node.js e SQLite
 * - Deploy automático via Git
 */

const app = express();
// SQUARE CLOUD: Porta 80 é obrigatória para a plataforma
const PORT = 80;

console.log('🚀 Iniciando servidor...');
console.log('🌐 Porta:', PORT, '(Square Cloud exige porta 80)');
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
console.log('🗄️ Banco: SQLite Otimizado para Square Cloud');
console.log('☁️ Plataforma: Square Cloud (Brasil)');

/**
 * CONFIGURAÇÃO DE CORS PARA SQUARE CLOUD
 * 
 * Define quais domínios podem acessar a API.
 * Square Cloud usa domínios .squareweb.app
 * 
 * IMPORTANTE PARA HOSPEDAGEM:
 * - Sempre incluir o domínio da Square Cloud
 * - Manter localhost para desenvolvimento
 * - Usar regex para flexibilidade com subdomínios
 */
const allowedOrigins = [
  // Desenvolvimento local
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  
  // SQUARE CLOUD: Domínio principal da aplicação
  'https://protocolos.squareweb.app',
  
  // SQUARE CLOUD: Permitir qualquer subdomínio .squareweb.app
  /^https:\/\/.*\.squareweb\.app$/,
];

/**
 * CONFIGURAÇÃO CORS OTIMIZADA PARA SQUARE CLOUD
 * 
 * Permite requisições do frontend hospedado na Square Cloud
 * e mantém compatibilidade com desenvolvimento local.
 */
const corsOptions = {
  origin: function (origin, callback) {
    // SQUARE CLOUD: Log apenas em desenvolvimento para economizar recursos
    if (process.env.NODE_ENV !== 'production') {
      console.log('🌐 CORS - Origin recebido:', origin);
    }
    
    // SQUARE CLOUD: Permitir requisições sem origin (apps mobile, Postman)
    if (!origin) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ CORS - Permitindo requisição sem origin');
      }
      return callback(null, true);
    }
    
    // Verificar se a origin está na lista permitida (incluindo Square Cloud)
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
        console.log('✅ CORS - Origin permitida (Square Cloud):', origin);
      }
      callback(null, true);
    } else {
      console.log('❌ CORS - Origin bloqueada (não é Square Cloud):', origin);
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
  maxAge: 86400 // SQUARE CLOUD: Cache CORS por 24 horas para performance
};

// Aplicar configuração CORS otimizada para Square Cloud
app.use(cors(corsOptions));

/**
 * MIDDLEWARE DE PARSING JSON
 * 
 * Configura o Express para processar requisições JSON.
 * Limite de 50MB para upload de documentos.
 * 
 * SQUARE CLOUD: Funciona perfeitamente com os limites da plataforma
 */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * MIDDLEWARE DE LOGGING OTIMIZADO PARA SQUARE CLOUD
 * 
 * Registra requisições importantes para monitoramento.
 * Em produção (Square Cloud), reduz logs para economizar recursos.
 */
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  
  // SQUARE CLOUD: Log apenas operações importantes em produção
  if (req.path.includes('/api/') && (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE')) {
    console.log(`📡 [SQUARE CLOUD] ${timestamp} - ${req.method} ${req.path}`);
    console.log('🌐 Origin:', req.headers.origin);
    
    if (req.method === 'POST' || req.method === 'PUT') {
      const bodySize = JSON.stringify(req.body || {}).length;
      if (bodySize > 1000) {
        console.log('📦 [SQUARE CLOUD] Body size:', bodySize, 'chars');
      }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    // Log simples apenas em desenvolvimento local
    console.log(`📡 ${req.method} ${req.path}`);
  }
  
  next();
});

/**
 * ROTA DE HEALTH CHECK PRINCIPAL
 * 
 * Endpoint básico para verificar se o servidor está funcionando.
 * Essencial para monitoramento da Square Cloud.
 * 
 * SQUARE CLOUD: Usado para verificar se a aplicação está online
 */
app.get('/', (req, res) => {
  console.log('🏥 [SQUARE CLOUD] Health check solicitado');
  res.json({ 
    message: 'Sistema Jurídico funcionando na Square Cloud!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    platform: 'Square Cloud',
    database: 'SQLite',
    status: 'online'
  });
});

/**
 * ROTA DE HEALTH CHECK DETALHADA
 * 
 * Endpoint completo para monitoramento avançado.
 * Testa conexão com banco e retorna estatísticas.
 * 
 * SQUARE CLOUD: Útil para debugging e monitoramento
 */
app.get('/health', async (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🏥 [SQUARE CLOUD] Health check detalhado solicitado');
  }
  
  try {
    // SQUARE CLOUD: Testar conexão com SQLite
    await testConnection();
    
    // Obter estatísticas do banco para monitoramento
    const stats = await getDatabaseStats();
    
    res.json({
      status: 'healthy',
      message: 'Sistema funcionando perfeitamente na Square Cloud',
      timestamp: new Date().toISOString(),
      database: 'connected',
      stats: stats,
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      platform: 'Square Cloud',
      region: 'Brasil'
    });
  } catch (error) {
    console.error('❌ [SQUARE CLOUD] Health check falhou:', error);
    res.status(500).json({
      status: 'unhealthy',
      message: 'Problemas de conectividade na Square Cloud',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * CONFIGURAÇÃO DAS ROTAS DA API
 * 
 * Define todos os endpoints da aplicação:
 * - /api/* - Autenticação e protocolos
 * - /api/admin/* - Administração
 * 
 * SQUARE CLOUD: Todas as rotas funcionam perfeitamente
 */
app.use('/api', authRoutes);
app.use('/api', protocolRoutes);
app.use('/api/admin', adminRoutes);

/**
 * MIDDLEWARE DE TRATAMENTO DE ERROS GLOBAL
 * 
 * Captura e trata todos os erros da aplicação.
 * Essencial para estabilidade na Square Cloud.
 */
app.use((err, req, res, next) => {
  console.error('❌ [SQUARE CLOUD] Erro no servidor:', err);
  
  if (err.message === 'Não permitido pelo CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado por política CORS (Square Cloud)',
      origin: req.headers.origin
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor (Square Cloud)',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
  });
});

/**
 * MIDDLEWARE PARA ROTAS NÃO ENCONTRADAS (404)
 * 
 * Captura requisições para rotas inexistentes.
 * Importante para debugging na Square Cloud.
 */
app.use('*', (req, res) => {
  console.log('❌ [SQUARE CLOUD] Rota não encontrada:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method,
    platform: 'Square Cloud'
  });
});

/**
 * FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO DO SERVIDOR
 * 
 * Inicializa o banco SQLite e inicia o servidor Express.
 * Configurada especificamente para Square Cloud.
 * 
 * SQUARE CLOUD:
 * - Inicialização automática
 * - Manutenção periódica do banco
 * - Logs otimizados para produção
 */
async function startServer() {
  try {
    console.log('🗄️ [SQUARE CLOUD] Inicializando banco SQLite...');
    await initializeDb();
    console.log('✅ [SQUARE CLOUD] Banco SQLite inicializado com sucesso!');
    
    // SQUARE CLOUD: Manutenção automática do banco a cada 6 horas
    setInterval(async () => {
      console.log('🔧 [SQUARE CLOUD] Manutenção automática do banco...');
      try {
        await maintenanceDb();
        console.log('✅ [SQUARE CLOUD] Manutenção automática concluída');
      } catch (error) {
        console.error('❌ [SQUARE CLOUD] Erro na manutenção automática:', error);
      }
    }, 6 * 60 * 60 * 1000); // SQUARE CLOUD: 6 horas em millisegundos
    
    // SQUARE CLOUD: Iniciar servidor na porta definida pela plataforma
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🎉 SERVIDOR INICIADO COM SUCESSO NA SQUARE CLOUD!');
      console.log('=' .repeat(50));
      console.log(`☁️ Plataforma: Square Cloud (Brasil)`);
      console.log(`🌐 Porta: ${PORT} (obrigatória para Square Cloud)`);
      console.log(`🔗 URL local: http://localhost:${PORT}`);
      console.log(`🌍 URL Square Cloud: https://protocolos.squareweb.app`);
      console.log(`🗄️ Banco: SQLite Otimizado para Square Cloud`);
      console.log(`⚡ Performance: WAL mode, 15 conexões simultâneas`);
      console.log(`👥 Capacidade: 100+ usuários simultâneos`);
      console.log(`🇧🇷 Região: Brasil (baixa latência)`);
      console.log('=' .repeat(50));
      console.log('📋 API Endpoints disponíveis:');
      console.log('  GET  / - Health check básico');
      console.log('  GET  /health - Health check detalhado');
      console.log('  POST /api/login - Login de usuários');
      console.log('  GET  /api/protocolos - Listar protocolos');
      console.log('  POST /api/protocolos - Criar protocolo');
      console.log('  PUT  /api/protocolos/:id - Atualizar protocolo');
      console.log('  GET  /api/admin/funcionarios - Listar funcionários');
      console.log('=' .repeat(50));
      console.log('🔄 Sistema pronto na Square Cloud!');
      console.log('⚡ Otimizado para escritórios jurídicos brasileiros');
      
      // SQUARE CLOUD: Teste de conectividade inicial
      testConnection()
        .then(() => console.log('✅ [SQUARE CLOUD] Conectividade inicial: SUCESSO'))
        .catch(err => console.error('❌ [SQUARE CLOUD] Conectividade inicial: FALHA', err.message));
    });
    
    // SQUARE CLOUD: Configurar timeout do servidor para evitar problemas
    server.timeout = 30000; // 30 segundos
    server.keepAliveTimeout = 65000; // 65 segundos
    server.headersTimeout = 66000; // 66 segundos
  } catch (error) {
    console.error('❌ [SQUARE CLOUD] ERRO CRÍTICO ao iniciar servidor:', error);
    console.error('💡 [SQUARE CLOUD] Verifique configurações do banco SQLite');
    process.exit(1);
  }
}

/**
 * TRATAMENTO DE SINAIS DO SISTEMA PARA SQUARE CLOUD
 * 
 * Garante que o servidor seja encerrado graciosamente
 * quando a Square Cloud reinicia ou atualiza a aplicação.
 */
process.on('SIGTERM', () => {
  console.log('🛑 [SQUARE CLOUD] SIGTERM recebido, encerrando graciosamente...');
  closeConnection().then(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 [SQUARE CLOUD] SIGINT recebido, encerrando graciosamente...');
  closeConnection().then(() => {
    process.exit(0);
  });
});

/**
 * TRATAMENTO DE ERROS NÃO CAPTURADOS
 * 
 * Essencial para estabilidade na Square Cloud.
 * Evita que a aplicação trave por erros inesperados.
 */
process.on('uncaughtException', (error) => {
  console.error('❌ [SQUARE CLOUD] ERRO NÃO CAPTURADO:', error);
  closeConnection().then(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [SQUARE CLOUD] PROMISE REJEITADA NÃO TRATADA:', reason);
  console.error('Promise:', promise);
  closeConnection().then(() => {
    process.exit(1);
  });
});

// SQUARE CLOUD: Iniciar o servidor automaticamente
startServer();