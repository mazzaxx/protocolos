import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração otimizada do SQLite para múltiplos usuários
const isProduction = process.env.NODE_ENV === 'production';
const isSquareCloud = process.env.SQUARE_CLOUD === 'true' || process.platform === 'linux';
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🗄️ Configurando SQLite otimizado para produção');
console.log('📍 Caminho do banco:', dbPath);
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
console.log('☁️ Plataforma:', isSquareCloud ? 'Square Cloud' : 'Local/Railway');

// Pool de conexões SQLite simulado
class SQLitePool {
  constructor(dbPath, maxConnections = 15) {
    this.dbPath = dbPath;
    // Ajustar conexões baseado na plataforma e RAM disponível
    this.maxConnections = isSquareCloud ? 8 : maxConnections; // Square Cloud: mais conservador
    this.connections = [];
    this.activeConnections = 0;
    this.queue = [];
    
    // Criar conexões iniciais
    this.initializePool();
  }

  initializePool() {
    const platform = isSquareCloud ? 'Square Cloud (4GB RAM)' : 'Railway/Local';
    console.log(`🔗 Inicializando pool SQLite com ${this.maxConnections} conexões - ${platform}`);
    
    for (let i = 0; i < this.maxConnections; i++) {
      const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error(`❌ Erro ao criar conexão ${i}:`, err);
        } else {
          console.log(`✅ Conexão SQLite ${i} criada`);
          
          // Otimizações críticas para performance
          db.serialize(() => {
            // WAL mode para melhor concorrência
            db.run("PRAGMA journal_mode = WAL");
            
            // Otimizações de performance para 4GB RAM
            db.run("PRAGMA synchronous = NORMAL"); // Balance entre segurança e performance
            db.run("PRAGMA cache_size = 20000"); // 20MB de cache (mais RAM disponível)
            db.run("PRAGMA temp_store = MEMORY"); // Tabelas temporárias em memória
            db.run("PRAGMA mmap_size = 536870912"); // 512MB memory-mapped I/O (mais RAM)
            
            // Otimizações para concorrência
            db.run("PRAGMA busy_timeout = 30000"); // 30 segundos timeout
            db.run("PRAGMA wal_autocheckpoint = 2000"); // Checkpoint a cada 2000 páginas (mais RAM)
            
            // Otimizações de escrita
            db.run("PRAGMA optimize"); // Otimizar estatísticas
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
    return new Promise((resolve, reject) => {
      // Procurar conexão disponível
      const availableConnection = this.connections.find(conn => !conn.inUse);
      
      if (availableConnection) {
        availableConnection.inUse = true;
        this.activeConnections++;
        resolve(availableConnection);
      } else {
        // Adicionar à fila se não há conexões disponíveis
        this.queue.push({ resolve, reject });
        
        // Timeout para evitar travamento
        setTimeout(() => {
          const index = this.queue.findIndex(item => item.resolve === resolve);
          if (index !== -1) {
            this.queue.splice(index, 1);
            reject(new Error('Connection timeout'));
          }
        }, 10000); // 10 segundos timeout
      }
    });
  }

  releaseConnection(connection) {
    connection.inUse = false;
    this.activeConnections--;
    
    // Processar fila se há requisições esperando
    if (this.queue.length > 0) {
      const { resolve } = this.queue.shift();
      connection.inUse = true;
      this.activeConnections++;
      resolve(connection);
    }
  }

  async close() {
    console.log('🔒 Fechando pool de conexões SQLite...');
    
    const closePromises = this.connections.map(conn => {
      return new Promise((resolve) => {
        conn.db.close((err) => {
          if (err) {
            console.error(`❌ Erro ao fechar conexão ${conn.id}:`, err);
          } else {
            console.log(`✅ Conexão ${conn.id} fechada`);
          }
          resolve();
        });
      });
    });
    
    await Promise.all(closePromises);
    console.log('🔒 Todas as conexões SQLite fechadas');
  }

  getStats() {
    return {
      totalConnections: this.connections.length,
      activeConnections: this.activeConnections,
      queueLength: this.queue.length,
      availableConnections: this.connections.length - this.activeConnections,
      platform: isSquareCloud ? 'Square Cloud' : 'Railway/Local'
    };
  }
}

// Instância global do pool
const pool = new SQLitePool(dbPath, 20); // 20 conexões com 4GB RAM

// Função unificada para executar queries com retry automático
const query = async (sql, params = [], retries = 3) => {
  let connection;
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      connection = await pool.getConnection();
      
      return await new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        if (sql.toLowerCase().trim().startsWith('select') || sql.toLowerCase().includes('pragma')) {
          // Query de leitura
          connection.db.all(sql, params, (err, rows) => {
            const duration = Date.now() - startTime;
            
            if (err) {
              console.error(`❌ Query error (${duration}ms):`, err.message);
              console.error(`📝 SQL:`, sql);
              console.error(`📊 Params:`, params);
              reject(err);
            } else {
              if (duration > 1000) {
                console.warn(`⚠️ Slow query (${duration}ms):`, sql.substring(0, 100));
              }
              resolve({ rows: rows || [] });
            }
          });
        } else {
          // Query de escrita
          connection.db.run(sql, params, function(err) {
            const duration = Date.now() - startTime;
            
            if (err) {
              console.error(`❌ Query error (${duration}ms):`, err.message);
              console.error(`📝 SQL:`, sql);
              console.error(`📊 Params:`, params);
              reject(err);
            } else {
              if (duration > 1000) {
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
    } catch (error) {
      attempt++;
      console.error(`❌ Tentativa ${attempt}/${retries} falhou:`, error.message);
      
      if (attempt >= retries) {
        throw new Error(`Query failed after ${retries} attempts: ${error.message}`);
      }
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 100 * attempt));
    } finally {
      if (connection) {
        pool.releaseConnection(connection);
      }
    }
  }
};

// Função para executar transações
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

// Função para inicializar o banco de dados
export const initializeDb = async () => {
  console.log('🚀 Inicializando banco SQLite otimizado...');
  console.log('📊 Configuração para 100+ usuários simultâneos');
  
  try {
    // Criar tabelas com índices otimizados
    console.log('📋 Criando tabela funcionarios...');
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
        console.log(`✅ Usuário de teste criado: ${user.email} (${user.permissao})`);
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
    const stats = pool.getStats();
    console.log('✅ Teste de conectividade bem-sucedido');
    console.log('📊 Pool stats:', stats);
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
    const poolStats = pool.getStats();
    
    const stats = {
      funcionarios: funcionariosResult.rows[0].count,
      protocolos: protocolosResult.rows[0].count,
      protocolosAguardando: aguardandoResult.rows[0].count,
      databaseType: 'SQLite Otimizado',
      environment: process.env.NODE_ENV || 'development',
      poolStats
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
  await pool.close();
};

// Exportar funções principais
export { query, transaction };
export default { query, transaction };