import express from 'express';
import { query } from './db.js';

const router = express.Router();

// Função helper para gerar descrições de mudanças de status
function getStatusChangeDescription(oldStatus, newStatus, newAssignedTo, oldAssignedTo) {
  // Mudança de fila
  if (newAssignedTo !== oldAssignedTo) {
    if (!newAssignedTo && oldAssignedTo) {
      return `Movido da fila ${oldAssignedTo} para fila do Robô`;
    } else if (newAssignedTo && !oldAssignedTo) {
      return `Movido da fila do Robô para fila ${newAssignedTo}`;
    } else if (newAssignedTo && oldAssignedTo) {
      return `Movido da fila ${oldAssignedTo} para fila ${newAssignedTo}`;
    }
  }

  // Mudança de status específica
  if (newStatus !== oldStatus) {
    switch (newStatus) {
      case 'Peticionado':
        return 'Protocolo peticionado com sucesso';
      case 'Devolvido':
        return 'Protocolo devolvido';
      case 'Cancelado':
        return 'Protocolo cancelado';
      case 'Em Execução':
        return 'Protocolo em execução';
      case 'Aguardando':
        return 'Protocolo aguardando processamento';
      default:
        return `Status alterado de ${oldStatus} para ${newStatus}`;
    }
  }

  return 'Protocolo atualizado';
}

// Listar todos os protocolos
router.get('/protocolos', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, f.email as createdByEmail
      FROM protocolos p
      LEFT JOIN funcionarios f ON p.createdBy = f.id
      ORDER BY p.createdAt DESC
    `);

    const rows = result.rows || [];

    // Converter strings JSON de volta para objetos
    const protocolos = rows.map(row => {
      try {
        return {
          ...row,
          documents: JSON.parse(row.documents || '[]'),
          guias: JSON.parse(row.guias || '[]'),
          activityLog: JSON.parse(row.activityLog || '[]'),
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
          isFatal: Boolean(row.isFatal),
          needsProcuration: Boolean(row.needsProcuration),
          needsGuia: Boolean(row.needsGuia),
          isDistribution: Boolean(row.isDistribution)
        };
      } catch (parseError) {
        console.error('Erro ao parsear protocolo:', row.id);
        return {
          ...row,
          documents: [],
          guias: [],
          activityLog: [],
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
          isFatal: Boolean(row.isFatal),
          needsProcuration: Boolean(row.needsProcuration),
          needsGuia: Boolean(row.needsGuia),
          isDistribution: Boolean(row.isDistribution)
        };
      }
    });

    res.json({
      success: true,
      protocolos,
      total: protocolos.length,
      timestamp: new Date().toISOString(),
      syncStatus: 'success'
    });
  } catch (error) {
    console.error('Erro de sincronização:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Criar novo protocolo
router.post('/protocolos', async (req, res) => {
  
  const {
    processNumber,
    court,
    system,
    jurisdiction,
    processType,
    isFatal,
    needsProcuration,
    procurationType,
    needsGuia,
    guias,
    petitionType,
    observations,
    documents,
    status,
    assignedTo,
    createdBy,
    isDistribution,
    taskCode,
    createdByEmail
  } = req.body;

  // Validações básicas
  if (!createdBy) {
    return res.status(400).json({
      success: false,
      message: 'ID do usuário criador é obrigatório'
    });
  }

  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();

  // Criar log inicial com informações completas
  const initialLog = [{
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: now,
    action: 'created',
    description: `Protocolo criado${assignedTo ? ` e atribuído à fila ${assignedTo}` : ' na fila do Robô'}`,
    performedBy: createdByEmail || 'Usuário',
    performedById: createdBy
  }];

  try {
    // Preparar dados para inserção
    const insertData = [
      id,
      processNumber || '',
      court || '',
      system || '',
      jurisdiction || '',
      processType || 'civel',
      isFatal ? 1 : 0,
      needsProcuration ? 1 : 0,
      procurationType || '',
      needsGuia ? 1 : 0,
      JSON.stringify(guias || []),
      petitionType || '',
      observations || '',
      JSON.stringify(documents || []),
      status || 'Aguardando',
      assignedTo || null,
      createdBy,
      isDistribution ? 1 : 0,
      taskCode || '',
      now,
      now,
      1, // queuePosition padrão
      JSON.stringify(initialLog)
    ];

    const result = await query(`
      INSERT INTO protocolos (
        id, processNumber, court, system, jurisdiction, processType,
        isFatal, needsProcuration, procurationType, needsGuia, guias,
        petitionType, observations, documents, status, assignedTo,
        createdBy, isDistribution, taskCode, createdAt, updatedAt, queuePosition, activityLog
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, insertData);

    // Retornar protocolo criado
    const createdProtocol = {
      id,
      processNumber: processNumber || '',
      court: court || '',
      system: system || '',
      jurisdiction: jurisdiction || '',
      processType: processType || 'civel',
      isFatal: Boolean(isFatal),
      needsProcuration: Boolean(needsProcuration),
      procurationType: procurationType || '',
      needsGuia: Boolean(needsGuia),
      guias: guias || [],
      petitionType: petitionType || '',
      observations: observations || '',
      documents: documents || [],
      status: status || 'Aguardando',
      assignedTo: assignedTo || null,
      createdBy,
      isDistribution: Boolean(isDistribution),
      taskCode: taskCode || '',
      createdAt: new Date(now),
      updatedAt: new Date(now),
      queuePosition: 1,
      activityLog: initialLog
    };
    
    res.json({
      success: true,
      message: 'Protocolo criado com sucesso',
      protocolo: createdProtocol,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Erro ao inserir protocolo:', err.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar protocolo: ' + err.message,
      error: err.message,
      sqlError: true
    });
  }
});

// Atualizar protocolo
router.put('/protocolos/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const now = new Date().toISOString();

  try {
    // Primeiro, buscar o protocolo atual para manter o log
    const result = await query('SELECT * FROM protocolos WHERE id = ?', [id]);
    const row = result.rows && result.rows.length > 0 ? result.rows[0] : null;

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Protocolo não encontrado'
      });
    }

    // Manter log existente e adicionar nova entrada se fornecida
    let currentLog = [];
    try {
      currentLog = JSON.parse(row.activityLog || '[]');
    } catch (parseError) {
      console.error('❌ Erro ao parsear log existente:', parseError);
      currentLog = [];
    }

    // Sistema unificado de logs - evita duplicação
    if (updates.newLogEntry && updates.newLogEntry.performedBy) {
      const newEntry = {
        ...updates.newLogEntry,
        timestamp: now,
        id: updates.newLogEntry.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9))
      };
      currentLog.push(newEntry);
    } else if (updates.status && updates.status !== row.status) {
      // Somente criar log automático se não houver log manual
      const statusChangeEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: now,
        action: 'status_changed',
        description: getStatusChangeDescription(row.status, updates.status, updates.assignedTo, row.assignedTo),
        performedBy: updates.performedBy || 'Sistema',
        performedById: updates.performedById
      };

      if (statusChangeEntry.performedBy !== 'Sistema') {
        currentLog.push(statusChangeEntry);
      }
    }

    // Construir query de atualização dinamicamente
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (key !== 'newLogEntry' && key !== 'id') {
        fields.push(`${key} = ?`);
        
        if (key === 'documents' || key === 'guias') {
          values.push(JSON.stringify(updates[key]));
        } else if (key === 'isFatal' || key === 'needsProcuration' || key === 'needsGuia' || key === 'isDistribution') {
          values.push(updates[key] ? 1 : 0);
        } else {
          values.push(updates[key]);
        }
      }
    });

    // Sempre atualizar updatedAt e activityLog
    fields.push('updatedAt = ?', 'activityLog = ?');
    values.push(now, JSON.stringify(currentLog));
    values.push(id); // WHERE clause parameter

    const updateQuery = `UPDATE protocolos SET ${fields.join(', ')} WHERE id = ?`;

    const updateResult = await query(updateQuery, values);
    const changes = updateResult.changes || 0;

    if (changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Protocolo não encontrado ou nenhuma alteração feita'
      });
    }

    res.json({
      success: true,
      message: 'Protocolo atualizado com sucesso',
      changes: changes,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Erro ao atualizar protocolo:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar protocolo',
      error: err.message
    });
  }
});

// Deletar protocolo
router.delete('/protocolos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM protocolos WHERE id = ?', [id]);
    const changes = result.changes || 0;

    if (changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Protocolo não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Protocolo deletado com sucesso',
      changes: changes,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Erro ao deletar protocolo:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao deletar protocolo',
      error: err.message
    });
  }
});

// Rota de teste para verificar conectividade
router.get('/protocolos/test', async (req, res) => {
  try {
    // Testar conexão com banco
    const result = await query('SELECT COUNT(*) as count FROM protocolos');
    const count = result.rows[0].count;

    res.json({
      success: true,
      message: 'Conectividade com protocolos funcionando',
      totalProtocols: count,
      timestamp: new Date().toISOString(),
      database: 'SQLite conectado',
      server: 'Express rodando'
    });
  } catch (err) {
    console.error('Erro no teste de conectividade:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro de conectividade com banco de dados',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;