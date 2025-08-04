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
  console.log('🐘 Usando PostgreSQL com DATABASE_URL');
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? {
      rejectUnauthorized: false
    } : false,
    max: 10, // máximo de conexões no pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
} else {
  // PostgreSQL local (desenvolvimento sem Railway)
  console.log('🐘 Usando PostgreSQL local');
  dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'protocolos_juridicos',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

// PostgreSQL Pool
const db = new Pool(dbConfig);

console.log('✅ Pool PostgreSQL configurado');
console.log('🔗 Max connections:', dbConfig.max);

// Função para executar queries
const query = async (sql, params = []) => {
  const client = await db.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
};

// Função para inicializar o banco de dados
export const initializeDb = async () => {
  console.log('🚀 Inicializando banco de dados PostgreSQL...');
  console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
  
  try {
    // Criar tabela funcionarios
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

    // Verificar estrutura das tabelas
    const funcionariosInfo = await query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'funcionarios'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estrutura da tabela funcionarios:');
    funcionariosInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

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

// Função para testar conectividade
export const testConnection = async () => {
  try {
    const result = await query("SELECT 1 as test");
    console.log('✅ Teste de conectividade PostgreSQL bem-sucedido');
    return result;
  } catch (error) {
    console.error('❌ Teste de conectividade PostgreSQL falhou:', error);
    throw error;
  }
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
      environment: process.env.NODE_ENV || 'development'
    };
    
    return stats;
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    throw error;
  }
};

// Função para fechar conexões (cleanup)
export const closeConnection = async () => {
  await db.end();
  console.log('🔒 Pool PostgreSQL fechado');
};

// Exportar query function e informações do banco
export { query };
export const isPostgreSQL = true;
export default { query, isPostgreSQL: true };