import express from 'express';
import db from './db.js';

const router = express.Router();

// Listar todos os protocolos
router.get('/protocolos', (req, res) => {
  console.log('GET /protocolos chamado');
  
  db.all(`
    SELECT p.*, f.email as createdByEmail 
    FROM protocolos p 
    LEFT JOIN funcionarios f ON p.createdBy = f.id 
    ORDER BY p.createdAt DESC
  `, (err, rows) => {
    if (err) {
      console.error('Erro ao buscar protocolos:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

    // Converter strings JSON de volta para objetos
    const protocolos = rows.map(row => ({
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
    }));

    console.log('Protocolos encontrados:', protocolos.length);
    res.json({
      success: true,
      protocolos
    });
  });
});

// Criar novo protocolo
router.post('/protocolos', (req, res) => {
  console.log('POST /protocolos chamado com:', req.body);
  
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
    isDistribution
  } = req.body;

  const id = Date.now().toString();
  const now = new Date().toISOString();
  
  // Criar log inicial
  const initialLog = [{
    id: Date.now().toString(),
    timestamp: now,
    action: 'created',
    description: 'Protocolo criado',
    performedBy: req.body.createdByEmail || 'Usuário'
  }];

  db.run(`
    INSERT INTO protocolos (
      id, processNumber, court, system, jurisdiction, processType,
      isFatal, needsProcuration, procurationType, needsGuia, guias,
      petitionType, observations, documents, status, assignedTo,
      createdBy, isDistribution, createdAt, updatedAt, queuePosition, activityLog
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
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
    now,
    now,
    1, // queuePosition padrão
    JSON.stringify(initialLog)
  ], function(err) {
    if (err) {
      console.error('Erro ao criar protocolo:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao criar protocolo' 
      });
    }

    console.log('Protocolo criado com ID:', id);
    res.json({
      success: true,
      message: 'Protocolo criado com sucesso',
      protocolo: {
        id,
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
        createdAt: new Date(now),
        updatedAt: new Date(now),
        queuePosition: 1,
        activityLog: initialLog
      }
    });
  });
});

// Atualizar protocolo
router.put('/protocolos/:id', (req, res) => {
  console.log('PUT /protocolos/:id chamado com:', req.params.id, req.body);
  
  const { id } = req.params;
  const updates = req.body;
  const now = new Date().toISOString();

  // Primeiro, buscar o protocolo atual para manter o log
  db.get('SELECT * FROM protocolos WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Erro ao buscar protocolo:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

    if (!row) {
      return res.status(404).json({ 
        success: false, 
        message: 'Protocolo não encontrado' 
      });
    }

    // Manter log existente e adicionar nova entrada se fornecida
    let currentLog = JSON.parse(row.activityLog || '[]');
    if (updates.newLogEntry) {
      currentLog.push({
        ...updates.newLogEntry,
        timestamp: now
      });
    }

    // Construir query de atualização dinamicamente
    const fields = [];
    const values = [];

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
    values.push(id);

    const query = `UPDATE protocolos SET ${fields.join(', ')} WHERE id = ?`;

    db.run(query, values, function(err) {
      if (err) {
        console.error('Erro ao atualizar protocolo:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao atualizar protocolo' 
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Protocolo não encontrado' 
        });
      }

      console.log('Protocolo atualizado:', id);
      res.json({
        success: true,
        message: 'Protocolo atualizado com sucesso'
      });
    });
  });
});

// Deletar protocolo
router.delete('/protocolos/:id', (req, res) => {
  console.log('DELETE /protocolos/:id chamado com:', req.params.id);
  const { id } = req.params;

  db.run('DELETE FROM protocolos WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Erro ao deletar protocolo:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao deletar protocolo' 
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Protocolo não encontrado' 
      });
    }

    console.log('Protocolo deletado:', id);
    res.json({
      success: true,
      message: 'Protocolo deletado com sucesso'
    });
  });
});

export default router;