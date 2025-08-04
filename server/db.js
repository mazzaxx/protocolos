import pkg from 'pg';
const { Pool } = pkg;

// Configuração PostgreSQL Railway
const isProduction = process.env.NODE_ENV === 'production';

console.log('🐘 Configurando PostgreSQL Railway...');
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
console.log('🔗 DATABASE_URL presente:', !!process.env.DATABASE_URL);

let dbConfig;

if (process.env.DATABASE_URL) {
  // Railway PostgreSQL (produção)
  console.log('🐘 Usando PostgreSQL Railway com DATABASE_URL');
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    max: 10, // Pool menor para Railway
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    acquireTimeoutMillis: 15000,
    createTimeoutMillis: 10000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 500,
    // Configurações específicas Railway
    statement_timeout: 60000,
    query_timeout: 60000,
    application_name: 'sistema_protocolos_juridicos_railway'
  };
} else {
  // PostgreSQL local (desenvolvimento)
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
    connectionTimeoutMillis: 5000,
  };
}

// Pool PostgreSQL
const db = new Pool(dbConfig);

console.log('✅ Pool PostgreSQL configurado');
console.log('🔗 Max connections:', dbConfig.max);

// Função para executar queries com retry
const query = async (sql, params = [], retries = 3) => {
  const startTime = Date.now();
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 Query attempt ${attempt}/${retries}:`, sql.substring(0, 50) + '...');
      
      const client = await Promise.race([
        db.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 8000)
        )
      ]);
      
      try {
        const result = await Promise.race([
          client.query(sql, params),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 15000)
          )
        ]);
        
        const duration = Date.now() - startTime;
        console.log(`✅ Query success (${duration}ms)`);
        
        return result;
      } finally {
        client.release();
      }
    } catch (error) {
      lastError = error;
      console.error(`❌ Query attempt ${attempt}/${retries} failed:`, error.message);
      
      if (attempt < retries) {
        const delay = Math.min(1000 * attempt, 3000);
        console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Função para inicializar o banco
export const initializeDb = async () => {
  console.log('🚀 Inicializando banco PostgreSQL Railway...');
  
  try {
    // Verificar conectividade primeiro
    console.log('🔍 Testando conectividade Railway...');
    await testConnection();
    console.log('✅ Conectividade Railway confirmada!');
    
    // Criar extensões necessárias
    console.log('🔧 Configurando extensões...');
    try {
      await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
      console.log('✅ Extensão uuid-ossp criada');
    } catch (error) {
      console.warn('⚠️ Aviso ao criar extensão:', error.message);
    }
    
    // Criar tabela funcionarios
    console.log('📋 Criando tabela funcionarios...');
    await query(`
      CREATE TABLE IF NOT EXISTS funcionarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        permissao VARCHAR(50) NOT NULL DEFAULT 'advogado',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // Índices para performance
    await query(`CREATE INDEX IF NOT EXISTS idx_funcionarios_email ON funcionarios(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_funcionarios_permissao ON funcionarios(permissao)`);
    
    console.log('✅ Tabela funcionarios criada/verificada');

    // Criar tabela protocolos
    console.log('📋 Criando tabela protocolos...');
    await query(`
      CREATE TABLE IF NOT EXISTS protocolos (
        id VARCHAR(255) PRIMARY KEY,
        process_number VARCHAR(255) NOT NULL DEFAULT '',
        court VARCHAR(500) NOT NULL DEFAULT '',
        system VARCHAR(255) NOT NULL DEFAULT '',
        jurisdiction VARCHAR(50) NOT NULL DEFAULT '',
        process_type VARCHAR(50) NOT NULL DEFAULT 'civel',
        is_fatal BOOLEAN NOT NULL DEFAULT false,
        needs_procuration BOOLEAN NOT NULL DEFAULT false,
        procuration_type VARCHAR(500) DEFAULT '',
        needs_guia BOOLEAN NOT NULL DEFAULT false,
        guias JSONB NOT NULL DEFAULT '[]',
        petition_type VARCHAR(255) NOT NULL DEFAULT '',
        observations TEXT DEFAULT '',
        documents JSONB NOT NULL DEFAULT '[]',
        status VARCHAR(50) NOT NULL DEFAULT 'Aguardando',
        assigned_to VARCHAR(50) DEFAULT NULL,
        created_by INTEGER NOT NULL,
        return_reason TEXT DEFAULT NULL,
        is_distribution BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        queue_position INTEGER NOT NULL DEFAULT 1,
        activity_log JSONB NOT NULL DEFAULT '[]'
      )
    `);
    
    // Índices otimizados
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_status ON protocolos(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_assigned_to ON protocolos(assigned_to)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_created_by ON protocolos(created_by)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_created_at ON protocolos(created_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_updated_at ON protocolos(updated_at DESC)`);
    
    console.log('✅ Tabela protocolos criada/verificada');

    // Trigger para atualizar updated_at
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    await query(`
      DROP TRIGGER IF EXISTS update_protocolos_updated_at ON protocolos
    `);
    
    await query(`
      CREATE TRIGGER update_protocolos_updated_at
        BEFORE UPDATE ON protocolos
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);
    
    await query(`
      DROP TRIGGER IF EXISTS update_funcionarios_updated_at ON funcionarios
    `);
    
    await query(`
      CREATE TRIGGER update_funcionarios_updated_at
        BEFORE UPDATE ON funcionarios
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    // Criar usuários de teste
    await createTestUsers();
    
    console.log('🎉 Inicialização do banco PostgreSQL Railway concluída!');
    
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
      const existingUser = await query(
        "SELECT email FROM funcionarios WHERE email = $1", 
        [user.email]
      );
      
      if (existingUser.rows && existingUser.rows.length === 0) {
        await query(
          "INSERT INTO funcionarios (email, senha, permissao) VALUES ($1, $2, $3)",
          [user.email, user.senha, user.permissao]
        );
        console.log(`✅ Usuário criado: ${user.email} (${user.permissao})`);
        usersCreated++;
      }
    } catch (error) {
      console.error(`❌ Erro ao criar usuário ${user.email}:`, error);
    }
  }

  // Verificar totais
  try {
    const funcionariosCount = await query("SELECT COUNT(*) as count FROM funcionarios");
    const protocolosCount = await query("SELECT COUNT(*) as count FROM protocolos");
    
    console.log(`👥 Total funcionários: ${funcionariosCount.rows[0].count}`);
    console.log(`📋 Total protocolos: ${protocolosCount.rows[0].count}`);
    console.log(`🆕 Usuários criados: ${usersCreated}`);
  } catch (error) {
    console.error('❌ Erro ao verificar totais:', error);
  }
};

// Função para testar conectividade
export const testConnection = async (retries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 Teste conectividade Railway - Tentativa ${attempt}/${retries}`);
      
      const result = await Promise.race([
        query("SELECT 1 as test, NOW() as timestamp, version() as pg_version", [], 1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), 5000)
        )
      ]);
      
      console.log('✅ Conectividade PostgreSQL Railway OK');
      console.log('📊 PostgreSQL version:', result.rows[0].pg_version.substring(0, 50));
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ Tentativa ${attempt}/${retries} falhou:`, error.message);
      
      if (attempt < retries) {
        const delay = Math.min(2000 * attempt, 5000);
        console.log(`⏳ Aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Função para estatísticas
export const getDatabaseStats = async () => {
  try {
    const [funcionariosResult, protocolosResult, aguardandoResult] = await Promise.all([
      query("SELECT COUNT(*) as count FROM funcionarios"),
      query("SELECT COUNT(*) as count FROM protocolos"),
      query("SELECT COUNT(*) as count FROM protocolos WHERE status = 'Aguardando'")
    ]);
    
    return {
      funcionarios: funcionariosResult.rows[0].count,
      protocolos: protocolosResult.rows[0].count,
      protocolosAguardando: aguardandoResult.rows[0].count,
      databaseType: 'PostgreSQL Railway',
      environment: process.env.NODE_ENV || 'development',
      connectionString: process.env.DATABASE_URL ? 'Railway PostgreSQL Connected' : 'Local PostgreSQL',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    throw error;
  }
};

// Cleanup
export const closeConnection = async () => {
  try {
    await db.end();
    console.log('🔒 Pool PostgreSQL Railway fechado');
  } catch (error) {
    console.error('❌ Erro ao fechar pool:', error);
  }
};

// Event listeners para cleanup
process.on('SIGINT', async () => {
  console.log('🛑 SIGINT - fechando PostgreSQL Railway...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM - fechando PostgreSQL Railway...');
  await closeConnection();
  process.exit(0);
});

// Exportar funções
export { query };
export const isPostgreSQL = true;
export default { query, isPostgreSQL: true };