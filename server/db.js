import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const sqlite = sqlite3.verbose();

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Criar conexão com o banco de dados
const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'database.sqlite');
console.log('🗄️ Caminho do banco de dados:', dbPath);

const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar com o banco de dados:', err);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite');
  }
});

// Função para inicializar o banco de dados
export const initializeDb = () => {
  return new Promise((resolve, reject) => {
    console.log('🚀 Inicializando banco de dados...');
    
    db.serialize(() => {
      // Criar tabela funcionarios
      db.run(`
        CREATE TABLE IF NOT EXISTS funcionarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          senha TEXT NOT NULL,
          permissao TEXT NOT NULL DEFAULT 'advogado'
        )
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela funcionarios:', err);
          return reject(err);
        }
        console.log('✅ Tabela funcionarios criada/verificada');
      });

      // Criar tabela protocolos com estrutura completa
      db.run(`
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
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela protocolos:', err);
          return reject(err);
        }
        console.log('✅ Tabela protocolos criada/verificada');
        
        // Verificar estrutura da tabela
        db.all("PRAGMA table_info(protocolos)", (err, columns) => {
          if (err) {
            console.error('❌ Erro ao verificar estrutura da tabela:', err);
          } else {
            console.log('📋 Estrutura da tabela protocolos:');
            columns.forEach(col => {
              console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
            });
          }
        });
      });

      // Verificar e inserir usuários de teste
      const createTestUsers = () => {
        const testUsers = [
          { email: 'admin@escritorio.com', senha: '123456', permissao: 'admin' },
          { email: 'mod@escritorio.com', senha: '123456', permissao: 'mod' },
          { email: 'advogado@escritorio.com', senha: '123456', permissao: 'advogado' }
        ];

        let usersCreated = 0;
        let usersToCreate = testUsers.length;

        testUsers.forEach(user => {
          db.get("SELECT email FROM funcionarios WHERE email = ?", [user.email], (err, row) => {
            if (err) {
              console.error(`❌ Erro ao verificar usuário ${user.email}:`, err);
              usersToCreate--;
            } else if (!row) {
              db.run(`
                INSERT INTO funcionarios (email, senha, permissao) 
                VALUES (?, ?, ?)
              `, [user.email, user.senha, user.permissao], (err) => {
                if (err) {
                  console.error(`❌ Erro ao criar usuário ${user.email}:`, err);
                } else {
                  console.log(`✅ Usuário de teste criado: ${user.email} (${user.permissao})`);
                  usersCreated++;
                }
                usersToCreate--;
                
                if (usersToCreate === 0) {
                  console.log(`🎉 Inicialização concluída! ${usersCreated} usuários criados.`);
                  
                  // Verificar total de registros
                  db.get("SELECT COUNT(*) as count FROM funcionarios", (err, row) => {
                    if (!err) {
                      console.log(`👥 Total de funcionários no banco: ${row.count}`);
                    }
                  });
                  
                  db.get("SELECT COUNT(*) as count FROM protocolos", (err, row) => {
                    if (!err) {
                      console.log(`📋 Total de protocolos no banco: ${row.count}`);
                    }
                  });
                  
                  resolve();
                }
              });
            } else {
              console.log(`ℹ️ Usuário já existe: ${user.email}`);
              usersToCreate--;
              
              if (usersToCreate === 0) {
                console.log('🎉 Inicialização concluída! Todos os usuários já existem.');
                
                // Verificar total de registros
                db.get("SELECT COUNT(*) as count FROM funcionarios", (err, row) => {
                  if (!err) {
                    console.log(`👥 Total de funcionários no banco: ${row.count}`);
                  }
                });
                
                db.get("SELECT COUNT(*) as count FROM protocolos", (err, row) => {
                  if (!err) {
                    console.log(`📋 Total de protocolos no banco: ${row.count}`);
                  }
                });
                
                resolve();
              }
            }
          });
        });
      };

      createTestUsers();
    });
  });
};

// Função para testar conectividade
export const testConnection = () => {
  return new Promise((resolve, reject) => {
    db.get("SELECT 1 as test", (err, row) => {
      if (err) {
        console.error('❌ Teste de conectividade falhou:', err);
        reject(err);
      } else {
        console.log('✅ Teste de conectividade bem-sucedido');
        resolve(row);
      }
    });
  });
};

// Função para obter estatísticas do banco
export const getDatabaseStats = () => {
  return new Promise((resolve, reject) => {
    const stats = {};
    
    db.get("SELECT COUNT(*) as count FROM funcionarios", (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      stats.funcionarios = row.count;
      
      db.get("SELECT COUNT(*) as count FROM protocolos", (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        stats.protocolos = row.count;
        
        db.get("SELECT COUNT(*) as count FROM protocolos WHERE status = 'Aguardando'", (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          stats.protocolosAguardando = row.count;
          
          resolve(stats);
        });
      });
    });
  });
};

export default db;