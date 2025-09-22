import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurações de backup
const BACKUP_DIR = path.join(__dirname, 'backups');
const DB_PATH = path.join(__dirname, 'database.sqlite');
const MAX_BACKUPS = 10; // Manter apenas os 10 backups mais recentes

// Criar diretório de backup se não existir
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('📁 Diretório de backup criado:', BACKUP_DIR);
}

/**
 * Criar backup do banco de dados
 */
export const createBackup = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `database-backup-${timestamp}.sqlite`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    console.log('💾 Iniciando backup do banco de dados...');
    console.log('📍 Origem:', DB_PATH);
    console.log('📍 Destino:', backupPath);
    
    // Verificar se o banco existe
    if (!fs.existsSync(DB_PATH)) {
      throw new Error('Banco de dados não encontrado');
    }
    
    // Copiar arquivo do banco
    fs.copyFileSync(DB_PATH, backupPath);
    
    // Verificar se o backup foi criado
    const stats = fs.statSync(backupPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Backup criado com sucesso!');
    console.log(`📊 Tamanho: ${sizeInMB} MB`);
    console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
    
    // Limpar backups antigos
    await cleanOldBackups();
    
    return {
      success: true,
      fileName: backupFileName,
      path: backupPath,
      size: stats.size,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Limpar backups antigos (manter apenas os mais recentes)
 */
const cleanOldBackups = async () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('database-backup-') && file.endsWith('.sqlite'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime); // Mais recentes primeiro
    
    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Backup antigo removido: ${file.name}`);
      }
      
      console.log(`🧹 ${filesToDelete.length} backup(s) antigo(s) removido(s)`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar backups antigos:', error);
  }
};

/**
 * Listar todos os backups disponíveis
 */
export const listBackups = () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('database-backup-') && file.endsWith('.sqlite'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime,
          sizeInMB: (stats.size / (1024 * 1024)).toFixed(2)
        };
      })
      .sort((a, b) => b.created - a.created);
    
    return files;
  } catch (error) {
    console.error('❌ Erro ao listar backups:', error);
    return [];
  }
};

/**
 * Restaurar backup
 */
export const restoreBackup = async (backupFileName) => {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error('Arquivo de backup não encontrado');
    }
    
    console.log('🔄 Iniciando restauração do backup...');
    console.log('📍 Backup:', backupPath);
    console.log('📍 Destino:', DB_PATH);
    
    // Criar backup do banco atual antes de restaurar
    const currentBackup = await createBackup();
    if (currentBackup.success) {
      console.log('💾 Backup de segurança criado antes da restauração');
    }
    
    // Restaurar o backup
    fs.copyFileSync(backupPath, DB_PATH);
    
    console.log('✅ Backup restaurado com sucesso!');
    
    return {
      success: true,
      message: 'Backup restaurado com sucesso'
    };
    
  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Backup automático agendado
 */
export const scheduleAutoBackup = () => {
  // Backup a cada 6 horas
  const BACKUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 horas em ms
  
  console.log('⏰ Agendando backups automáticos a cada 6 horas...');
  
  // Criar backup inicial
  setTimeout(async () => {
    await createBackup();
  }, 5000); // 5 segundos após iniciar
  
  // Agendar backups periódicos
  setInterval(async () => {
    console.log('⏰ Executando backup automático agendado...');
    await createBackup();
  }, BACKUP_INTERVAL);
};

/**
 * Exportar dados em formato JSON (para migração)
 */
export const exportData = async () => {
  try {
    const { query } = await import('./db.js');
    
    console.log('📤 Exportando dados para JSON...');
    
    // Buscar todos os dados
    const funcionarios = await query('SELECT * FROM funcionarios');
    const protocolos = await query('SELECT * FROM protocolos');
    
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        funcionarios: funcionarios.rows || [],
        protocolos: protocolos.rows || []
      },
      stats: {
        totalFuncionarios: funcionarios.rows?.length || 0,
        totalProtocolos: protocolos.rows?.length || 0
      }
    };
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFileName = `data-export-${timestamp}.json`;
    const exportPath = path.join(BACKUP_DIR, exportFileName);
    
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    const stats = fs.statSync(exportPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Dados exportados com sucesso!');
    console.log(`📁 Arquivo: ${exportFileName}`);
    console.log(`📊 Tamanho: ${sizeInMB} MB`);
    console.log(`👥 Funcionários: ${exportData.stats.totalFuncionarios}`);
    console.log(`📋 Protocolos: ${exportData.stats.totalProtocolos}`);
    
    return {
      success: true,
      fileName: exportFileName,
      path: exportPath,
      stats: exportData.stats
    };
    
  } catch (error) {
    console.error('❌ Erro ao exportar dados:', error);
    return {
      success: false,
      error: error.message
    };
  }
};