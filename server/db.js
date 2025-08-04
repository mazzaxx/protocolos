import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { Pool } = pkg;

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do PostgreSQL
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

let dbConfig;

if (isProduction && process.env.DATABASE_URL) {
  // Railway PostgreSQL (produção)
  console.log('🐘 Configurando PostgreSQL para produção (Railway)');
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10, // máximo de conexões no pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
} else {
  // SQLite para desenvolvimento local
  console.log('🗄️ Usando SQLite para desenvolvimento local');
  // Manter SQLite para desenvolvimento - será configurado abaixo
}

let db;
let isPostgreSQL = false;

if (isProduction && process.env.DATABASE_URL) {
  // PostgreSQL Pool
  db = new Pool(dbConfig);
  isPostgreSQL = true;
  
  console.log('✅ Pool PostgreSQL configurado');
  console.log('🔗 Max connections:', dbConfig.max);
} else {
  // SQLite para desenvolvimento
  const sqlite3 = await import('sqlite3');
  const sqlite = sqlite3.default.verbose();
  
  const dbPath = path.join(__dirname, 'database.sqlite');
  console.log('🗄️ Caminho do banco SQLite:', dbPath);
  
  db = new sqlite.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Erro ao conectar com SQLite:', err);
    } else {
      console.log('✅ Conectado ao banco SQLite');
    }
  });
}

// Função para executar queries de forma unificada
const query = async (sql, params = []) => {
  if (isPostgreSQL) {
    // PostgreSQL
    const client = await db.connect();
    try {
      const result = await client.query(sql, params);
      return result;
    } finally {
      client.release();
    }
  } else {
    // SQLite
    return new Promise((resolve, reject) => {
      if (sql.toLowerCase().includes('select') || sql.toLowerCase().includes('pragma')) {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      } else {
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ 
            rowCount: this.changes,
            insertId: this.lastID 
          });
        });
      }
    });
  }
};

// Função para inicializar o banco de dados
export const initializeDb = async () => {
  console.log('🚀 Inicializando banco de dados...');
  console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
  console.log('🗄️ Tipo de banco:', isPostgreSQL ? 'PostgreSQL' : 'SQLite');
  
  try {
    if (isPostgreSQL) {
      // PostgreSQL - Criar tabelas
      console.log('🐘 Criando tabelas PostgreSQL...');
      
      // Criar tabela funcionarios
      await query(`
        CREATE TABLE IF NOT EXISTS funcionarios (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          senha VARCHAR(255) NOT NULL,
          permissao VARCHAR(50) NOT NULL DEFAULT 'advogado'
        )
      `);
      console.log('✅ Tabela funcionarios criada/verificada (PostgreSQL)');

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
      console.log('✅ Tabela protocolos criada/verificada (PostgreSQL)');

      // Verificar estrutura das tabelas
      const funcionariosInfo = await query(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'funcionarios'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Estrutura da tabela funcionarios (PostgreSQL):');
      funcionariosInfo.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });

    } else {
      // SQLite - Manter código original
      console.log('🗄️ Criando tabelas SQLite...');
      
      await query(`
        CREATE TABLE IF NOT EXISTS funcionarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          senha TEXT NOT NULL,
          permissao TEXT NOT NULL DEFAULT 'advogado'
        )
      `);
      console.log('✅ Tabela funcionarios criada/verificada (SQLite)');

      await query(`
        CREATE TABLE IF NOT EXISTS protocolos (
          id TEXT PRIMARY KEY,
          processNumber TEXT NOT NULL DEFAULT '',
          court TEXT NOT NULL DEFAULT '',
          system TEXT NOT NULL DEFAULT '',
          jurisdiction TEXT NOT NULL DEFAULT '',
          processType TEXT NOT NULL DEFAULT 'civel',
          isFatal INTEGER NOT NULL DEFAULT 0,
          needsProcuration INTEGER NOT NULL DEFAULT 0,
          procurationType TEXT DEFAULT '',
          needsGuia INTEGER NOT NULL DEFAULT 0,
          guias TEXT NOT NULL DEFAULT '[]',
          petitionType TEXT NOT NULL DEFAULT '',
          observations TEXT DEFAULT '',
          documents TEXT NOT NULL DEFAULT '[]',
          status TEXT NOT NULL DEFAULT 'Aguardando',
          assignedTo TEXT DEFAULT NULL,
          createdBy INTEGER NOT NULL,
          returnReason TEXT DEFAULT NULL,
          isDistribution INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          queuePosition INTEGER NOT NULL DEFAULT 1,
          activityLog TEXT NOT NULL DEFAULT '[]',
          FOREIGN KEY (createdBy) REFERENCES funcionarios (id)
        )
      `);
      console.log('✅ Tabela protocolos criada/verificada (SQLite)');
    }

    // Criar usuários de teste
    await createTestUsers();
    
    console.log('🎉 Inicialização do banco concluída!');
    
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
    
    const funcionariosTotal = isPostgreSQL ? funcionariosCount.rows[0].count : funcionariosCount.rows[0].count;
    const protocolosTotal = isPostgreSQL ? protocolosCount.rows[0].count : protocolosCount.rows[0].count;
    
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
    console.log('✅ Teste de conectividade bem-sucedido');
    return result;
  } catch (error) {
    console.error('❌ Teste de conectividade falhou:', error);
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
      funcionarios: isPostgreSQL ? funcionariosResult.rows[0].count : funcionariosResult.rows[0].count,
      protocolos: isPostgreSQL ? protocolosResult.rows[0].count : protocolosResult.rows[0].count,
      protocolosAguardando: isPostgreSQL ? aguardandoResult.rows[0].count : aguardandoResult.rows[0].count,
      databaseType: isPostgreSQL ? 'PostgreSQL' : 'SQLite',
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
  if (isPostgreSQL) {
    await db.end();
    console.log('🔒 Pool PostgreSQL fechado');
  } else {
    return new Promise((resolve) => {
      db.close((err) => {
        if (err) {
          console.error('❌ Erro ao fechar SQLite:', err);
        } else {
          console.log('🔒 Conexão SQLite fechada');
        }
        resolve();
      });
    });
  }
};

// Exportar query function e informações do banco
export { query, isPostgreSQL };
export default { query, isPostgreSQL };