import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * MÓDULO DE BANCO DE DADOS SQLITE - SQUARE CLOUD OTIMIZADO
 * 
 * Sistema de banco de dados otimizado especificamente para Square Cloud.
 * Reduzido número de conexões para evitar travamentos.
 * 
 * CARACTERÍSTICAS PARA SQUARE CLOUD:
 * - SQLite funciona perfeitamente na plataforma
 * - Pool reduzido para evitar SQLITE_BUSY
 * - WAL mode com configurações conservadoras
 * - Manutenção automática otimizada
 */

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🗄️ [SQUARE CLOUD] Configurando SQLite otimizado para produção');
console.log('📍 [SQUARE CLOUD] Caminho do banco:', dbPath);
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
console.log('☁️ Plataforma: Square Cloud - SQLite nativo');

/**
 * CLASSE DE POOL DE CONEXÕES SQLITE OTIMIZADA
 * 
 * Pool reduzido para evitar conflitos na Square Cloud.
 * Configurações conservadoras para máxima estabilidade.
 */
class SQLitePool {
  constructor(dbPath, maxConnections = 3) { // REDUZIDO para 3 conexões
    this.dbPath = dbPath;
    this.maxConnections = maxConnections;
    this.connections = [];
    this.activeConnections = 0;
    this.queue = [];
    this.isClosing = false;
    
    this.initializePool();
  }

  initializePool() {
    console.log(`🔗 [SQUARE CLOUD] Inicializando pool SQLite com ${this.maxConnections} conexões (otimizado)`);
    
    for (let i = 0; i < this.maxConnections; i++) {
      const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error(`❌ [SQUARE CLOUD] Erro ao criar conexão ${i}:`, err);
        } else {
          console.log(`✅ [SQUARE CLOUD] Conexão SQLite ${i} criada`);
          
          // SQUARE CLOUD: Configurações conservadoras para estabilidade
          db.serialize(() => {
            db.run("PRAGMA journal_mode = WAL");
            db.run("PRAGMA synchronous = NORMAL");
            db.run("PRAGMA cache_size = 2000"); // Reduzido para 2MB
            db.run("PRAGMA temp_store = MEMORY");
            db.run("PRAGMA busy_timeout = 10000"); // Reduzido para 10s
            db.run("PRAGMA wal_autocheckpoint = 100"); // Mais frequente
          });
        }
      });
      
      this.connections.push({
        db,
        inUse: false,
        id: i
      });
    }
  }

  async getConnection() {
    if (this.isClosing) {
      throw new Error('Pool is closing');
    }

    return new Promise((resolve, reject) => {
      const availableConnection = this.connections.find(conn => !conn.inUse);
      
      if (availableConnection) {
        availableConnection.inUse = true;
        this.activeConnections++;
        resolve(availableConnection);
      } else {
        this.queue.push({ resolve, reject });
        
        // Timeout reduzido para evitar travamentos
        setTimeout(() => {
          const index = this.queue.findIndex(item => item.resolve === resolve);
          if (index !== -1) {
            this.queue.splice(index, 1);
            reject(new Error('Square Cloud: Connection timeout (5s)'));
          }
        }, 5000); // 5 segundos timeout
      }
    });
  }

  releaseConnection(connection) {
    if (this.isClosing) return;
    
    connection.inUse = false;
    this.activeConnections--;
    
    if (this.queue.length > 0) {
      const { resolve } = this.queue.shift();
      connection.inUse = true;
      this.activeConnections++;
      resolve(connection);
    }
  }

  async close() {
    console.log('🔒 [SQUARE CLOUD] Fechando pool de conexões SQLite...');
    this.isClosing = true;
    
    // Rejeitar todas as requisições pendentes
    this.queue.forEach(({ reject }) => {
      reject(new Error('Pool is closing'));
    });
    this.queue = [];
    
    const closePromises = this.connections.map(conn => {
      return new Promise((resolve) => {
        if (conn.db) {
          conn.db.close((err) => {
            if (err && err.code !== 'SQLITE_MISUSE') {
              console.error(`❌ [SQUARE CLOUD] Erro ao fechar conexão ${conn.id}:`, err);
            } else {
              console.log(`✅ [SQUARE CLOUD] Conexão ${conn.id} fechada`);
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
    
    await Promise.all(closePromises);
    console.log('🔒 [SQUARE CLOUD] Todas as conexões SQLite fechadas');
  }

  getStats() {
    return {
      totalConnections: this.connections.length,
      activeConnections: this.activeConnections,
      queueLength: this.queue.length,
      availableConnections: this.connections.length - this.activeConnections,
      platform: 'Square Cloud'
    };
  }
}

// SQUARE CLOUD: Pool otimizado com apenas 3 conexões
const pool = new SQLitePool(dbPath, 3);

/**
 * FUNÇÃO UNIFICADA PARA EXECUTAR QUERIES - OTIMIZADA
 */
const query = async (sql, params = [], retries = 2) => { // Reduzido para 2 tentativas
  let connection;
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      connection = await pool.getConnection();
      
      return await new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        if (sql.toLowerCase().trim().startsWith('select') || sql.toLowerCase().includes('pragma')) {
          connection.db.all(sql, params, (err, rows) => {
            const duration = Date.now() - startTime;
            
            if (err) {
              console.error(`❌ [SQUARE CLOUD] Query error (${duration}ms):`, err.message);
              reject(err);
            } else {
              if (duration > 2000) { // Aumentado threshold para 2s
                console.warn(`⚠️ [SQUARE CLOUD] Slow query (${duration}ms):`, sql.substring(0, 100));
              }
              resolve({ rows: rows || [] });
            }
          });
        } else {
          connection.db.run(sql, params, function(err) {
            const duration = Date.now() - startTime;
            
            if (err) {
              console.error(`❌ [SQUARE CLOUD] Query error (${duration}ms):`, err.message);
              reject(err);
            } else {
              if (duration > 2000) {
                console.warn(`⚠️ [SQUARE CLOUD] Slow query (${duration}ms):`, sql.substring(0, 100));
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
    } catch (error) {
      attempt++;
      console.error(`❌ [SQUARE CLOUD] Tentativa ${attempt}/${retries} falhou:`, error.message);
      
      if (attempt >= retries) {
        throw new Error(`[SQUARE CLOUD] Query failed after ${retries} attempts: ${error.message}`);
      }
      
      // Aguardar antes de retry
      await new Promise(resolve => setTimeout(resolve, 200 * attempt));
    } finally {
      if (connection) {
        pool.releaseConnection(connection);
      }
    }
  }
};

/**
 * FUNÇÃO PARA TRANSAÇÕES OTIMIZADA
 */
const transaction = async (queries) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    return await new Promise((resolve, reject) => {
      connection.db.serialize(() => {
        connection.db.run("BEGIN TRANSACTION");
        
        const results = [];
        let completed = 0;
        let hasError = false;
        
        queries.forEach((queryData, index) => {
          if (hasError) return;
          
          const { sql, params = [] } = queryData;
          
          connection.db.run(sql, params, function(err) {
            if (err && !hasError) {
              hasError = true;
              connection.db.run("ROLLBACK");
              reject(err);
              return;
            }
            
            results[index] = {
              rowCount: this.changes,
              insertId: this.lastID
            };
            
            completed++;
            
            if (completed === queries.length) {
              connection.db.run("COMMIT", (commitErr) => {
                if (commitErr) {
                  reject(commitErr);
                } else {
                  resolve(results);
                }
              });
            }
          });
        });
      });
    });
  } finally {
    if (connection) {
      pool.releaseConnection(connection);
    }
  }
};

/**
 * INICIALIZAÇÃO DO BANCO OTIMIZADA
 */
export const initializeDb = async () => {
  console.log('🚀 [SQUARE CLOUD] Inicializando banco SQLite otimizado...');
  console.log('📊 [SQUARE CLOUD] Configuração para alta estabilidade');
  
  try {
    // Aguardar um pouco para garantir que o pool está pronto
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📋 [SQUARE CLOUD] Criando tabela funcionarios...');
    await query(`
      CREATE TABLE IF NOT EXISTS funcionarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        permissao TEXT NOT NULL DEFAULT 'advogado',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_funcionarios_email ON funcionarios(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_funcionarios_permissao ON funcionarios(permissao)`);
    
    console.log('📋 [SQUARE CLOUD] Criando tabela protocolos...');
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
    
    console.log('🔍 [SQUARE CLOUD] Criando índices otimizados...');
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_status ON protocolos(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_assignedTo ON protocolos(assignedTo)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_createdBy ON protocolos(createdBy)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_createdAt ON protocolos(createdAt)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_status_assigned ON protocolos(status, assignedTo)`);
    
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
    
    await createTestUsers();
    
    console.log('⚡ [SQUARE CLOUD] Otimizando banco de dados...');
    await query(`ANALYZE`);
    await query(`PRAGMA optimize`);
    
    const stats = await getDatabaseStats();
    console.log('📊 [SQUARE CLOUD] Estatísticas do banco:', stats);
    console.log('🎉 [SQUARE CLOUD] Inicialização SQLite concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ [SQUARE CLOUD] Erro na inicialização do banco:', error);
    throw error;
  }
};

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
        "SELECT email FROM funcionarios WHERE email = ?", 
        [user.email]
      );
      
      if (existingUser.rows.length === 0) {
        await query(
          "INSERT INTO funcionarios (email, senha, permissao) VALUES (?, ?, ?)",
          [user.email, user.senha, user.permissao]
        );
        console.log(`✅ [SQUARE CLOUD] Usuário de teste criado: ${user.email} (${user.permissao})`);
        usersCreated++;
      }
    } catch (error) {
      console.error(`❌ [SQUARE CLOUD] Erro ao criar usuário ${user.email}:`, error);
    }
  }

  if (usersCreated > 0) {
    console.log(`🆕 [SQUARE CLOUD] ${usersCreated} usuários criados nesta inicialização`);
  }
};

export const testConnection = async () => {
  try {
    const result = await query("SELECT 1 as test");
    const stats = pool.getStats();
    console.log('✅ [SQUARE CLOUD] Teste de conectividade bem-sucedido');
    console.log('📊 [SQUARE CLOUD] Pool stats:', stats);
    return result;
  } catch (error) {
    console.error('❌ [SQUARE CLOUD] Teste de conectividade falhou:', error);
    throw error;
  }
};

export const getDatabaseStats = async () => {
  try {
    const funcionariosResult = await query("SELECT COUNT(*) as count FROM funcionarios");
    const protocolosResult = await query("SELECT COUNT(*) as count FROM protocolos");
    const aguardandoResult = await query("SELECT COUNT(*) as count FROM protocolos WHERE status = 'Aguardando'");
    const poolStats = pool.getStats();
    
    const stats = {
      funcionarios: funcionariosResult.rows[0].count,
      protocolos: protocolosResult.rows[0].count,
      protocolosAguardando: aguardandoResult.rows[0].count,
      databaseType: 'SQLite Otimizado para Square Cloud',
      environment: process.env.NODE_ENV || 'development',
      poolStats,
      platform: 'Square Cloud'
    };
    
    return stats;
  } catch (error) {
    console.error('❌ [SQUARE CLOUD] Erro ao obter estatísticas:', error);
    throw error;
  }
};

export const maintenanceDb = async () => {
  console.log('🔧 [SQUARE CLOUD] Executando manutenção do banco...');
  
  try {
    await query("PRAGMA optimize");
    console.log('✅ [SQUARE CLOUD] Manutenção concluída');
  } catch (error) {
    console.error('❌ [SQUARE CLOUD] Erro na manutenção:', error);
  }
};

export const closeConnection = async () => {
  await pool.close();
};

export { query, transaction };
export default { query, transaction };