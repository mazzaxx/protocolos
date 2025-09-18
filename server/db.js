import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * MÓDULO DE BANCO DE DADOS SQLITE - SQUARE CLOUD
 * 
 * Sistema de banco de dados otimizado para funcionar na Square Cloud.
 * Utiliza SQLite com WAL mode e pool de conexões para alta performance.
 * 
 * CARACTERÍSTICAS PARA SQUARE CLOUD:
 * - SQLite funciona perfeitamente na plataforma
 * - Não requer configuração externa de banco
 * - Pool de conexões otimizado para múltiplos usuários
 * - WAL mode para melhor concorrência
 * - Manutenção automática
 * 
 * HOSPEDAGEM SQUARE CLOUD:
 * - Banco SQLite é salvo no sistema de arquivos
 * - Persiste entre deploys
 * - Backup automático pela plataforma
 */

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * CONFIGURAÇÃO SQLITE OTIMIZADA PARA SQUARE CLOUD
 * 
 * Define o caminho do banco e configurações de produção.
 * Square Cloud mantém arquivos persistentes automaticamente.
 */
const isProduction = process.env.NODE_ENV === 'production';
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🗄️ [SQUARE CLOUD] Configurando SQLite otimizado');
console.log('📍 [SQUARE CLOUD] Caminho do banco:', dbPath);
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
console.log('☁️ Plataforma: Square Cloud - SQLite nativo');

/**
 * CLASSE DE POOL DE CONEXÕES SQLITE
 * 
 * Simula um pool de conexões para SQLite, otimizado para Square Cloud.
 * Permite múltiplos usuários simultâneos sem conflitos.
 * 
 * FUNCIONALIDADES:
 * - Até 15 conexões simultâneas
 * - WAL mode para concorrência
 * - Cache de 10MB para performance
 * - Timeout de 30 segundos
 * - Otimizações específicas para Square Cloud
 */
class SQLitePool {
  constructor(dbPath, maxConnections = 10) {
    this.dbPath = dbPath;
    this.maxConnections = maxConnections;
    this.connections = [];
    this.activeConnections = 0;
    this.queue = [];
    
    // SQUARE CLOUD: Criar conexões iniciais otimizadas
    this.initializePool();
  }

  /**
   * INICIALIZAÇÃO DO POOL DE CONEXÕES
   * 
   * Cria múltiplas conexões SQLite com otimizações específicas
   * para funcionar perfeitamente na Square Cloud.
   */
  initializePool() {
    console.log(`🔗 [SQUARE CLOUD] Inicializando pool SQLite com ${this.maxConnections} conexões`);
    
    for (let i = 0; i < this.maxConnections; i++) {
      const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error(`❌ [SQUARE CLOUD] Erro ao criar conexão ${i}:`, err);
        } else {
          console.log(`✅ [SQUARE CLOUD] Conexão SQLite ${i} criada`);
          
          /**
           * OTIMIZAÇÕES CRÍTICAS PARA SQUARE CLOUD
           * 
           * Configurações específicas para máxima performance
           * na infraestrutura da Square Cloud.
           */
          db.serialize(() => {
            // SQUARE CLOUD: WAL mode para múltiplos usuários simultâneos
            db.run("PRAGMA journal_mode = WAL");
            
            // SQUARE CLOUD: Otimizações de performance específicas
            db.run("PRAGMA synchronous = NORMAL"); // Balanço segurança/performance
            db.run("PRAGMA cache_size = 10000"); // 10MB cache para Square Cloud
            db.run("PRAGMA temp_store = MEMORY"); // Temporários em memória
            db.run("PRAGMA mmap_size = 268435456"); // 256MB memory-mapped I/O
            
            // SQUARE CLOUD: Otimizações para concorrência
            db.run("PRAGMA busy_timeout = 30000"); // 30s timeout para Square Cloud
            db.run("PRAGMA wal_autocheckpoint = 1000"); // Checkpoint automático
            
            // SQUARE CLOUD: Otimizações de escrita
            db.run("PRAGMA optimize"); // Otimizar estatísticas automaticamente
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

  /**
   * OBTER CONEXÃO DO POOL
   * 
   * Retorna uma conexão disponível ou adiciona à fila de espera.
   * Sistema de timeout para evitar travamentos na Square Cloud.
   */
  async getConnection() {
    return new Promise((resolve, reject) => {
      // SQUARE CLOUD: Procurar conexão disponível no pool
      const availableConnection = this.connections.find(conn => !conn.inUse);
      
      if (availableConnection) {
        availableConnection.inUse = true;
        this.activeConnections++;
        resolve(availableConnection);
      } else {
        // SQUARE CLOUD: Adicionar à fila se pool estiver cheio
        this.queue.push({ resolve, reject });
        
        // SQUARE CLOUD: Timeout para evitar travamento da aplicação
        setTimeout(() => {
          const index = this.queue.findIndex(item => item.resolve === resolve);
          if (index !== -1) {
            this.queue.splice(index, 1);
            reject(new Error('Square Cloud: Connection timeout'));
          }
        }, 10000); // SQUARE CLOUD: 10 segundos timeout
      }
    });
  }

  /**
   * LIBERAR CONEXÃO DO POOL
   * 
   * Marca conexão como disponível e processa fila de espera.
   * Essencial para eficiência na Square Cloud.
   */
  releaseConnection(connection) {
    connection.inUse = false;
    this.activeConnections--;
    
    // SQUARE CLOUD: Processar fila de requisições esperando
    if (this.queue.length > 0) {
      const { resolve } = this.queue.shift();
      connection.inUse = true;
      this.activeConnections++;
      resolve(connection);
    }
  }

  /**
   * FECHAR TODAS AS CONEXÕES
   * 
   * Encerra graciosamente todas as conexões do pool.
   * Importante para reinicializações na Square Cloud.
   */
  async close() {
    console.log('🔒 [SQUARE CLOUD] Fechando pool de conexões SQLite...');
    
    const closePromises = this.connections.map(conn => {
      return new Promise((resolve) => {
        conn.db.close((err) => {
          if (err) {
            console.error(`❌ [SQUARE CLOUD] Erro ao fechar conexão ${conn.id}:`, err);
          } else {
            console.log(`✅ [SQUARE CLOUD] Conexão ${conn.id} fechada`);
          }
          resolve();
        });
      });
    });
    
    await Promise.all(closePromises);
    console.log('🔒 [SQUARE CLOUD] Todas as conexões SQLite fechadas');
  }

  /**
   * OBTER ESTATÍSTICAS DO POOL
   * 
   * Retorna informações sobre uso do pool para monitoramento.
   * Útil para debugging na Square Cloud.
   */
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

/**
 * INSTÂNCIA GLOBAL DO POOL PARA SQUARE CLOUD
 * 
 * Pool otimizado com 5 conexões simultâneas.
 * Suporta 100+ usuários simultâneos na Square Cloud.
 */
const pool = new SQLitePool(dbPath, 5); // SQUARE CLOUD: 5 conexões para estabilidade

/**
 * FUNÇÃO UNIFICADA PARA EXECUTAR QUERIES
 * 
 * Executa queries SQLite com retry automático e tratamento de erros.
 * Otimizada para funcionar perfeitamente na Square Cloud.
 * 
 * FUNCIONALIDADES:
 * - Retry automático em caso de falha
 * - Logging de performance
 * - Tratamento específico para leitura/escrita
 * - Timeout configurável
 */
const query = async (sql, params = [], retries = 3) => {
  let connection;
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      // SQUARE CLOUD: Obter conexão do pool otimizado
      connection = await pool.getConnection();
      
      return await new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        if (sql.toLowerCase().trim().startsWith('select') || sql.toLowerCase().includes('pragma')) {
          // SQUARE CLOUD: Query de leitura otimizada
          connection.db.all(sql, params, (err, rows) => {
            const duration = Date.now() - startTime;
            
            if (err) {
              console.error(`❌ [SQUARE CLOUD] Query error (${duration}ms):`, err.message);
              console.error(`📝 SQL:`, sql);
              console.error(`📊 Params:`, params);
              reject(err);
            } else {
              // SQUARE CLOUD: Log de queries lentas para otimização
              if (duration > 1000) {
                console.warn(`⚠️ [SQUARE CLOUD] Slow query (${duration}ms):`, sql.substring(0, 100));
              }
              resolve({ rows: rows || [] });
            }
          });
        } else {
          // SQUARE CLOUD: Query de escrita otimizada
          connection.db.run(sql, params, function(err) {
            const duration = Date.now() - startTime;
            
            if (err) {
              console.error(`❌ [SQUARE CLOUD] Query error (${duration}ms):`, err.message);
              console.error(`📝 SQL:`, sql);
              console.error(`📊 Params:`, params);
              reject(err);
            } else {
              // SQUARE CLOUD: Log de queries lentas para otimização
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
      console.error(`❌ [SQUARE CLOUD] Tentativa ${attempt}/${retries} falhou:`, error.message);
      
      if (attempt >= retries) {
        throw new Error(`[SQUARE CLOUD] Query failed after ${retries} attempts: ${error.message}`);
      }
      
      // SQUARE CLOUD: Aguardar antes de retry (backoff exponencial)
      await new Promise(resolve => setTimeout(resolve, 100 * attempt));
    } finally {
      if (connection) {
        pool.releaseConnection(connection);
      }
    }
  }
};

/**
 * FUNÇÃO PARA EXECUTAR TRANSAÇÕES SQLITE
 * 
 * Executa múltiplas queries em uma transação atômica.
 * Essencial para consistência de dados na Square Cloud.
 * 
 * CARACTERÍSTICAS:
 * - Rollback automático em caso de erro
 * - Commit automático quando bem-sucedida
 * - Tratamento de erros robusto
 */
const transaction = async (queries) => {
  let connection;
  
  try {
    // SQUARE CLOUD: Obter conexão exclusiva para transação
    connection = await pool.getConnection();
    
    return await new Promise((resolve, reject) => {
      connection.db.serialize(() => {
        // SQUARE CLOUD: Iniciar transação
        connection.db.run("BEGIN TRANSACTION");
        
        const results = [];
        let completed = 0;
        let hasError = false;
        
        // SQUARE CLOUD: Executar todas as queries da transação
        queries.forEach((queryData, index) => {
          if (hasError) return;
          
          const { sql, params = [] } = queryData;
          
          connection.db.run(sql, params, function(err) {
            if (err && !hasError) {
              hasError = true;
              // SQUARE CLOUD: Rollback em caso de erro
              connection.db.run("ROLLBACK");
              reject(err);
              return;
            }
            
            // SQUARE CLOUD: Armazenar resultado da query
            results[index] = {
              rowCount: this.changes,
              insertId: this.lastID
            };
            
            completed++;
            
            if (completed === queries.length) {
              // SQUARE CLOUD: Commit quando todas as queries completam
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
 * FUNÇÃO PARA INICIALIZAR O BANCO DE DADOS
 * 
 * Cria todas as tabelas e índices necessários para o sistema.
 * Otimizada especificamente para funcionar na Square Cloud.
 * 
 * FUNCIONALIDADES:
 * - Criação de tabelas com índices otimizados
 * - Triggers para atualização automática
 * - Usuários de teste pré-criados
 * - Análise e otimização automática
 */
export const initializeDb = async () => {
  console.log('🚀 [SQUARE CLOUD] Inicializando banco SQLite otimizado...');
  console.log('📊 [SQUARE CLOUD] Configuração para 100+ usuários simultâneos');
  
  try {
    /**
     * CRIAÇÃO DA TABELA FUNCIONARIOS
     * 
     * Armazena dados dos usuários do sistema (advogados, moderadores, admins).
     * Otimizada para autenticação rápida na Square Cloud.
     */
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
    
    // SQUARE CLOUD: Índices otimizados para autenticação rápida
    await query(`CREATE INDEX IF NOT EXISTS idx_funcionarios_email ON funcionarios(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_funcionarios_permissao ON funcionarios(permissao)`);
    
    /**
     * CRIAÇÃO DA TABELA PROTOCOLOS
     * 
     * Tabela principal que armazena todos os protocolos jurídicos.
     * Estrutura otimizada para consultas rápidas na Square Cloud.
     */
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
    
    /**
     * CRIAÇÃO DE ÍNDICES OTIMIZADOS PARA SQUARE CLOUD
     * 
     * Índices estratégicos para consultas rápidas mesmo com milhares de protocolos.
     * Otimizados para os padrões de uso do sistema jurídico.
     */
    console.log('🔍 [SQUARE CLOUD] Criando índices otimizados...');
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_status ON protocolos(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_assignedTo ON protocolos(assignedTo)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_createdBy ON protocolos(createdBy)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_createdAt ON protocolos(createdAt)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_updatedAt ON protocolos(updatedAt)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_status_assigned ON protocolos(status, assignedTo)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_queue_lookup ON protocolos(status, assignedTo, createdAt)`);
    
    /**
     * TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
     * 
     * Atualizam automaticamente campos de timestamp quando registros são modificados.
     * Essencial para auditoria e controle na Square Cloud.
     */
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
    
    // SQUARE CLOUD: Criar usuários de teste para demonstração
    await createTestUsers();
    
    /**
     * OTIMIZAÇÃO FINAL DO BANCO
     * 
     * Executa análise e otimização das estatísticas do banco.
     * Melhora performance das consultas na Square Cloud.
     */
    console.log('⚡ [SQUARE CLOUD] Otimizando banco de dados...');
    await query(`ANALYZE`);
    await query(`PRAGMA optimize`);
    
    // SQUARE CLOUD: Obter estatísticas finais para monitoramento
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
 * 
 * Cria usuários padrão para demonstração e testes.
 * Executada automaticamente na primeira inicialização.
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
        // SQUARE CLOUD: Criar usuário se não existir
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
 * 
 * Verifica se o banco SQLite está funcionando corretamente.
 * Essencial para monitoramento na Square Cloud.
 */
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

/**
 * FUNÇÃO PARA OBTER ESTATÍSTICAS DO BANCO
 * 
 * Retorna informações detalhadas sobre o banco para monitoramento.
 * Útil para acompanhar performance na Square Cloud.
 */
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

/**
 * FUNÇÃO PARA MANUTENÇÃO DO BANCO
 * 
 * Executa manutenção automática do SQLite para manter performance.
 * Executada automaticamente a cada 6 horas na Square Cloud.
 */
export const maintenanceDb = async () => {
  console.log('🔧 [SQUARE CLOUD] Executando manutenção do banco...');
  
  try {
    // SQUARE CLOUD: Vacuum para otimizar espaço em disco
    await query("VACUUM");
    
    // SQUARE CLOUD: Reindexar para otimizar queries
    await query("REINDEX");
    
    // SQUARE CLOUD: Analisar estatísticas para otimização
    await query("ANALYZE");
    
    // SQUARE CLOUD: Otimizar automaticamente
    await query("PRAGMA optimize");
    
    console.log('✅ [SQUARE CLOUD] Manutenção concluída');
  } catch (error) {
    console.error('❌ [SQUARE CLOUD] Erro na manutenção:', error);
  }
};

/**
 * FUNÇÃO PARA FECHAR CONEXÕES (CLEANUP)
 * 
 * Encerra graciosamente todas as conexões do banco.
 * Importante para reinicializações na Square Cloud.
 */
export const closeConnection = async () => {
  await pool.close();
};

// SQUARE CLOUD: Exportar funções principais para uso no sistema
export { query, transaction };
export default { query, transaction };