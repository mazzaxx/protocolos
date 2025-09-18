import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * MÓDULO DE BANCO DE DADOS SQLITE - SQUARE CLOUD OTIMIZADO
 * 
 * Sistema de banco de dados corrigido para funcionar na Square Cloud.
 * Utiliza uma única conexão compartilhada com WAL mode para evitar locks.
 * 
 * CORREÇÕES APLICADAS:
 * - Pool simplificado com uma conexão principal
 * - Tratamento robusto de erros SQLITE_BUSY
 * - Inicialização sequencial das tabelas
 * - Timeout aumentado para Square Cloud
 */

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🗄️ [SQUARE CLOUD] Configurando SQLite otimizado (versão corrigida)');
console.log('📍 [SQUARE CLOUD] Caminho do banco:', dbPath);
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');

/**
 * CLASSE DE CONEXÃO SQLITE SIMPLIFICADA
 * 
 * Usa uma única conexão compartilhada para evitar problemas de lock.
 * Implementa retry automático e tratamento robusto de erros.
 */
class SQLiteConnection {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * INICIALIZAÇÃO DA CONEXÃO SQLITE
   * 
   * Cria uma única conexão com configurações otimizadas para Square Cloud.
   */
  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      console.log('🔗 [SQUARE CLOUD] Criando conexão SQLite única...');
      
      this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error('❌ [SQUARE CLOUD] Erro ao criar conexão:', err);
          reject(err);
          return;
        }

        console.log('✅ [SQUARE CLOUD] Conexão SQLite criada com sucesso');
        
        // Configurar SQLite para Square Cloud
        this.db.serialize(() => {
          // WAL mode para melhor concorrência
          this.db.run("PRAGMA journal_mode = WAL", (err) => {
            if (err) console.error('❌ [SQUARE CLOUD] Erro ao configurar WAL:', err);
            else console.log('✅ [SQUARE CLOUD] WAL mode ativado');
          });
          
          // Configurações otimizadas para Square Cloud
          this.db.run("PRAGMA synchronous = NORMAL");
          this.db.run("PRAGMA cache_size = 10000");
          this.db.run("PRAGMA temp_store = MEMORY");
          this.db.run("PRAGMA busy_timeout = 60000"); // 60 segundos timeout
          this.db.run("PRAGMA wal_autocheckpoint = 1000");
          
          console.log('✅ [SQUARE CLOUD] Configurações SQLite aplicadas');
          this.isInitialized = true;
          resolve();
        });
      });
    });

    return this.initPromise;
  }

  /**
   * EXECUTAR QUERY COM RETRY AUTOMÁTICO
   * 
   * Executa queries com retry em caso de SQLITE_BUSY.
   * Tratamento específico para Square Cloud.
   */
  async query(sql, params = [], retries = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    let attempt = 0;
    
    while (attempt < retries) {
      try {
        return await new Promise((resolve, reject) => {
          const startTime = Date.now();
          
          if (sql.toLowerCase().trim().startsWith('select') || sql.toLowerCase().includes('pragma')) {
            // Query de leitura
            this.db.all(sql, params, (err, rows) => {
              const duration = Date.now() - startTime;
              
              if (err) {
                if (err.code === 'SQLITE_BUSY' && attempt < retries - 1) {
                  console.warn(`⚠️ [SQUARE CLOUD] SQLITE_BUSY na tentativa ${attempt + 1}, tentando novamente...`);
                  reject(new Error('RETRY_NEEDED'));
                  return;
                }
                console.error(`❌ [SQUARE CLOUD] Query error (${duration}ms):`, err.message);
                reject(err);
              } else {
                if (duration > 1000) {
                  console.warn(`⚠️ [SQUARE CLOUD] Slow query (${duration}ms):`, sql.substring(0, 100));
                }
                resolve({ rows: rows || [] });
              }
            });
          } else {
            // Query de escrita
            this.db.run(sql, params, function(err) {
              const duration = Date.now() - startTime;
              
              if (err) {
                if (err.code === 'SQLITE_BUSY' && attempt < retries - 1) {
                  console.warn(`⚠️ [SQUARE CLOUD] SQLITE_BUSY na tentativa ${attempt + 1}, tentando novamente...`);
                  reject(new Error('RETRY_NEEDED'));
                  return;
                }
                console.error(`❌ [SQUARE CLOUD] Query error (${duration}ms):`, err.message);
                reject(err);
              } else {
                if (duration > 1000) {
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
        
        if (error.message === 'RETRY_NEEDED' && attempt < retries) {
          // Aguardar antes de tentar novamente (backoff exponencial)
          const delay = Math.min(100 * Math.pow(2, attempt), 2000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (attempt >= retries) {
          console.error(`❌ [SQUARE CLOUD] Query failed after ${retries} attempts:`, error.message);
          throw error;
        }
      }
    }
  }

  /**
   * EXECUTAR TRANSAÇÃO
   * 
   * Executa múltiplas queries em uma transação atômica.
   */
  async transaction(queries) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION");
        
        const results = [];
        let completed = 0;
        let hasError = false;
        
        queries.forEach((queryData, index) => {
          if (hasError) return;
          
          const { sql, params = [] } = queryData;
          
          this.db.run(sql, params, function(err) {
            if (err && !hasError) {
              hasError = true;
              this.db.run("ROLLBACK");
              reject(err);
              return;
            }
            
            results[index] = {
              rowCount: this.changes,
              insertId: this.lastID
            };
            
            completed++;
            
            if (completed === queries.length) {
              this.db.run("COMMIT", (commitErr) => {
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
  }

  /**
   * FECHAR CONEXÃO
   * 
   * Fecha a conexão SQLite de forma segura.
   */
  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('❌ [SQUARE CLOUD] Erro ao fechar conexão:', err);
          } else {
            console.log('✅ [SQUARE CLOUD] Conexão SQLite fechada');
          }
          resolve();
        });
      });
    }
  }
}

// Instância global da conexão
const sqliteConnection = new SQLiteConnection(dbPath);

/**
 * FUNÇÃO UNIFICADA PARA EXECUTAR QUERIES
 * 
 * Interface simplificada para executar queries SQLite.
 */
export const query = async (sql, params = []) => {
  return await sqliteConnection.query(sql, params);
};

/**
 * FUNÇÃO PARA EXECUTAR TRANSAÇÕES
 * 
 * Interface para executar transações SQLite.
 */
export const transaction = async (queries) => {
  return await sqliteConnection.transaction(queries);
};

/**
 * FUNÇÃO PARA INICIALIZAR O BANCO DE DADOS
 * 
 * Cria todas as tabelas e dados iniciais de forma sequencial.
 */
export const initializeDb = async () => {
  console.log('🚀 [SQUARE CLOUD] Inicializando banco SQLite (versão corrigida)...');
  
  try {
    // Garantir que a conexão está inicializada
    await sqliteConnection.initialize();
    
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
    
    console.log('🔍 [SQUARE CLOUD] Criando índices para funcionarios...');
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
    
    console.log('🔍 [SQUARE CLOUD] Criando índices para protocolos...');
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_status ON protocolos(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_assignedTo ON protocolos(assignedTo)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_createdBy ON protocolos(createdBy)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_createdAt ON protocolos(createdAt)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_updatedAt ON protocolos(updatedAt)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_status_assigned ON protocolos(status, assignedTo)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_queue_lookup ON protocolos(status, assignedTo, createdAt)`);
    
    console.log('🔧 [SQUARE CLOUD] Criando triggers...');
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

/**
 * FUNÇÃO PARA CRIAR USUÁRIOS DE TESTE
 */
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

/**
 * FUNÇÃO PARA TESTAR CONECTIVIDADE
 */
export const testConnection = async () => {
  try {
    const result = await query("SELECT 1 as test");
    console.log('✅ [SQUARE CLOUD] Teste de conectividade bem-sucedido');
    return result;
  } catch (error) {
    console.error('❌ [SQUARE CLOUD] Teste de conectividade falhou:', error);
    throw error;
  }
};

/**
 * FUNÇÃO PARA OBTER ESTATÍSTICAS DO BANCO
 */
export const getDatabaseStats = async () => {
  try {
    const funcionariosResult = await query("SELECT COUNT(*) as count FROM funcionarios");
    const protocolosResult = await query("SELECT COUNT(*) as count FROM protocolos");
    const aguardandoResult = await query("SELECT COUNT(*) as count FROM protocolos WHERE status = 'Aguardando'");
    
    const stats = {
      funcionarios: funcionariosResult.rows[0].count,
      protocolos: protocolosResult.rows[0].count,
      protocolosAguardando: aguardandoResult.rows[0].count,
      databaseType: 'SQLite Otimizado para Square Cloud (Corrigido)',
      environment: process.env.NODE_ENV || 'development',
      platform: 'Square Cloud'
    };
    
    return stats;
  } catch (error) {
    console.error('❌ [SQUARE CLOUD] Erro ao obter estatísticas:', error);
    throw error;
  }
};

/**
 * FUNÇÃO PARA MANUTENÇÃO DO BANCO
 */
export const maintenanceDb = async () => {
  console.log('🔧 [SQUARE CLOUD] Executando manutenção do banco...');
  
  try {
    await query("VACUUM");
    await query("REINDEX");
    await query("ANALYZE");
    await query("PRAGMA optimize");
    
    console.log('✅ [SQUARE CLOUD] Manutenção concluída');
  } catch (error) {
    console.error('❌ [SQUARE CLOUD] Erro na manutenção:', error);
  }
};

/**
 * FUNÇÃO PARA FECHAR CONEXÕES (CLEANUP)
 */
export const closeConnection = async () => {
  await sqliteConnection.close();
};

export default { query, transaction };