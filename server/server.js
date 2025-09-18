import express from 'express';
import cors from 'cors';
import path from 'path';
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
 * - Porta automática (process.env.PORT)
 * - Domínio: https://seu-app.squareweb.app
 * - Suporte completo ao Node.js e SQLite
 * - Deploy automático via Git
 */

const app = express();
// SQUARE CLOUD: A porta é definida automaticamente pela plataforma
const PORT = process.env.PORT || 3000;

// SQUARE CLOUD: Obter __dirname em ES modules
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando servidor...');
console.log('🌐 Porta:', PORT, '(Square Cloud define automaticamente)');
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
  
  // Manter compatibilidade com outras plataformas (opcional)
  'https://ncasistemaprotocolos.netlify.app',
  /^https:\/\/.*\.netlify\.app$/,
  /^https:\/\/.*\.up\.railway\.app$/
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
 * SERVIR ARQUIVOS ESTÁTICOS DO FRONTEND - SQUARE CLOUD
 * 
 * Serve os arquivos buildados do React para que o site completo funcione.
 * Essencial para que a Square Cloud sirva tanto API quanto frontend.
 */
const distPath = path.join(__dirname, '..', 'dist');
console.log('📁 [SQUARE CLOUD] Caminho dos arquivos estáticos:', distPath);
console.log('📁 [SQUARE CLOUD] Verificando se dist existe:', require('fs').existsSync(distPath));

// SQUARE CLOUD: Verificar se o build foi feito
if (!require('fs').existsSync(distPath)) {
  console.error('❌ [SQUARE CLOUD] ERRO CRÍTICO: Pasta dist não encontrada!');
  console.error('💡 [SQUARE CLOUD] Execute: npm run build');
  console.error('💡 [SQUARE CLOUD] Ou configure BUILD=npm run build no squarecloud.config');
} else {
  console.log('✅ [SQUARE CLOUD] Pasta dist encontrada, servindo arquivos estáticos');
}

app.use(express.static(distPath));

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
 * IMPORTANTE: Rota raiz (/) agora serve o frontend React.
 * Health checks estão em /health e /api/health-check.
 */
app.get('/health-check', (req, res) => {
  console.log('🏥 [SQUARE CLOUD] Health check solicitado');
  res.json({ 
    message: 'Sistema Jurídico funcionando na Square Cloud!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    platform: 'Square Cloud',
    database: 'SQLite',
    status: 'online',
    frontend: 'React SPA servido como arquivos estáticos'
  });
});

/**
 * ROTA DE HEALTH CHECK DETALHADA
 * 
 * Endpoint básico para verificar se o servidor está funcionando.
 * Essencial para monitoramento da Square Cloud.
 * 
 * SQUARE CLOUD: Usado para verificar se a aplicação está online
 */

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
 * ROTA DE HEALTH CHECK DETALHADA PARA MONITORAMENTO
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
 * ROTA CATCH-ALL PARA SPA (SINGLE PAGE APPLICATION)
 * 
 * Todas as rotas não encontradas retornam o index.html do React.
 * Essencial para que o React Router funcione na Square Cloud.
 */
app.get('*', (req, res) => {
  // SQUARE CLOUD: Não servir index.html para rotas da API ou health checks
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({
      success: false,
      message: 'Rota da API não encontrada',
      path: req.originalUrl,
      method: req.method,
      platform: 'Square Cloud'
    });
  }
  
  // SQUARE CLOUD: Servir index.html para todas as outras rotas (React Router)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🌐 [SQUARE CLOUD] Servindo frontend para: ${req.path}`);
  }
  
  // Verificar se o arquivo index.html existe
  const indexPath = path.join(distPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('❌ [SQUARE CLOUD] index.html não encontrado em:', indexPath);
    res.status(500).json({
      success: false,
      message: 'Frontend não encontrado - Execute npm run build',
      path: indexPath,
      platform: 'Square Cloud'
    });
  }
});

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
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🎉 SERVIDOR INICIADO COM SUCESSO NA SQUARE CLOUD!');
      console.log('=' .repeat(50));
      console.log(`☁️ Plataforma: Square Cloud (Brasil)`);
      console.log(`🌐 Frontend: React SPA servido como arquivos estáticos`);
      console.log(`🌐 Porta: ${PORT} (definida automaticamente)`);
      console.log(`🔗 URL local: http://localhost:${PORT}`);
      console.log(`🌍 URL Square Cloud: https://protocolos.squareweb.app`);
      console.log(`🗄️ Banco: SQLite Otimizado para Square Cloud`);
      console.log(`⚡ Performance: WAL mode, 15 conexões simultâneas`);
      console.log(`👥 Capacidade: 100+ usuários simultâneos`);
      console.log(`🇧🇷 Região: Brasil (baixa latência)`);
      console.log('=' .repeat(50));
      console.log('📋 API Endpoints disponíveis:');
      console.log('  GET  / - Frontend React (arquivos estáticos)');
      console.log('  GET  /health-check - Health check básico');
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