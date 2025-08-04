import pkg from 'pg';
const { Pool } = pkg;

// Configuração apenas para PostgreSQL
const isProduction = process.env.NODE_ENV === 'production';

console.log('🐘 Configurando PostgreSQL...');
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
console.log('🔗 DATABASE_URL presente:', !!process.env.DATABASE_URL);

let dbConfig;

if (process.env.DATABASE_URL) {
  // Railway PostgreSQL (produção e desenvolvimento)
  console.log('🐘 Usando PostgreSQL com DATABASE_URL do Railway');
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? {
      rejectUnauthorized: false
    } : false,
    max: 10, // Reduzir conexões para Railway
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000, // Aumentar timeout
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 20000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 500,
  };
} else {
  // PostgreSQL local (desenvolvimento sem Railway)
  console.log('🐘 Usando PostgreSQL local');
  dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'protocolos_juridicos',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

// PostgreSQL Pool
const db = new Pool(dbConfig);

console.log('✅ Pool PostgreSQL configurado');
console.log('🔗 Max connections:', dbConfig.max);

// Função para executar queries com retry automático
const query = async (sql, params = [], retries = 2) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await Promise.race([
        db.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);
      
      try {
        const result = await client.query(sql, params);
        return result;
      } finally {
        client.release();
      }
    } catch (error) {
      lastError = error;
      console.error(`❌ Query tentativa ${attempt}/${retries} falhou:`, error.message);
      
      if (attempt < retries) {
        const delay = Math.min(1000 * attempt, 3000);
        console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Função para inicializar o banco de dados
export const initializeDb = async () => {
  console.log('🚀 Inicializando banco de dados PostgreSQL...');
  console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
  
  // Aguardar um pouco para o banco estar pronto
  if (isProduction) {
    console.log('⏳ Aguardando banco PostgreSQL ficar pronto...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Verificar conectividade primeiro
  try {
    console.log('🔍 Testando conectividade com o banco...');
    await testConnection();
    console.log('✅ Conectividade confirmada!');
  } catch (error) {
    console.error('❌ Falha na conectividade inicial:', error.message);
    throw error;
  }
  
  try {
    // Criar tabela funcionarios
    console.log('📋 Criando tabela funcionarios...');
    await query(`
      CREATE TABLE IF NOT EXISTS funcionarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        permissao VARCHAR(50) NOT NULL DEFAULT 'advogado'
      )
    `);
    console.log('✅ Tabela funcionarios criada/verificada');

    // Criar tabela protocolos
    console.log('📋 Criando tabela protocolos...');
    await query(`
      CREATE TABLE IF NOT EXISTS protocolos (
        id VARCHAR(255) PRIMARY KEY,
        processNumber VARCHAR(255) NOT NULL DEFAULT '',
        court VARCHAR(500) NOT NULL DEFAULT '',
        system VARCHAR(255) NOT NULL DEFAULT '',
        jurisdiction VARCHAR(50) NOT NULL DEFAULT '',
        processType VARCHAR(50) NOT NULL DEFAULT 'civel',
        isFatal BOOLEAN NOT NULL DEFAULT false,
        needsProcuration BOOLEAN NOT NULL DEFAULT false,
        procurationType VARCHAR(500) DEFAULT '',
        needsGuia BOOLEAN NOT NULL DEFAULT false,
        guias TEXT NOT NULL DEFAULT '[]',
        petitionType VARCHAR(255) NOT NULL DEFAULT '',
        observations TEXT DEFAULT '',
        documents TEXT NOT NULL DEFAULT '[]',
        status VARCHAR(50) NOT NULL DEFAULT 'Aguardando',
        assignedTo VARCHAR(50) DEFAULT NULL,
        createdBy INTEGER NOT NULL,
        returnReason TEXT DEFAULT NULL,
        isDistribution BOOLEAN NOT NULL DEFAULT false,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        queuePosition INTEGER NOT NULL DEFAULT 1,
        activityLog TEXT NOT NULL DEFAULT '[]',
        FOREIGN KEY (createdBy) REFERENCES funcionarios (id)
      )
    `);
    console.log('✅ Tabela protocolos criada/verificada');

    // Criar usuários de teste
    await createTestUsers();
    
    console.log('🎉 Inicialização do banco PostgreSQL concluída!');
    
  } catch (error) {
    console.error('❌ Erro na inicialização do banco:', error);
    throw error;
  }
};

// Função para criar usuários de teste
const createTestUsers = async () => {
  const testUsers = [
    { email: 'admin@escritorio.com', senha: '123456', permissao: 'admin' },
    { email: 'mod@escritorio.com', senha: '123456', permissao: 'mod' },
    { email: 'advogado@escritorio.com', senha: '123456', permissao: 'advogado' }
  ];

  let usersCreated = 0;

  for (const user of testUsers) {
    try {
      // Verificar se usuário já existe
      const existingUser = await query(
        "SELECT email FROM funcionarios WHERE email = $1", 
        [user.email]
      );
      
      if (existingUser.rows && existingUser.rows.length === 0) {
        // Criar usuário
        await query(
          "INSERT INTO funcionarios (email, senha, permissao) VALUES ($1, $2, $3)",
          [user.email, user.senha, user.permissao]
        );
        console.log(`✅ Usuário de teste criado: ${user.email} (${user.permissao})`);
        usersCreated++;
      } else {
        console.log(`ℹ️ Usuário já existe: ${user.email}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao criar usuário ${user.email}:`, error);
    }
  }

  // Verificar totais
  try {
    const funcionariosCount = await query("SELECT COUNT(*) as count FROM funcionarios");
    const protocolosCount = await query("SELECT COUNT(*) as count FROM protocolos");
    
    const funcionariosTotal = funcionariosCount.rows[0].count;
    const protocolosTotal = protocolosCount.rows[0].count;
    
    console.log(`👥 Total de funcionários no banco: ${funcionariosTotal}`);
    console.log(`📋 Total de protocolos no banco: ${protocolosTotal}`);
    console.log(`🆕 Usuários criados nesta inicialização: ${usersCreated}`);
  } catch (error) {
    console.error('❌ Erro ao verificar totais:', error);
  }
};

// Função para testar conectividade com retry
export const testConnection = async (retries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 Teste de conectividade - Tentativa ${attempt}/${retries}`);
      const result = await Promise.race([
        query("SELECT 1 as test", [], 1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), 5000)
        )
      ]);
      console.log('✅ Teste de conectividade PostgreSQL bem-sucedido');
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ Tentativa ${attempt}/${retries} falhou:`, error.message);
      
      if (attempt < retries) {
        const delay = Math.min(2000 * attempt, 5000);
        console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('❌ Todas as tentativas de conectividade falharam');
  throw lastError;
};

// Função para obter estatísticas do banco
export const getDatabaseStats = async () => {
  try {
    const funcionariosResult = await query("SELECT COUNT(*) as count FROM funcionarios");
    const protocolosResult = await query("SELECT COUNT(*) as count FROM protocolos");
    const aguardandoResult = await query("SELECT COUNT(*) as count FROM protocolos WHERE status = 'Aguardando'");
    
    const stats = {
      funcionarios: funcionariosResult.rows[0].count,
      protocolos: protocolosResult.rows[0].count,
      protocolosAguardando: aguardandoResult.rows[0].count,
      databaseType: 'PostgreSQL',
      environment: process.env.NODE_ENV || 'development',
      connectionString: process.env.DATABASE_URL ? 'Railway PostgreSQL' : 'Local PostgreSQL'
    };
    
    return stats;
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    throw error;
  }
};

// Função para fechar conexões (cleanup)
export const closeConnection = async () => {
  try {
    await db.end();
    console.log('🔒 Pool PostgreSQL fechado');
  } catch (error) {
    console.error('❌ Erro ao fechar pool:', error);
  }
};

// Event listeners para cleanup
process.on('SIGINT', async () => {
  console.log('🛑 SIGINT recebido, fechando pool PostgreSQL...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM recebido, fechando pool PostgreSQL...');
  await closeConnection();
  process.exit(0);
});

// Exportar query function e informações do banco
export { query };
export const isPostgreSQL = true;
export default { query, isPostgreSQL: true };