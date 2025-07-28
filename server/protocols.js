import express from 'express';
import db from './db.js';

const router = express.Router();

// GET / - Buscar todos os protocolos
router.get('/', (req, res) => {
  console.log('📋 GET /api/protocolos - Buscando todos os protocolos');
  
  try {
    db.all(`
      SELECT p.*, f.email as createdByEmail 
      FROM protocolos p 
      LEFT JOIN funcionarios f ON p.createdBy = f.id 
      ORDER BY p.createdAt DESC
    `, (err, rows) => {
      if (err) {
        console.error('❌ Erro ao buscar protocolos:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro interno do servidor',
          error: err.message 
        });
      }

      console.log(`✅ Encontrados ${rows.length} protocolos`);
      
      // Parse JSON fields and convert data types
      const parsedProtocols = rows.map(protocol => ({
        ...protocol,
        documents: protocol.documents ? JSON.parse(protocol.documents) : [],
        guias: protocol.guias ? JSON.parse(protocol.guias) : [],
        activityLog: protocol.activityLog ? JSON.parse(protocol.activityLog) : [],
        isFatal: Boolean(protocol.isFatal),
        needsProcuration: Boolean(protocol.needsProcuration),
        needsGuia: Boolean(protocol.needsGuia),
        isDistribution: Boolean(protocol.isDistribution),
        createdAt: new Date(protocol.createdAt),
        updatedAt: new Date(protocol.updatedAt)
      }));

      res.json({
        success: true,
        protocolos: parsedProtocols,
        total: parsedProtocols.length,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('❌ Erro ao buscar protocolos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// POST / - Criar novo protocolo
router.post('/', (req, res) => {
  console.log('📋 POST /api/protocolos - Criando novo protocolo');
  console.log('📦 Dados recebidos:', {
    processNumber: req.body.processNumber,
    court: req.body.court,
    createdBy: req.body.createdBy,
    documentsCount: req.body.documents?.length || 0
  });
  
  try {
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
      assignedTo,
      isDistribution
    } = req.body;

    const userId = req.body.createdBy || req.user?.id || 1;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Validações básicas
    if (!court || !system || !petitionType) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }

    // Gerar ID único para o protocolo
    const protocolId = `PROT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Criar log de atividade inicial
    const initialActivity = [{
      id: `ACT-${Date.now()}`,
      timestamp: now,
      action: 'created',
      description: 'Protocolo criado',
      performedBy: req.user?.email || 'Sistema'
    }];

    console.log('💾 Salvando protocolo no banco de dados...');
    
      db.run(`
        INSERT INTO protocolos (
          id, processNumber, court, system, jurisdiction, processType,
          isFatal, needsProcuration, procurationType, needsGuia, guias,
          petitionType, observations, documents, status, assignedTo,
          createdBy, isDistribution, createdAt, updatedAt, queuePosition, activityLog
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        protocolId,
        processNumber || '',
        court,
        system,
        jurisdiction || '1º Grau',
        processType || 'civel',
        isFatal ? 1 : 0,
        needsProcuration ? 1 : 0,
        procurationType || '',
        needsGuia ? 1 : 0,
        JSON.stringify(guias || []),
        petitionType,
        observations || '',
        JSON.stringify(documents || []),
        'Aguardando',
        assignedTo || null,
        userId,
        isDistribution ? 1 : 0,
        now,
        now,
        1,
        JSON.stringify(initialActivity)
      ], function(err) {
        if (err) {
          console.error('❌ Erro ao inserir protocolo:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Erro ao salvar protocolo',
            error: err.message 
          });
        }
        
        console.log('✅ Protocolo salvo com ID:', protocolId);
        
        // Buscar o protocolo criado
        db.get(`
          SELECT p.*, f.email as createdByEmail 
          FROM protocolos p 
          LEFT JOIN funcionarios f ON p.createdBy = f.id 
          WHERE p.id = ?
        `, [protocolId], (err, row) => {
          if (err) {
            console.error('❌ Erro ao buscar protocolo criado:', err);
            return res.status(500).json({ 
              success: false, 
              message: 'Erro ao buscar protocolo criado',
              error: err.message 
            });
          }
          
          if (!row) {
            return res.status(404).json({ 
              success: false, 
              message: 'Protocolo criado mas não encontrado' 
            });
          }
          
          // Parse JSON fields
          const parsedProtocol = {
            ...row,
            documents: row.documents ? JSON.parse(row.documents) : [],
            guias: row.guias ? JSON.parse(row.guias) : [],
            activityLog: row.activityLog ? JSON.parse(row.activityLog) : [],
            isFatal: Boolean(row.isFatal),
            needsProcuration: Boolean(row.needsProcuration),
            needsGuia: Boolean(row.needsGuia),
            isDistribution: Boolean(row.isDistribution),
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
          };
          
          console.log('✅ Protocolo criado com sucesso:', protocolId);
          res.status(201).json({
            success: true,
            message: 'Protocolo criado com sucesso',
            protocolo: parsedProtocol
          });
        });
      });
  } catch (error) {
    console.error('❌ Erro ao criar protocolo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// PUT /:id - Atualizar protocolo
router.put('/:id', (req, res) => {
  console.log('📋 PUT /api/protocolos/:id - Atualizando protocolo:', req.params.id);
  
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user?.id || 1;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o protocolo existe
    db.get('SELECT * FROM protocolos WHERE id = ?', [id], (err, existingProtocol) => {
      if (err) {
        console.error('❌ Erro ao buscar protocolo:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro interno do servidor',
          error: err.message 
        });
      }

      if (!existingProtocol) {
        return res.status(404).json({ 
          success: false, 
          message: 'Protocolo não encontrado' 
        });
      }

      // Campos permitidos para atualização
      const allowedFields = [
        'processNumber', 'court', 'system', 'jurisdiction', 'processType',
        'isFatal', 'needsProcuration', 'procurationType', 'needsGuia', 'guias',
        'petitionType', 'observations', 'documents', 'status', 'assignedTo',
        'returnReason', 'queuePosition'
      ];

      const updateFields = [];
      const updateValues = [];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          
          if (key === 'guias' || key === 'documents') {
            updateValues.push(JSON.stringify(updates[key]));
          } else if (key === 'isFatal' || key === 'needsProcuration' || key === 'needsGuia') {
            updateValues.push(updates[key] ? 1 : 0);
          } else {
            updateValues.push(updates[key]);
          }
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Nenhum campo válido para atualizar' 
        });
      }

      // Atualizar activityLog se houver mudança de status
      let activityLog = existingProtocol.activityLog ? JSON.parse(existingProtocol.activityLog) : [];
      
      if (updates.status && updates.status !== existingProtocol.status) {
        const newActivity = {
          id: `ACT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'status_changed',
          description: `Status alterado de "${existingProtocol.status}" para "${updates.status}"`,
          performedBy: req.user?.email || 'Sistema'
        };
        
        if (updates.returnReason) {
          newActivity.details = updates.returnReason;
        }
        
        activityLog.push(newActivity);
      }

      updateFields.push('updatedAt = ?', 'activityLog = ?');
      updateValues.push(new Date().toISOString(), JSON.stringify(activityLog), id);

      db.run(`
        UPDATE protocolos 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `, updateValues, (err) => {
        if (err) {
          console.error('❌ Erro ao atualizar protocolo:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Erro ao atualizar protocolo',
            error: err.message 
          });
        }
        
        console.log('✅ Protocolo atualizado:', id);
        
        // Buscar protocolo atualizado
        db.get(`
          SELECT p.*, f.email as createdByEmail 
          FROM protocolos p 
          LEFT JOIN funcionarios f ON p.createdBy = f.id 
          WHERE p.id = ?
        `, [id], (err, row) => {
          if (err) {
            console.error('❌ Erro ao buscar protocolo atualizado:', err);
            return res.status(500).json({ 
              success: false, 
              message: 'Erro ao buscar protocolo atualizado',
              error: err.message 
            });
          }
          
          if (!row) {
            return res.status(404).json({ 
              success: false, 
              message: 'Protocolo não encontrado após atualização' 
            });
          }
          
          // Parse JSON fields
          const parsedProtocol = {
            ...row,
            documents: row.documents ? JSON.parse(row.documents) : [],
            guias: row.guias ? JSON.parse(row.guias) : [],
            activityLog: row.activityLog ? JSON.parse(row.activityLog) : [],
            isFatal: Boolean(row.isFatal),
            needsProcuration: Boolean(row.needsProcuration),
            needsGuia: Boolean(row.needsGuia),
            isDistribution: Boolean(row.isDistribution),
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
          };
          
          res.json({
            success: true,
            message: 'Protocolo atualizado com sucesso',
            protocolo: parsedProtocol
          });
        });
      });
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar protocolo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// DELETE /:id - Deletar protocolo
router.delete('/:id', (req, res) => {
  console.log('📋 DELETE /api/protocolos/:id - Deletando protocolo:', req.params.id);
  
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o protocolo existe
    db.get('SELECT * FROM protocolos WHERE id = ?', [id], (err, existingProtocol) => {
      if (err) {
        console.error('❌ Erro ao buscar protocolo:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro interno do servidor',
          error: err.message 
        });
      }

      if (!existingProtocol) {
        return res.status(404).json({ 
          success: false, 
          message: 'Protocolo não encontrado' 
        });
      }

      db.run('DELETE FROM protocolos WHERE id = ?', [id], (err) => {
        if (err) {
          console.error('❌ Erro ao deletar protocolo:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Erro ao deletar protocolo',
            error: err.message 
          });
        }
        
        console.log('✅ Protocolo deletado:', id);
        res.json({ 
          success: true, 
          message: 'Protocolo deletado com sucesso' 
        });
      });
    });
  } catch (error) {
    console.error('❌ Erro ao deletar protocolo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Rota de teste
router.get('/test', (req, res) => {
  console.log('🧪 GET /api/protocolos/test - Teste da API');
  res.json({ 
    success: true, 
    message: 'API de protocolos funcionando!',
    timestamp: new Date().toISOString()
  });
});

// GET /queue/:queueName - Buscar protocolos por fila
router.get('/queue/:queueName', (req, res) => {
  console.log('📋 GET /api/protocolos/queue/:queueName - Buscando fila:', req.params.queueName);
  
  try {
    const { queueName } = req.params;
    
    let whereClause = '';
    if (queueName === 'robot') {
      whereClause = "WHERE p.assignedTo IS NULL AND p.status = 'Aguardando'";
    } else if (queueName === 'carlos' || queueName === 'deyse') {
      whereClause = `WHERE p.assignedTo = '${queueName.charAt(0).toUpperCase() + queueName.slice(1)}'`;
    } else if (queueName === 'returned') {
      whereClause = "WHERE p.status = 'Devolvido'";
    } else {
      return res.status(400).json({ success: false, message: 'Fila inválida' });
    }

    db.all(`
      SELECT p.*, f.email as createdByEmail 
      FROM protocolos p 
      LEFT JOIN funcionarios f ON p.createdBy = f.id 
      ${whereClause}
      ORDER BY p.queuePosition ASC, p.createdAt ASC
    `, (err, rows) => {
      if (err) {
        console.error('❌ Erro ao buscar protocolos da fila:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro interno do servidor',
          error: err.message 
        });
      }

      console.log(`✅ Encontrados ${rows.length} protocolos na fila ${queueName}`);
      
      // Parse JSON fields
      const parsedProtocols = rows.map(protocol => ({
        ...protocol,
        documents: protocol.documents ? JSON.parse(protocol.documents) : [],
        guias: protocol.guias ? JSON.parse(protocol.guias) : [],
        activityLog: protocol.activityLog ? JSON.parse(protocol.activityLog) : [],
        isFatal: Boolean(protocol.isFatal),
        needsProcuration: Boolean(protocol.needsProcuration),
        needsGuia: Boolean(protocol.needsGuia),
        isDistribution: Boolean(protocol.isDistribution),
        createdAt: new Date(protocol.createdAt),
        updatedAt: new Date(protocol.updatedAt)
      }));

      res.json({
        success: true,
        protocolos: parsedProtocols,
        total: parsedProtocols.length,
        queue: queueName,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('❌ Erro ao buscar protocolos da fila:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

export default router;