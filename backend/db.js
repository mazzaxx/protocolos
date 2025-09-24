import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração otimizada do SQLite para persistência de dados
const isProduction = process.env.NODE_ENV === 'production';
const dbPath = isProduction 
  ? path.join(process.cwd(), 'database.sqlite')
  : path.join(__dirname, 'database.sqlite');

console.log('🗄️ Configurando SQLite com persistência de dados');
console.log('📍 Caminho do banco:', dbPath);
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');

// Verificar se o banco já existe
import fs from 'fs';
const dbExists = fs.existsSync(dbPath);
console.log('💾 Banco de dados existe:', dbExists ? 'SIM' : 'NÃO (será criado)');

// Conexão única SQLite para evitar locks
class SQLiteConnection {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔗 Inicializando conexão SQLite com persistência');
    
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error('❌ Erro ao criar conexão SQLite:', err);
          reject(err);
          return;
        }
        
        console.log('✅ Conexão SQLite criada com sucesso');
        
        // Configurações otimizadas para persistência
        this.db.serialize(() => {
          // WAL mode para melhor concorrência e persistência
          this.db.run("PRAGMA journal_mode = WAL");
          
          // Configurações de performance e persistência
          this.db.run("PRAGMA synchronous = FULL"); // Máxima segurança dos dados
          this.db.run("PRAGMA cache_size = 10000");
          this.db.run("PRAGMA temp_store = MEMORY");
          this.db.run("PRAGMA mmap_size = 268435456");
          
          // Configurações de timeout
          this.db.run("PRAGMA busy_timeout = 30000");
          this.db.run("PRAGMA wal_autocheckpoint = 1000");
          
          // Verificar integridade do banco
          this.db.run("PRAGMA integrity_check");
          
          console.log('⚙️ Configurações SQLite aplicadas para persistência');
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

// Função unificada para executar queries
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

// Função para inicializar o banco de dados (SEM RECRIAR DADOS EXISTENTES)
export const initializeDb = async () => {
  console.log('🚀 Inicializando banco SQLite com preservação de dados...');
  
  try {
    // Aguardar inicialização da conexão
    await connection.initialize();
    
    // Verificar se o banco está funcionando
    console.log('🔍 Testando conectividade básica...');
    await query('SELECT 1 as test');
    console.log('✅ Conectividade básica confirmada');
    
    // Criar tabelas APENAS se não existirem (preservar dados)
    console.log('📋 Verificando/criando estrutura de tabelas...');
    
    // Tabela de funcionários
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
    
    // Verificar se a coluna equipe existe, se não existir, adicionar
    console.log('🔧 Verificando estrutura da tabela funcionarios...');
    try {
      await query(`SELECT equipe FROM funcionarios LIMIT 1`);
      console.log('✅ Coluna equipe já existe');
    } catch (error) {
      if (error.message.includes('no such column: equipe') || error.message.includes('has no column named equipe')) {
        console.log('➕ Adicionando coluna equipe à tabela funcionarios...');
        await query(`ALTER TABLE funcionarios ADD COLUMN equipe TEXT DEFAULT NULL`);
        console.log('✅ Coluna equipe adicionada com sucesso');
      }
    }
    
    // Tabela de equipes (nova tabela para gerenciar equipes)
    await query(`
      CREATE TABLE IF NOT EXISTS equipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabela de protocolos
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
    
    // Criar índices para performance
    console.log('🔍 Criando índices para performance...');
    await query(`CREATE INDEX IF NOT EXISTS idx_funcionarios_email ON funcionarios(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_funcionarios_permissao ON funcionarios(permissao)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_funcionarios_equipe ON funcionarios(equipe)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_status ON protocolos(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_assignedTo ON protocolos(assignedTo)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_createdBy ON protocolos(createdBy)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_createdAt ON protocolos(createdAt)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_protocolos_status_assigned ON protocolos(status, assignedTo)`);
    
    // Triggers para atualizar timestamps
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
    
    // Verificar se existem usuários no banco
    const existingUsersResult = await query('SELECT COUNT(*) as count FROM funcionarios');
    const existingUsersCount = existingUsersResult.rows[0].count;
    
    console.log(`📊 Usuários existentes no banco: ${existingUsersCount}`);
    
    // APENAS criar usuários de teste se o banco estiver completamente vazio
    if (existingUsersCount === 0) {
      console.log('🆕 Banco vazio detectado - Criando usuários iniciais...');
      await createInitialUsers();
    } else {
      console.log('✅ Banco já possui dados - Preservando usuários existentes');
      
      // Mostrar usuários existentes
      const usersResult = await query('SELECT email, permissao, equipe FROM funcionarios ORDER BY created_at');
      console.log('📋 Usuários preservados:');
      usersResult.rows.forEach(user => {
        console.log(`   - ${user.email} (${user.permissao}${user.equipe ? ` - ${user.equipe}` : ''})`);
      });
    }
    
    // Verificar protocolos existentes
    const existingProtocolsResult = await query('SELECT COUNT(*) as count FROM protocolos');
    const existingProtocolsCount = existingProtocolsResult.rows[0].count;
    console.log(`📊 Protocolos preservados no banco: ${existingProtocolsCount}`);
    
    // Verificar equipes existentes
    const existingTeamsResult = await query('SELECT COUNT(*) as count FROM equipes');
    const existingTeamsCount = existingTeamsResult.rows[0].count;
    console.log(`📊 Equipes preservadas no banco: ${existingTeamsCount}`);
    
    // Se não há equipes, criar as equipes padrão
    if (existingTeamsCount === 0) {
      console.log('🆕 Criando equipes padrão...');
      await createInitialTeams();
    }
    
    // Otimizar banco após verificações
    console.log('⚡ Otimizando banco de dados...');
    await query(`ANALYZE`);
    await query(`PRAGMA optimize`);
    
    // Estatísticas finais
    const stats = await getDatabaseStats();
    console.log('📊 Estatísticas do banco preservado:', stats);
    console.log('🎉 Inicialização SQLite concluída - DADOS PRESERVADOS!');
    
  } catch (error) {
    console.error('❌ Erro na inicialização do banco:', error);
    console.error('📋 Stack trace:', error.stack);
    throw error;
  }
};

// Função para criar usuários iniciais (APENAS quando banco está vazio)
const createInitialUsers = async () => {
  console.log('👥 Criando usuários iniciais (banco vazio)...');
  
  const testUsers = [
    { email: 'admin@escritorio.com', senha: '123456', permissao: 'admin', equipe: null },
    { email: 'mod@escritorio.com', senha: '123456', permissao: 'mod', equipe: null },
    { email: 'advogado@escritorio.com', senha: '123456', permissao: 'advogado', equipe: null }
  ];

  let usersCreated = 0;

  for (const user of testUsers) {
    try {
      const result = await query(
        "INSERT INTO funcionarios (email, senha, permissao, equipe) VALUES (?, ?, ?, ?)",
        [user.email, user.senha, user.permissao, user.equipe]
      );
      
      if (result.changes > 0) {
        console.log(`✅ Usuário inicial criado: ${user.email} (${user.permissao})`);
        usersCreated++;
      }
    } catch (error) {
      console.error(`❌ Erro ao criar usuário inicial ${user.email}:`, error.message);
    }
  }

  console.log(`🆕 ${usersCreated} usuários iniciais criados`);
};

// Função para criar equipes padrão
const createInitialTeams = async () => {
  console.log('🏢 Criando equipes padrão...');
  
  const equipesPadrao = [
    'Equipe Rahner',
    'Equipe Mayssa', 
    'Equipe Juacy',
    'Equipe Johnson',
    'Equipe Flaviana'
  ];

  let teamsCreated = 0;

  for (const nomeEquipe of equipesPadrao) {
    try {
      const result = await query(
        "INSERT INTO equipes (nome) VALUES (?)",
        [nomeEquipe]
      );
      
      if (result.changes > 0) {
        console.log(`✅ Equipe padrão criada: ${nomeEquipe}`);
        teamsCreated++;
      }
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        console.log(`ℹ️ Equipe já existe: ${nomeEquipe}`);
      } else {
        console.error(`❌ Erro ao criar equipe ${nomeEquipe}:`, error.message);
      }
    }
  }

  console.log(`🆕 ${teamsCreated} equipes padrão criadas`);
};

// Função para obter estatísticas do banco
export const getDatabaseStats = async () => {
  try {
    const funcionariosResult = await query("SELECT COUNT(*) as count FROM funcionarios");
    const protocolosResult = await query("SELECT COUNT(*) as count FROM protocolos");
    const equipesResult = await query("SELECT COUNT(*) as count FROM equipes");
    const aguardandoResult = await query("SELECT COUNT(*) as count FROM protocolos WHERE status = 'Aguardando'");
    
    const stats = {
      funcionarios: funcionariosResult.rows[0].count,
      protocolos: protocolosResult.rows[0].count,
      equipes: equipesResult.rows[0].count,
      protocolosAguardando: aguardandoResult.rows[0].count,
      databaseType: 'SQLite Persistente',
      environment: process.env.NODE_ENV || 'development',
      databasePath: dbPath
    };
    
    return stats;
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    throw error;
  }
};

// Função para backup do banco (opcional)
export const backupDatabase = async () => {
  try {
    const backupPath = dbPath + '.backup.' + Date.now();
    await query(`VACUUM INTO '${backupPath}'`);
    console.log('✅ Backup criado:', backupPath);
    return backupPath;
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    throw error;
  }
};

// Função para manutenção do banco
export const maintenanceDb = async () => {
  console.log('🔧 Executando manutenção do banco...');
  
  try {
    // Checkpoint WAL
    await query("PRAGMA wal_checkpoint(FULL)");
    
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
export { query };
export default { query };