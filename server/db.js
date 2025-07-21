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
const db = new sqlite.Database(dbPath);

// Criar tabela funcionarios se não existir
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS funcionarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      permissao TEXT NOT NULL DEFAULT 'advogado'
    )
  `);

  // Criar tabela protocolos se não existir
  db.run(`
    CREATE TABLE IF NOT EXISTS protocolos (
      id TEXT PRIMARY KEY,
      processNumber TEXT NOT NULL,
      court TEXT NOT NULL,
      system TEXT NOT NULL,
      jurisdiction TEXT NOT NULL,
      isFatal INTEGER NOT NULL DEFAULT 0,
      needsProcuration INTEGER NOT NULL DEFAULT 0,
      petitionType TEXT NOT NULL,
      observations TEXT,
      documents TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Aguardando',
      assignedTo TEXT,
      createdBy INTEGER NOT NULL,
      returnReason TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      queuePosition INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (createdBy) REFERENCES funcionarios (id)
    )
  `);
  // Inserir usuário de teste se não existir
  db.get("SELECT email FROM funcionarios WHERE email = ?", ['admin@escritorio.com'], (err, row) => {
    if (!row) {
      db.run(`
        INSERT INTO funcionarios (email, senha, permissao) 
        VALUES (?, ?, ?)
      `, ['admin@escritorio.com', '123456', 'admin'], (err) => {
        if (err) {
          console.error('Erro ao criar usuário de teste:', err);
        } else {
          console.log('Usuário de teste criado: admin@escritorio.com / 123456');
        }
      });
    }
  });

  // Inserir usuário moderador de teste se não existir
  db.get("SELECT email FROM funcionarios WHERE email = ?", ['mod@escritorio.com'], (err, row) => {
    if (!row) {
      db.run(`
        INSERT INTO funcionarios (email, senha, permissao) 
        VALUES (?, ?, ?)
      `, ['mod@escritorio.com', '123456', 'mod'], (err) => {
        if (err) {
          console.error('Erro ao criar usuário moderador de teste:', err);
        } else {
          console.log('Usuário moderador de teste criado: mod@escritorio.com / 123456');
        }
      });
    }
  });

  // Inserir usuário advogado de teste se não existir
  db.get("SELECT email FROM funcionarios WHERE email = ?", ['advogado@escritorio.com'], (err, row) => {
    if (!row) {
      db.run(`
        INSERT INTO funcionarios (email, senha, permissao) 
        VALUES (?, ?, ?)
      `, ['advogado@escritorio.com', '123456', 'advogado'], (err) => {
        if (err) {
          console.error('Erro ao criar usuário advogado de teste:', err);
        } else {
          console.log('Usuário advogado de teste criado: advogado@escritorio.com / 123456');
        }
      });
    }
  });
});

export default db;