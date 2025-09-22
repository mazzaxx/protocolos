import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração otimizada do SQLite para Square Cloud
const isProduction = process.env.NODE_ENV === 'production';
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🗄️ Configurando SQLite otimizado para Square Cloud');
console.log('📍 Caminho do banco:', dbPath);
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');

// Conexão única SQLite para evitar locks no Square Cloud
class SQLiteConnection {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.isInitialized = false;
    this.queue = [];
    this.isProcessing = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔗 Inicializando conexão única SQLite - Square Cloud');
    
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error('❌ Erro ao criar conexão SQLite:', err);
          reject(err);
          return;
        }
        
        console.log('✅ Conexão SQLite única criada');
        
        // Configurações otimizadas para Square Cloud
        this.db.serialize(() => {
          // WAL mode para melhor concorrência
          this.db.run("PRAGMA journal_mode = WAL");
          
          // Configurações de performance
          this.db.run("PRAGMA synchronous = NORMAL");
          this.db.run("PRAGMA cache_size = 10000"); // 10MB de cache
          this.db.run("PRAGMA temp_store = MEMORY");
          this.db.run("PRAGMA mmap_size = 268435456"); // 256MB memory-mapped I/O
          
          // Configurações de timeout
          this.db.run("PRAGMA busy_timeout = 30000"); // 30 segundos timeout
          this.db.run("PRAGMA wal_autocheckpoint = 1000");
          
          // Otimizações
          this.db.run("PRAGMA optimize");
          
          console.log('⚙️ Configurações SQLite aplicadas');
        });
        
        this.isInitialized = true;
        resolve();
      });
    });
  }

  async execute(sql, params = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      if (sql.toLowerCase().trim().startsWith('select') || sql.toLowerCase().includes('pragma')) {
        // Query de leitura
        this.db.all(sql, params, (err, rows) => {
          const duration = Date.now() - startTime;
          
          if (err) {
            console.error(`❌ Query error (${duration}ms):`, err.message);
            reject(err);
          } else {
            if (duration > 2000) {
              console.warn(`⚠️ Slow query (${duration}ms):`, sql.substring(0, 100));
            }
            resolve({ rows: rows || [] });
          }
        });
      } else {
        // Query de escrita
        this.db.run(sql, params, function(err) {
          const duration = Date.now() - startTime;
          
          if (err) {
            console.error(`❌ Query error (${duration}ms):`, err.message);
            reject(err);
          } else {
            if (duration > 2000) {
              console.warn(`⚠️ Slow query (${duration}ms):`, sql.substring(0, 100));
            }
            resolve({ 
              rowCount: this.changes,
              insertId: this.lastID,
              changes: this.changes
            });
          }
        });
      }
    });
  }

  async close() {
    if (this.db) {
      console.log('🔒 Fechando conexão SQLite...');
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('❌ Erro ao fechar conexão:', err);
          } else {
            console.log('✅ Conexão SQLite fechada');
          }
          resolve();
        });
      });
    }
  }
}

// Instância global da conexão
const connection = new SQLiteConnection(dbPath);

// Função unificada para executar queries com retry automático
const query = async (sql, params = [], retries = 3) => {
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      return await connection.execute(sql, params);
    } catch (error) {
      attempt++;
      console.error(`❌ Tentativa ${attempt}/${retries} falhou:`, error.message);
      
      if (attempt >= retries) {
        throw new Error(`Query failed after ${retries} attempts: ${error.message}`);
      }
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Função para executar transações
const transaction = async (queries) => {
  try {
    await connection.execute("BEGIN TRANSACTION");
    
    const results = [];
    
    for (const queryData of queries) {
      const { sql, params = [] } = queryData;
      const result = await connection.execute(sql, params);
      results.push(result);
    }
    
    await connection.execute("COMMIT");
    return results;
  } catch (error) {
    await connection.execute("ROLLBACK");
    throw error;
  }
};

// Função para inicializar o banco de dados
export const initializeDb = async () => {
  console.log('🚀 Inicializando banco SQLite para Square Cloud...');
  
  try {
    // Aguardar inicialização da conexão
    await connection.initialize();
    
    // Criar tabelas com índices otimizados
    console.log('📋 Criando tabela funcionarios...');
    await query(`
      CREATE TABLE IF NOT EXISTS funcionarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        permissao TEXT NOT NULL DEFAULT 'advogado',
        equipe TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Índices para funcionarios
    await query(`CREATE INDEX IF NOT EXISTS idx_funcionarios_email ON funcionarios(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_funcionarios_permissao ON funcionarios(permissao)`);
    
    console.log('📋 Criando tabela protocolos...');
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
    
    // Índices críticos para performance
    console.log('🔍 Criando índices otimizados...');
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_status ON protocolos(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_assignedTo ON protocolos(assignedTo)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_createdBy ON protocolos(createdBy)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_createdAt ON protocolos(createdAt)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_updatedAt ON protocolos(updatedAt)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_status_assigned ON protocolos(status, assignedTo)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_queue_lookup ON protocolos(status, assignedTo, createdAt)`);
    
    // Trigger para atualizar updated_at automaticamente
    await query(`
      CREATE TRIGGER IF NOT EXISTS update_protocolos_timestamp 
      AFTER UPDATE ON protocolos
      BEGIN
        UPDATE protocolos SET updatedAt = datetime('now') WHERE id = NEW.id;
      END
    `);
    
    await query(`
      CREATE TRIGGER IF NOT EXISTS update_funcionarios_timestamp 
      AFTER UPDATE ON funcionarios
      BEGIN
        UPDATE funcionarios SET updated_at = datetime('now') WHERE id = NEW.id;
      END
    `);
    
    // Criar usuários de teste
    await createTestUsers();
    
    // Otimizar banco após criação
    console.log('⚡ Otimizando banco de dados...');
    await query(`ANALYZE`);
    await query(`PRAGMA optimize`);
    
    // Estatísticas finais
    const stats = await getDatabaseStats();
    console.log('📊 Estatísticas do banco:', stats);
    console.log('🎉 Inicialização SQLite concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na inicialização do banco:', error);
    throw error;
  }
};

// Função para criar usuários de teste
const createTestUsers = async () => {
  // Definir equipes
  const equipes = {
    'Equipe Rahner': [
      "Maísa Abreu", "Tais Brandão", "Ana Catarina",
      "Angélica Andrade", "Dayane Cristina", "Isabela Dornelas",
      "Layla Oliveira", "Thaisa Gomes", "Rafael Rahner"
    ],
    'Equipe Mayssa': [
      "Camila Pimenta", "Carolina Vieira", "Diná Souza",
      "Nathalia Cristina", "Stefani Caroline", "Mayssa Marcela"
    ],
    'Equipe Juacy': [
      "Adriana Xavier", "Amanda Marques", "André Alencar", "Daiane Alves",
      "Eloízio Andrade", "Gabriel Augusto", "Natalia Ferreira", "Priscila Alves",
      "Ramon Alves", "Rejane Oliveira", "Thalita Gonzaga", "Thiago Paiva", "Juacy Leal"
    ],
    'Equipe Johnson': [
      "Ana Marinho", "Audrey Roberto", "Dayane Machado", "Isabela Nogueira",
      "Izadora Feital", "Jéssica Oliveira", "Lucas Barroso", "Paloma Teodoro",
      "Pedro Gama", "Sabrina Alves", "Talita Freitas", "Thiago Johnson"
    ],
    'Equipe Flaviana': [
      "Arthur Ferreira", "Clara Pires", "Deivison José", "Idaelly Dutra",
      "João Pedro Sales", "Juliana Ferreira", "Priscila Cristina",
      "Rinara de Sá", "Vandressa Barroso", "Flaviana Estevam"
    ]
  };

  const testUsers = [
    { email: 'admin@escritorio.com', senha: '123456', permissao: 'admin', equipe: null },
    { email: 'mod@escritorio.com', senha: '123456', permissao: 'mod', equipe: null },
    { email: 'advogado@escritorio.com', senha: '123456', permissao: 'advogado', equipe: null }
  ];

  // Adicionar usuários das equipes
  Object.entries(equipes).forEach(([nomeEquipe, membros]) => {
    membros.forEach(nome => {
      const email = nome.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '') + '@nca.com';
      
      testUsers.push({
        email,
        senha: '123456',
        permissao: 'advogado',
        equipe: nomeEquipe
      });
    });
  });

  let usersCreated = 0;

  for (const user of testUsers) {
    try {
      const existingUser = await query(
        "SELECT email FROM funcionarios WHERE email = ?",
        [user.email]
      );
      
      if (existingUser.rows.length === 0) {
        await query(
          "INSERT INTO funcionarios (email, senha, permissao, equipe) VALUES (?, ?, ?, ?)",
          [user.email, user.senha, user.permissao, user.equipe]
        );
        console.log(`✅ Usuário criado: ${user.email} (${user.permissao}${user.equipe ? ` - ${user.equipe}` : ''})`);
        usersCreated++;
      }
    } catch (error) {
      console.error(`❌ Erro ao criar usuário ${user.email}:`, error);
    }
  }

  if (usersCreated > 0) {
    console.log(`🆕 ${usersCreated} usuários criados nesta inicialização`);
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
      funcionarios: funcionariosResult.rows[0].count,
      protocolos: protocolosResult.rows[0].count,
      protocolosAguardando: aguardandoResult.rows[0].count,
      databaseType: 'SQLite Otimizado para Square Cloud',
      environment: process.env.NODE_ENV || 'development'
    };
    
    return stats;
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    throw error;
  }
};

// Função para manutenção do banco
export const maintenanceDb = async () => {
  console.log('🔧 Executando manutenção do banco...');
  
  try {
    // Vacuum para otimizar espaço
    await query("VACUUM");
    
    // Reindexar para otimizar queries
    await query("REINDEX");
    
    // Analisar estatísticas
    await query("ANALYZE");
    
    // Otimizar
    await query("PRAGMA optimize");
    
    console.log('✅ Manutenção concluída');
  } catch (error) {
    console.error('❌ Erro na manutenção:', error);
  }
};

// Função para fechar conexões (cleanup)
export const closeConnection = async () => {
  await connection.close();
};

// Exportar funções principais
export { query, transaction };
export default { query, transaction };