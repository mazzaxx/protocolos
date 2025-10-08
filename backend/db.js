import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração otimizada do SQLite para Square Cloud
const isProduction = process.env.NODE_ENV === 'production';
const dbPath = isProduction 
  ? path.join(process.cwd(), 'database.sqlite')
  : path.join(__dirname, 'database.sqlite');

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
    
    // Verificar se o banco está funcionando
    console.log('🔍 Testando conectividade básica...');
    await query('SELECT 1 as test');
    console.log('✅ Conectividade básica confirmada');
    
    // Criar tabelas com índices otimizados
    console.log('📋 Criando tabela funcionarios...');
    await query(`
      CREATE TABLE IF NOT EXISTS funcionarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        permissao TEXT NOT NULL DEFAULT 'advogado',
        equipe TEXT DEFAULT NULL,
        first_login INTEGER NOT NULL DEFAULT 1,
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
      } else {
        console.error('❌ Erro inesperado ao verificar coluna equipe:', error);
      }
    }

    // Verificar se a coluna first_login existe, se não existir, adicionar
    try {
      await query(`SELECT first_login FROM funcionarios LIMIT 1`);
      console.log('✅ Coluna first_login já existe');
    } catch (error) {
      if (error.message.includes('no such column: first_login') || error.message.includes('has no column named first_login')) {
        console.log('➕ Adicionando coluna first_login à tabela funcionarios...');
        await query(`ALTER TABLE funcionarios ADD COLUMN first_login INTEGER NOT NULL DEFAULT 1`);
        console.log('✅ Coluna first_login adicionada com sucesso');
      } else {
        console.error('❌ Erro inesperado ao verificar coluna first_login:', error);
      }
    }
    
    // Índices para funcionarios
    await query(`CREATE INDEX IF NOT EXISTS idx_funcionarios_email ON funcionarios(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_funcionarios_permissao ON funcionarios(permissao)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_funcionarios_equipe ON funcionarios(equipe)`);
    
    // Criar tabela para equipes temporárias (para equipes sem funcionários)
    console.log('📋 Criando tabela equipes_temp...');
    await query(`
      CREATE TABLE IF NOT EXISTS equipes_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE NOT NULL,
        gestor TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Verificar se a coluna gestor existe, se não existir, adicionar
    console.log('🔧 Verificando estrutura da tabela equipes_temp...');
    try {
      await query(`SELECT gestor FROM equipes_temp LIMIT 1`);
      console.log('✅ Coluna gestor já existe na tabela equipes_temp');
    } catch (error) {
      if (error.message.includes('no such column: gestor') || error.message.includes('has no column named gestor')) {
        console.log('➕ Adicionando coluna gestor à tabela equipes_temp...');
        await query(`ALTER TABLE equipes_temp ADD COLUMN gestor TEXT DEFAULT NULL`);
        console.log('✅ Coluna gestor adicionada com sucesso');
      } else {
        console.error('❌ Erro inesperado ao verificar coluna gestor:', error);
      }
    }

    await query(`CREATE INDEX IF NOT EXISTS idx_equipes_temp_nome ON equipes_temp(nome)`);
    
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
        taskCode TEXT NOT NULL DEFAULT '',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        queuePosition INTEGER NOT NULL DEFAULT 1,
        activityLog TEXT NOT NULL DEFAULT '[]',
        FOREIGN KEY (createdBy) REFERENCES funcionarios (id)
      )
    `);

    // Adicionar coluna taskCode se não existir (para bancos existentes)
    console.log('🔧 Verificando estrutura da tabela protocolos...');
    try {
      await query(`SELECT taskCode FROM protocolos LIMIT 1`);
      console.log('✅ Coluna taskCode já existe');
    } catch (error) {
      if (error.message.includes('no such column: taskCode') || error.message.includes('has no column named taskCode')) {
        console.log('➕ Adicionando coluna taskCode à tabela protocolos...');
        await query(`ALTER TABLE protocolos ADD COLUMN taskCode TEXT NOT NULL DEFAULT ''`);
        console.log('✅ Coluna taskCode adicionada com sucesso');
      } else {
        console.error('❌ Erro inesperado ao verificar coluna taskCode:', error);
      }
    }
    
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
    
    // Trigger para limpar equipes temporárias quando funcionários são atribuídos
    await query(`
      CREATE TRIGGER IF NOT EXISTS cleanup_temp_teams_on_assign
      AFTER UPDATE OF equipe ON funcionarios
      WHEN NEW.equipe IS NOT NULL
      BEGIN
        DELETE FROM equipes_temp WHERE nome = NEW.equipe;
      END
    `);
    
    await query(`
      CREATE TRIGGER IF NOT EXISTS cleanup_temp_teams_on_insert
      AFTER INSERT ON funcionarios
      WHEN NEW.equipe IS NOT NULL
      BEGIN
        DELETE FROM equipes_temp WHERE nome = NEW.equipe;
      END
    `);
    
    // Não limpar funcionários existentes - manter dados persistentes
    console.log('ℹ️ Mantendo funcionários existentes no banco de dados');

    // Criar usuários de teste
    console.log('👥 Iniciando processo de criação de usuários...');
    await createTestUsers();
    console.log('✅ Processo de criação de usuários concluído');
    
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
    console.error('📋 Stack trace:', error.stack);
    throw error;
  }
};

// Função para criar usuários de teste
const createTestUsers = async () => {
  console.log('👥 Verificando usuários no banco de dados...');

  // Não limpar funcionários - manter todos os dados persistentes
  console.log('ℹ️ Mantendo todos os funcionários existentes');

  // Definir equipes com gestores
  const equipes = {
    'Saúde APS': {
      gestor: 'Rafael Rahner | NCA',
      membros: [
        "Maísa Abreu | NCA", "Tais Brandão | NCA", "Ana Catarina | NCA",
        "Angélica Andrade | NCA", "Dayane Cristina | NCA", "Isabela Dornelas | NCA",
        "Layla Oliveira | NCA", "Thaisa Gomes | NCA", "Rafael Rahner | NCA"
      ]
    },
    'Ind BV/Super/Exec Fiscais': {
      gestor: 'Mayssa Marcella | NCA',
      membros: [
        "Camila Pimenta | NCA", "Carolina Vieira | NCA", "Diná Souza | NCA",
        "Nathalia Cristina | NCA", "Stefani Caroline | NCA", "Mayssa Marcella | NCA",
        "Dayse Ferreira | NCA", "Lara Carolina | NCA"
      ]
    },
    'Revisional Santander/BV': {
      gestor: 'Juacy Leal | NCA',
      membros: [
        "Adriana Xavier | NCA", "Amanda Marques | NCA", "André Alencar | NCA",
        "Daiane Alves | NCA", "Eloízio Andrade | NCA", "Gabriel Augusto | NCA",
        "Natalia Ferreira | NCA", "Priscila Alves | NCA", "Ramon Alves | NCA",
        "Rejane Oliveira | NCA", "Thalita Gonzaga | NCA", "Thiago Paiva | NCA",
        "Juacy Leal | NCA"
      ]
    },
    'Indenizatório Santander': {
      gestor: 'Thiago Johnson | NCA',
      membros: [
        "Ana Marinho | NCA", "Audrey Roberto | NCA", "Dayane Machado | NCA",
        "Isabela Nogueira | NCA", "Izadora Feital | NCA", "Jéssica Oliveira | NCA",
        "Lucas Barroso | NCA", "Paloma Teodoro | NCA", "Pedro Gama | NCA",
        "Sabrina Alves | NCA", "Talita Freitas | NCA", "Thiago Johnson | NCA",
        "Northon Alencar | NCA"
      ]
    },
    'Indenizatório Santander 2': {
      gestor: 'Flaviana Estevam | NCA',
      membros: [
        "Arthur Ferreira | NCA", "Clara Pires | NCA", "Deivison José | NCA",
        "Idaelly Dutra | NCA", "João Pedro Sales | NCA", "Juliana Ferreira | NCA",
        "Priscila Cristina | NCA", "Rinara de Sá | NCA", "Vandressa Barroso | NCA",
        "Flaviana Estevam | NCA", "Bruna Pedra | NCA"
      ]
    },
    'Trabalhista': {
      gestor: 'Luciano Alves | NCA',
      membros: [
        "Luciano Alves | NCA", "Ana Paula | NCA", "Bethânia Couto | NCA",
        "Gleison Campos | NCA", "Isabela Veloso | NCA", "Julia Assis | NCA",
        "Laíssa Oliveira | NCA", "Marystela Bonfá | NCA", "Patrícia Lima | NCA",
        "Rosilene Cassiano | NCA", "Stephanie Prado | NCA"
      ]
    },
    'Safra': {
      gestor: 'Barbara Gallis | NCA',
      membros: [
        "Jéssica Castro | NCA", "Debora Horta | NCA", "Beatriz Gondim | NCA",
        "Lara Oliveira | NCA", "Amanda Furtado | NCA", "Julia Maria | NCA",
        "Miguel Tavares | NCA", "Cinara Luisa | NCA", "Barbara Gallis | NCA"
      ]
    },
    'Relevantes': {
      gestor: 'Guilherme Pacheco | NCA',
      membros: [
        "Guilherme Pacheco | NCA", "Ronnie Godinho | NCA", "Paulo Cimini", "Samuel Barbosa | NCA"
      ]
    },
    'Encerramento/OBF': {
      gestor: null,
      membros: [
        "Felipe Santos | NCA", "Giovana Romanhol | NCA", "Luana Soares | NCA"
      ]
    },
    'Banco Pan': {
      gestor: 'Nivaldo Junior | NCA',
      membros: [
        "Nivaldo Junior | NCA", "Maria Fernanda | NCA", "Alexia Andrade | NCA", "Fernanda Faria | NCA"
      ]
    },
    'FSFX Cível': {
      gestor: null,
      membros: [
        "Ronaldo Scarponi | NCA", "Clara Metzker | NCA"
      ]
    },
    'Unimed': {
      gestor: null,
      membros: [
        "Andre Richard | NCA", "Jessica Ferreira | NCA"
      ]
    },
    'Acordos': {
      gestor: 'Thiago Ribas | NCA',
      membros: [
        "Luana Cristina | NCA", "Igor Guimarães | NCA", "Thiago Ribas | NCA"
      ]
    },
    'BRB': {
      gestor: null,
      membros: [
        "Matheus Eleutério | NCA"
      ]
    },
    'Previdência/Aperam': {
      gestor: null,
      membros: [
        "Mario Assis | NCA", "Ana Cláudia | NCA"
      ]
    }
  };

  const testUsers = [
    { email: 'admin@escritorio.com', senha: '123456', permissao: 'admin', equipe: null },
    { email: 'mod@escritorio.com', senha: '123456', permissao: 'mod', equipe: null }
  ];

  // Adicionar usuários das equipes (apenas primeiros 2 nomes)
  Object.entries(equipes).forEach(([nomeEquipe, equipeDados]) => {
    equipeDados.membros.forEach(nome => {
      // Extrair apenas os 2 primeiros nomes
      const nomeParts = nome.split('|')[0].trim().split(' ');
      const primeirosDoisNomes = nomeParts.slice(0, 2).join('.');

      const email = primeirosDoisNomes.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9.]/g, '') + '@neycampos.adv.br';

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
    // Log detalhado para debug
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 Tentando criar usuário: ${user.email} (${user.permissao}${user.equipe ? ` - ${user.equipe}` : ''})`);
    }
    
    try {
      const existingUser = await query(
        "SELECT email FROM funcionarios WHERE email = ?",
        [user.email]
      );
      
      if (existingUser.rows.length === 0) {
        const result = await query(
          "INSERT INTO funcionarios (email, senha, permissao, equipe) VALUES (?, ?, ?, ?)",
          [user.email, user.senha, user.permissao, user.equipe || null]
        );
        
        if (result.changes > 0) {
          console.log(`✅ Usuário criado: ${user.email} (${user.permissao}${user.equipe ? ` - ${user.equipe}` : ''})`);
          usersCreated++;
        } else {
          console.warn(`⚠️ Usuário não foi criado (sem mudanças): ${user.email}`);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`ℹ️ Usuário já existe: ${user.email}`);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao criar usuário ${user.email}:`, error.message);
      console.error(`📋 Dados do usuário:`, {
        email: user.email,
        permissao: user.permissao,
        equipe: user.equipe || 'null'
      });
    }
  }

  if (usersCreated > 0) {
    console.log(`🆕 ${usersCreated} usuários criados nesta inicialização`);
  } else {
    console.log(`ℹ️ Nenhum usuário novo foi criado (todos já existem)`);
  }

  // Criar equipes temporárias com gestores
  console.log('👥 Criando equipes temporárias com gestores...');
  try {
    // Limpar equipes antigas
    await query("DELETE FROM equipes_temp");

    let equipesCreated = 0;
    for (const [nomeEquipe, equipeDados] of Object.entries(equipes)) {
      try {
        await query(
          "INSERT INTO equipes_temp (nome, gestor) VALUES (?, ?)",
          [nomeEquipe, equipeDados.gestor]
        );
        equipesCreated++;
      } catch (error) {
        console.error(`❌ Erro ao criar equipe ${nomeEquipe}:`, error.message);
      }
    }
    console.log(`✅ ${equipesCreated} equipes criadas`);
  } catch (error) {
    console.error('❌ Erro ao criar equipes:', error);
  }

  // Verificar total de usuários após criação
  try {
    const totalResult = await query('SELECT COUNT(*) as count FROM funcionarios');
    const total = totalResult.rows[0].count;
    console.log(`📊 Total de funcionários no banco: ${total}`);
  } catch (error) {
    console.error('❌ Erro ao contar funcionários:', error);
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
    
    // Estatísticas adicionais de funcionários por equipe
    const equipesResult = await query(`
      SELECT equipe, COUNT(*) as count 
      FROM funcionarios 
      WHERE equipe IS NOT NULL 
      GROUP BY equipe
    `);
    
    const stats = {
      funcionarios: funcionariosResult.rows[0].count,
      protocolos: protocolosResult.rows[0].count,
      protocolosAguardando: aguardandoResult.rows[0].count,
      funcionariosPorEquipe: equipesResult.rows || [],
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

// Função placeholder para backup (implementar futuramente se necessário)
const checkAndRestoreFromBackup = async () => {
  // Implementação futura para backup/restore
  console.log('ℹ️ Sistema de backup não implementado ainda');
};

// Exportar funções principais
export { query, transaction };
export default { query, transaction };