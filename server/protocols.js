import express from 'express';
import db from './db.js';

const router = express.Router();

// Listar todos os protocolos
router.get('/protocolos', (req, res) => {
  console.log('🔍 GET /protocolos chamado');
  console.log('📍 Origin:', req.headers.origin);
  console.log('🔧 User-Agent:', req.headers['user-agent']?.substring(0, 50) + '...');
  
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

    console.log(`📊 Total de protocolos encontrados no banco: ${rows.length}`);

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
        console.error('❌ Erro ao parsear protocolo:', row.id, parseError);
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

    console.log('✅ Protocolos processados com sucesso');
    console.log(`📋 Últimos 3 protocolos:`, protocolos.slice(0, 3).map(p => ({
      id: p.id,
      processNumber: p.processNumber,
      status: p.status,
      assignedTo: p.assignedTo,
      createdBy: p.createdBy,
      createdAt: p.createdAt
    })));
    
    res.json({
      success: true,
      protocolos,
      total: protocolos.length,
      timestamp: new Date().toISOString()
    });
  });
});

// Criar novo protocolo
router.post('/protocolos', (req, res) => {
  console.log('📝 POST /protocolos chamado');
  console.log('📍 Origin:', req.headers.origin);
  console.log('📦 Tamanho dos dados recebidos:', JSON.stringify(req.body).length, 'bytes');
  
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
    createdByEmail
  } = req.body;

  // Validações básicas
  if (!createdBy) {
    console.error('❌ createdBy é obrigatório');
    return res.status(400).json({
      success: false,
      message: 'ID do usuário criador é obrigatório'
    });
  }
  
  // Validar tamanho dos dados
  const dataSize = JSON.stringify(req.body).length;
  if (dataSize > 50 * 1024 * 1024) { // 50MB limit
    console.error('❌ Dados muito grandes:', dataSize, 'bytes');
    return res.status(413).json({
      success: false,
      message: 'Dados muito grandes. Reduza o tamanho dos arquivos anexados.'
    });
  }

  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();
  
  // Criar log inicial
  const initialLog = [{
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: now,
    action: 'created',
    description: 'Protocolo criado',
    performedBy: createdByEmail || 'Usuário'
  }];

  console.log('💾 Tentando inserir protocolo:');
  console.log('🆔 ID:', id);
  console.log('📋 Resumo dos dados:', {
    processNumber: processNumber || 'N/A',
    court: court || 'N/A',
    system: system || 'N/A',
    status: status || 'Aguardando',
    assignedTo: assignedTo || 'null',
    createdBy,
    isDistribution: Boolean(isDistribution),
    documentsCount: documents ? documents.length : 0,
    guiasCount: guias ? guias.length : 0
  });

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
    now,
    now,
    1, // queuePosition padrão
    JSON.stringify(initialLog)
  ];

  console.log('📊 Dados preparados para inserção (campos principais)');

  db.run(`
    INSERT INTO protocolos (
      id, processNumber, court, system, jurisdiction, processType,
      isFatal, needsProcuration, procurationType, needsGuia, guias,
      petitionType, observations, documents, status, assignedTo,
      createdBy, isDistribution, createdAt, updatedAt, queuePosition, activityLog
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, insertData, function(err) {
    if (err) {
      console.error('❌ ERRO CRÍTICO ao inserir protocolo:', err);
      console.error('📋 SQL Error details:', err.message);
      console.error('📊 Erro na inserção do protocolo ID:', id);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao criar protocolo: ' + err.message,
        error: err.message,
        sqlError: true
      });
    }

    console.log('🎉 PROTOCOLO CRIADO COM SUCESSO!');
    console.log('🆔 ID do protocolo:', id);
    console.log('📊 Linhas afetadas:', this.changes);
    
    // Verificar se foi realmente inserido
    db.get('SELECT COUNT(*) as count FROM protocolos WHERE id = ?', [id], (countErr, countRow) => {
      if (countErr) {
        console.error('❌ Erro ao verificar inserção:', countErr);
      } else {
        console.log('✅ Verificação: protocolo existe no banco:', countRow.count > 0);
      }
    });

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
  });
});

// Atualizar protocolo
router.put('/protocolos/:id', (req, res) => {
  console.log('🔄 PUT /protocolos/:id chamado');
  console.log('🆔 ID:', req.params.id);
  console.log('📦 Updates:', JSON.stringify(req.body, null, 2));
  
  const { id } = req.params;
  const updates = req.body;
  const now = new Date().toISOString();

  // Primeiro, buscar o protocolo atual para manter o log
  db.get('SELECT * FROM protocolos WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('❌ Erro ao buscar protocolo para atualização:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: err.message
      });
    }

    if (!row) {
      console.error('❌ Protocolo não encontrado para atualização:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Protocolo não encontrado' 
      });
    }

    console.log('📋 Protocolo encontrado para atualização:', {
      id: row.id,
      processNumber: row.processNumber,
      status: row.status
    });

    // Manter log existente e adicionar nova entrada se fornecida
    let currentLog = [];
    try {
      currentLog = JSON.parse(row.activityLog || '[]');
    } catch (parseError) {
      console.error('❌ Erro ao parsear log existente:', parseError);
      currentLog = [];
    }

    if (updates.newLogEntry) {
      const newEntry = {
        ...updates.newLogEntry,
        timestamp: now,
        id: updates.newLogEntry.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9))
      };
      currentLog.push(newEntry);
      console.log('📝 Nova entrada de log adicionada:', newEntry);
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
    
    console.log('🔄 Query de atualização:', query);
    console.log('📊 Valores:', values);

    db.run(query, values, function(err) {
      if (err) {
        console.error('❌ Erro ao atualizar protocolo:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao atualizar protocolo',
          error: err.message
        });
      }

      if (this.changes === 0) {
        console.error('❌ Nenhuma linha foi atualizada');
        return res.status(404).json({ 
          success: false, 
          message: 'Protocolo não encontrado ou nenhuma alteração feita' 
        });
      }

      console.log('✅ Protocolo atualizado com sucesso');
      console.log('📊 Linhas afetadas:', this.changes);
      
      res.json({
        success: true,
        message: 'Protocolo atualizado com sucesso',
        changes: this.changes,
        timestamp: new Date().toISOString()
      });
    });
  });
});

// Deletar protocolo
router.delete('/protocolos/:id', (req, res) => {
  console.log('🗑️ DELETE /protocolos/:id chamado');
  console.log('🆔 ID:', req.params.id);
  
  const { id } = req.params;

  db.run('DELETE FROM protocolos WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('❌ Erro ao deletar protocolo:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao deletar protocolo',
        error: err.message
      });
    }

    if (this.changes === 0) {
      console.error('❌ Protocolo não encontrado para deleção:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Protocolo não encontrado' 
      });
    }

    console.log('✅ Protocolo deletado com sucesso');
    console.log('📊 Linhas afetadas:', this.changes);
    
    res.json({
      success: true,
      message: 'Protocolo deletado com sucesso',
      changes: this.changes,
      timestamp: new Date().toISOString()
    });
  });
});

// Rota de teste para verificar conectividade
router.get('/protocolos/test', (req, res) => {
  console.log('🧪 GET /protocolos/test chamado');
  
  // Testar conexão com banco
  db.get('SELECT COUNT(*) as count FROM protocolos', (err, row) => {
    if (err) {
      console.error('❌ Erro no teste de conectividade:', err);
      return res.status(500).json({
        success: false,
        message: 'Erro de conectividade com banco de dados',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('✅ Teste de conectividade bem-sucedido');
    res.json({
      success: true,
      message: 'Conectividade com protocolos funcionando',
      totalProtocols: row.count,
      timestamp: new Date().toISOString(),
      database: 'SQLite conectado',
      server: 'Express rodando'
    });
  });
});

export default router;