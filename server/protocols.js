import express from 'express';
import { query } from './db.js';

const router = express.Router();

// Listar todos os protocolos
router.get('/protocolos', async (req, res) => {
  const syncId = req.headers['x-sync-id'] || 'unknown';
  const forceRefresh = req.headers['x-force-refresh'] === '1';
  
  console.log(`🔍 [${syncId}] SINCRONIZAÇÃO CRÍTICA:`, {
    origin: req.headers.origin,
    mode: req.headers['x-sync-mode'] || 'normal',
    force: forceRefresh,
    userAgent: req.headers['user-agent']?.substring(0, 50)
  });
  
  try {
    // Headers para evitar cache em qualquer nível
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toUTCString(),
      'ETag': `"${Date.now()}-${Math.random()}"`,
      'X-Sync-Response': syncId,
      'X-Timestamp': new Date().toISOString()
    });
    
    const result = await query(`
      SELECT p.*, f.email as createdByEmail 
      FROM protocolos p 
      LEFT JOIN funcionarios f ON p.createdBy = f.id 
      ORDER BY p.createdAt DESC
    `);

    const rows = result.rows || [];
    console.log(`📊 [${syncId}] SINCRONIZANDO ${rows.length} protocolos para TODOS os usuários`);

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
        console.error('❌ Erro ao parsear protocolo:', row.id);
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

    console.log(`✅ [${syncId}] SINCRONIZAÇÃO COMPLETA - DADOS FRESCOS ENVIADOS`);
    console.log(`🎯 [${syncId}] Filas: Robô(${protocolos.filter(p => !p.assignedTo && p.status === 'Aguardando').length}) Carlos(${protocolos.filter(p => p.assignedTo === 'Carlos' && p.status === 'Aguardando').length}) Deyse(${protocolos.filter(p => p.assignedTo === 'Deyse' && p.status === 'Aguardando').length})`);
    
    res.json({
      success: true,
      protocolos,
      total: protocolos.length,
      timestamp: new Date().toISOString(),
      syncStatus: 'success',
      syncId: syncId,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ [${syncId}] ERRO CRÍTICO DE SINCRONIZAÇÃO:`, error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message,
      syncId: syncId
    });
  }
});

// Criar novo protocolo
router.post('/protocolos', async (req, res) => {
  const syncId = req.headers['x-sync-id'] || Date.now().toString();
  
  console.log(`📝 [${syncId}] CRIAÇÃO DE PROTOCOLO CRÍTICA`);
  console.log(`📍 [${syncId}] Origin:`, req.headers.origin);
  console.log(`🔗 [${syncId}] User-Agent:`, req.headers['user-agent']?.substring(0, 50));
  console.log(`📦 [${syncId}] Dados:`, {
    processNumber: req.body.processNumber,
    court: req.body.court,
    assignedTo: req.body.assignedTo,
    createdBy: req.body.createdBy
  });
  
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
  console.log('📋 Dados principais:', {
    processNumber: processNumber || 'N/A',
    court: court || 'N/A',
    system: system || 'N/A',
    status: status || 'Aguardando',
    assignedTo: assignedTo || 'null',
    createdBy,
    isDistribution: Boolean(isDistribution)
  });

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
      now,
      now,
      1, // queuePosition padrão
      JSON.stringify(initialLog)
    ];

    console.log('📊 Dados preparados para inserção:', insertData.map((item, index) => {
      const fields = [
        'id', 'processNumber', 'court', 'system', 'jurisdiction', 'processType',
        'isFatal', 'needsProcuration', 'procurationType', 'needsGuia', 'guias',
        'petitionType', 'observations', 'documents', 'status', 'assignedTo',
        'createdBy', 'isDistribution', 'createdAt', 'updatedAt', 'queuePosition', 'activityLog'
      ];
      return `${fields[index]}: ${item}`;
    }));

    const result = await query(`
      INSERT INTO protocolos (
        id, processNumber, court, system, jurisdiction, processType,
        isFatal, needsProcuration, procurationType, needsGuia, guias,
        petitionType, observations, documents, status, assignedTo,
        createdBy, isDistribution, createdAt, updatedAt, queuePosition, activityLog
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, insertData);

    console.log('🎉 PROTOCOLO CRIADO COM SUCESSO!');
    console.log(`🎉 [${syncId}] PROTOCOLO CRIADO - NOTIFICANDO TODOS OS USUÁRIOS`);
    console.log(`🆔 [${syncId}] ID:`, id);
    console.log(`🎯 [${syncId}] Direcionado para:`, assignedTo || 'Fila do Robô');
    
    // Verificar se foi realmente inserido
    try {
      const countResult = await query('SELECT COUNT(*) as count FROM protocolos WHERE id = ?', [id]);
      const count = countResult.rows[0].count;
      console.log(`✅ [${syncId}] Verificação: protocolo existe no banco:`, count > 0);
        
      // Verificar contagem total após inserção
      const totalResult = await query('SELECT COUNT(*) as total FROM protocolos');
      const total = totalResult.rows[0].total;
      console.log(`📊 [${syncId}] Total no banco:`, total);
    } catch (countErr) {
      console.error(`❌ [${syncId}] Erro ao verificar inserção:`, countErr);
    }

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
    
    // Headers para invalidar cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Protocol-Created': id,
      'X-Sync-Trigger': 'protocol-created',
      'X-Timestamp': new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Protocolo criado com sucesso',
      protocolo: createdProtocol,
      timestamp: new Date().toISOString(),
      syncId: syncId
    });
  } catch (err) {
    console.error(`❌ [${syncId}] ERRO CRÍTICO ao inserir protocolo:`, err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar protocolo: ' + err.message,
      error: err.message,
      sqlError: true,
      syncId: syncId
    });
  }
});

// Atualizar protocolo
router.put('/protocolos/:id', async (req, res) => {
  const syncId = req.headers['x-sync-id'] || Date.now().toString();
  
  console.log(`🔄 [${syncId}] ATUALIZAÇÃO CRÍTICA DE PROTOCOLO`);
  console.log(`🆔 [${syncId}] ID:`, req.params.id);
  console.log(`📦 [${syncId}] Updates:`, Object.keys(req.body));
  
  const { id } = req.params;
  const updates = req.body;
  const now = new Date().toISOString();

  try {
    // Primeiro, buscar o protocolo atual para manter o log
    const result = await query('SELECT * FROM protocolos WHERE id = ?', [id]);
    const row = result.rows && result.rows.length > 0 ? result.rows[0] : null;

    if (!row) {
      console.error(`❌ [${syncId}] Protocolo não encontrado:`, id);
      return res.status(404).json({ 
        success: false, 
        message: 'Protocolo não encontrado',
        syncId: syncId
      });
    }

    console.log(`📋 [${syncId}] Protocolo encontrado:`, {
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
      console.log(`📝 [${syncId}] Nova entrada de log:`, newEntry.description);
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
    
    console.log(`🔄 [${syncId}] Executando atualização...`);

    const updateResult = await query(updateQuery, values);
    const changes = updateResult.changes || 0;

    if (changes === 0) {
      console.error(`❌ [${syncId}] Nenhuma linha foi atualizada`);
      return res.status(404).json({ 
        success: false, 
        message: 'Protocolo não encontrado ou nenhuma alteração feita',
        syncId: syncId
      });
    }

    console.log(`✅ [${syncId}] PROTOCOLO ATUALIZADO - NOTIFICANDO TODOS OS USUÁRIOS`);
    console.log(`📊 [${syncId}] Linhas afetadas:`, changes);
    
    // Headers para invalidar cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Protocol-Updated': id,
      'X-Sync-Trigger': 'protocol-updated',
      'X-Timestamp': new Date().toISOString()
    });
      
    res.json({
      success: true,
      message: 'Protocolo atualizado com sucesso',
      changes: changes,
      timestamp: new Date().toISOString(),
      syncId: syncId
    });
  } catch (err) {
    console.error(`❌ [${syncId}] Erro ao atualizar protocolo:`, err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar protocolo',
      error: err.message,
      syncId: syncId
    });
  }
});

// Deletar protocolo
router.delete('/protocolos/:id', async (req, res) => {
  console.log('🗑️ DELETE /protocolos/:id chamado');
  console.log('🆔 ID:', req.params.id);
  
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM protocolos WHERE id = ?', [id]);
    const changes = result.changes || 0;

    if (changes === 0) {
      console.error('❌ Protocolo não encontrado para deleção:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Protocolo não encontrado' 
      });
    }

    console.log('✅ Protocolo deletado com sucesso');
    console.log('📊 Linhas afetadas:', changes);
    
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
  console.log('🧪 GET /protocolos/test chamado');
  
  try {
    // Testar conexão com banco
    const result = await query('SELECT COUNT(*) as count FROM protocolos');
    const count = result.rows[0].count;
    
    console.log('✅ Teste de conectividade bem-sucedido');
    res.json({
      success: true,
      message: 'Conectividade com protocolos funcionando',
      totalProtocols: count,
      timestamp: new Date().toISOString(),
      database: 'SQLite conectado',
      server: 'Express rodando'
    });
  } catch (err) {
    console.error('❌ Erro no teste de conectividade:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro de conectividade com banco de dados',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;