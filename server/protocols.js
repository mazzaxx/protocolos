import express from 'express';
import { query } from './db.js';

/**
 * MÓDULO DE PROTOCOLOS JURÍDICOS - SQUARE CLOUD
 * 
 * Gerencia todos os protocolos jurídicos do sistema.
 * API REST completa otimizada para Square Cloud.
 * 
 * FUNCIONALIDADES:
 * - CRUD completo de protocolos
 * - Sincronização em tempo real
 * - Upload de documentos
 * - Sistema de filas (Robô, Carlos, Deyse)
 * - Logs de atividade
 * 
 * HOSPEDAGEM SQUARE CLOUD:
 * - Performance otimizada para múltiplos usuários
 * - Consultas SQLite eficientes
 * - Tratamento robusto de erros
 * - Logs detalhados para monitoramento
 */

const router = express.Router();

/**
 * ENDPOINT: LISTAR TODOS OS PROTOCOLOS
 * 
 * Retorna todos os protocolos com informações dos usuários.
 * Endpoint principal para sincronização em tempo real.
 * 
 * SQUARE CLOUD:
 * - Query otimizada com JOIN
 * - Processamento de JSON fields
 * - Logs de sincronização
 * - Tratamento de erros robusto
 */
router.get('/protocolos', async (req, res) => {
  console.log('🔍 [SQUARE CLOUD] SINCRONIZAÇÃO: Listando protocolos para', req.headers.origin);
  console.log('🔄 [SQUARE CLOUD] Modo:', req.headers['x-sync-mode'] || 'normal');
  
  try {
    /**
     * QUERY OTIMIZADA PARA SQUARE CLOUD
     * 
     * JOIN otimizado entre protocolos e funcionários.
     * Usa índices para performance máxima.
     */
    const result = await query(`
      SELECT p.*, f.email as createdByEmail 
      FROM protocolos p 
      LEFT JOIN funcionarios f ON p.createdBy = f.id 
      ORDER BY p.createdAt DESC
    `);

    const rows = result.rows || [];
    console.log(`📊 [SQUARE CLOUD] SINCRONIZANDO ${rows.length} protocolos`);

    /**
     * PROCESSAMENTO DE DADOS JSON
     * 
     * Converte campos JSON armazenados como string de volta para objetos.
     * Tratamento robusto de erros de parsing.
     */
    const protocolos = rows.map(row => {
      try {
        return {
          ...row,
          // SQUARE CLOUD: Parse seguro de campos JSON
          documents: JSON.parse(row.documents || '[]'),
          guias: JSON.parse(row.guias || '[]'),
          activityLog: JSON.parse(row.activityLog || '[]'),
          // SQUARE CLOUD: Conversão de datas
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
          // SQUARE CLOUD: Conversão de booleans
          isFatal: Boolean(row.isFatal),
          needsProcuration: Boolean(row.needsProcuration),
          needsGuia: Boolean(row.needsGuia),
          isDistribution: Boolean(row.isDistribution)
        };
      } catch (parseError) {
        console.error('❌ [SQUARE CLOUD] Erro ao parsear protocolo:', row.id);
        // SQUARE CLOUD: Retornar dados seguros em caso de erro
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

    // SQUARE CLOUD: Log de estatísticas das filas
    console.log('✅ [SQUARE CLOUD] SINCRONIZAÇÃO COMPLETA');
    console.log(`🎯 [SQUARE CLOUD] Filas: Robô(${protocolos.filter(p => !p.assignedTo && p.status === 'Aguardando').length}) Carlos(${protocolos.filter(p => p.assignedTo === 'Carlos' && p.status === 'Aguardando').length}) Deyse(${protocolos.filter(p => p.assignedTo === 'Deyse' && p.status === 'Aguardando').length})`);
    
    res.json({
      success: true,
      protocolos,
      total: protocolos.length,
      timestamp: new Date().toISOString(),
      syncStatus: 'success',
      platform: 'Square Cloud'
    });
  } catch (error) {
    console.error('❌ [SQUARE CLOUD] ERRO DE SINCRONIZAÇÃO:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor (Square Cloud)',
      error: error.message,
      platform: 'Square Cloud'
    });
  }
});

/**
 * ENDPOINT: CRIAR NOVO PROTOCOLO
 * 
 * Cria um novo protocolo jurídico no sistema.
 * Processa documentos, guias e define fila automaticamente.
 * 
 * SQUARE CLOUD:
 * - Validação robusta de dados
 * - Processamento de arquivos base64
 * - Log detalhado de criação
 * - Tratamento de erros específico
 */
router.post('/protocolos', async (req, res) => {
  console.log('📝 [SQUARE CLOUD] POST /protocolos chamado');
  console.log('📍 [SQUARE CLOUD] Origin:', req.headers.origin);
  console.log('🔗 [SQUARE CLOUD] Referer:', req.headers.referer);
  console.log('🌍 [SQUARE CLOUD] Host:', req.headers.host);
  console.log('🔐 [SQUARE CLOUD] Headers de CORS:', {
    'access-control-request-method': req.headers['access-control-request-method'],
    'access-control-request-headers': req.headers['access-control-request-headers']
  });
  console.log('📦 [SQUARE CLOUD] Dados recebidos:', JSON.stringify(req.body, null, 2));
  
  // SQUARE CLOUD: Extrair dados do corpo da requisição
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

  /**
   * VALIDAÇÕES BÁSICAS PARA SQUARE CLOUD
   * 
   * Verifica se dados obrigatórios estão presentes.
   * Essencial para integridade dos dados.
   */
  if (!createdBy) {
    console.error('❌ [SQUARE CLOUD] createdBy é obrigatório');
    return res.status(400).json({
      success: false,
      message: 'ID do usuário criador é obrigatório (Square Cloud)'
    });
  }

  // SQUARE CLOUD: Gerar ID único para o protocolo
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();
  
  /**
   * CRIAÇÃO DO LOG INICIAL
   * 
   * Cria primeira entrada no log de atividades do protocolo.
   * Importante para auditoria e rastreamento.
   */
  const initialLog = [{
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: now,
    action: 'created',
    description: 'Protocolo criado na Square Cloud',
    performedBy: createdByEmail || 'Usuário'
  }];

  console.log('💾 [SQUARE CLOUD] Tentando inserir protocolo:');
  console.log('🆔 [SQUARE CLOUD] ID:', id);
  console.log('📋 [SQUARE CLOUD] Dados principais:', {
    processNumber: processNumber || 'N/A',
    court: court || 'N/A',
    system: system || 'N/A',
    status: status || 'Aguardando',
    assignedTo: assignedTo || 'null',
    createdBy,
    isDistribution: Boolean(isDistribution)
  });

  try {
    /**
     * PREPARAÇÃO DE DADOS PARA INSERÇÃO
     * 
     * Organiza todos os dados para inserção no SQLite.
     * Converte objetos para JSON e booleans para integers.
     */
    const insertData = [
      id,
      processNumber || '',
      court || '',
      system || '',
      jurisdiction || '',
      processType || 'civel',
      isFatal ? 1 : 0, // SQUARE CLOUD: Boolean para integer
      needsProcuration ? 1 : 0, // SQUARE CLOUD: Boolean para integer
      procurationType || '',
      needsGuia ? 1 : 0, // SQUARE CLOUD: Boolean para integer
      JSON.stringify(guias || []), // SQUARE CLOUD: Array para JSON string
      petitionType || '',
      observations || '',
      JSON.stringify(documents || []), // SQUARE CLOUD: Array para JSON string
      status || 'Aguardando',
      assignedTo || null,
      createdBy,
      isDistribution ? 1 : 0, // SQUARE CLOUD: Boolean para integer
      now,
      now,
      1, // SQUARE CLOUD: queuePosition padrão
      JSON.stringify(initialLog) // SQUARE CLOUD: Array para JSON string
    ];

    console.log('📊 [SQUARE CLOUD] Dados preparados para inserção:', insertData.map((item, index) => {
      const fields = [
        'id', 'processNumber', 'court', 'system', 'jurisdiction', 'processType',
        'isFatal', 'needsProcuration', 'procurationType', 'needsGuia', 'guias',
        'petitionType', 'observations', 'documents', 'status', 'assignedTo',
        'createdBy', 'isDistribution', 'createdAt', 'updatedAt', 'queuePosition', 'activityLog'
      ];
      return `${fields[index]}: ${item}`;
    }));

    /**
     * INSERÇÃO NO BANCO SQLITE
     * 
     * Query otimizada para inserção rápida.
     * Usa prepared statement para segurança.
     */
    const result = await query(`
      INSERT INTO protocolos (
        id, processNumber, court, system, jurisdiction, processType,
        isFatal, needsProcuration, procurationType, needsGuia, guias,
        petitionType, observations, documents, status, assignedTo,
        createdBy, isDistribution, createdAt, updatedAt, queuePosition, activityLog
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, insertData);

    console.log('🎉 [SQUARE CLOUD] PROTOCOLO CRIADO COM SUCESSO!');
    console.log('🆔 [SQUARE CLOUD] ID do protocolo:', id);
    console.log('📊 [SQUARE CLOUD] Linhas afetadas:', result.changes || 1);
    console.log('🎯 [SQUARE CLOUD] Protocolo direcionado para:', assignedTo || 'Fila do Robô');
    console.log('📋 [SQUARE CLOUD] Dados do protocolo criado:', {
      processNumber: processNumber || 'N/A',
      court: court || 'N/A',
      status: status || 'Aguardando',
      assignedTo: assignedTo || null
    });
    
    /**
     * VERIFICAÇÃO DE INSERÇÃO
     * 
     * Confirma que o protocolo foi inserido corretamente.
     * Importante para debugging na Square Cloud.
     */
    try {
      const countResult = await query('SELECT COUNT(*) as count FROM protocolos WHERE id = ?', [id]);
      const count = countResult.rows[0].count;
      console.log('✅ [SQUARE CLOUD] Verificação: protocolo existe no banco:', count > 0);
        
      // SQUARE CLOUD: Verificar contagem total após inserção
      const totalResult = await query('SELECT COUNT(*) as total FROM protocolos');
      const total = totalResult.rows[0].total;
      console.log('📊 [SQUARE CLOUD] Total de protocolos no banco após inserção:', total);
    } catch (countErr) {
      console.error('❌ [SQUARE CLOUD] Erro ao verificar inserção:', countErr);
    }

    /**
     * RETORNO DO PROTOCOLO CRIADO
     * 
     * Retorna objeto completo do protocolo para o frontend.
     * Inclui todos os dados processados.
     */
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
      activityLog: initialLog,
      platform: 'Square Cloud'
    };
    
    res.json({
      success: true,
      message: 'Protocolo criado com sucesso na Square Cloud',
      protocolo: createdProtocol,
      timestamp: new Date().toISOString(),
      platform: 'Square Cloud'
    });
  } catch (err) {
    console.error('❌ [SQUARE CLOUD] ERRO CRÍTICO ao inserir protocolo:', err);
    console.error('📋 [SQUARE CLOUD] SQL Error details:', err.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar protocolo na Square Cloud: ' + err.message,
      error: err.message,
      sqlError: true,
      platform: 'Square Cloud'
    });
  }
});

/**
 * ENDPOINT: ATUALIZAR PROTOCOLO
 * 
 * Atualiza dados de um protocolo existente.
 * Mantém log de atividades e histórico de mudanças.
 * 
 * SQUARE CLOUD:
 * - Query otimizada para atualização
 * - Preservação do log de atividades
 * - Validação de existência
 * - Tratamento robusto de erros
 */
router.put('/protocolos/:id', async (req, res) => {
  console.log('🔄 [SQUARE CLOUD] PUT /protocolos/:id chamado');
  console.log('🆔 [SQUARE CLOUD] ID:', req.params.id);
  console.log('📦 [SQUARE CLOUD] Updates:', JSON.stringify(req.body, null, 2));
  
  const { id } = req.params;
  const updates = req.body;
  const now = new Date().toISOString();

  try {
    /**
     * BUSCA DO PROTOCOLO ATUAL
     * 
     * Recupera dados atuais para preservar log de atividades.
     * Essencial para manter histórico completo.
     */
    const result = await query('SELECT * FROM protocolos WHERE id = ?', [id]);
    const row = result.rows && result.rows.length > 0 ? result.rows[0] : null;

    if (!row) {
      console.error('❌ [SQUARE CLOUD] Protocolo não encontrado para atualização:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Protocolo não encontrado (Square Cloud)' 
      });
    }

    console.log('📋 [SQUARE CLOUD] Protocolo encontrado para atualização:', {
      id: row.id,
      processNumber: row.processNumber,
      status: row.status
    });

    /**
     * PROCESSAMENTO DO LOG DE ATIVIDADES
     * 
     * Mantém log existente e adiciona nova entrada se fornecida.
     * Parse seguro do JSON armazenado.
     */
    let currentLog = [];
    try {
      currentLog = JSON.parse(row.activityLog || '[]');
    } catch (parseError) {
      console.error('❌ [SQUARE CLOUD] Erro ao parsear log existente:', parseError);
      currentLog = [];
    }

    // SQUARE CLOUD: Adicionar nova entrada ao log se fornecida
    if (updates.newLogEntry) {
      const newEntry = {
        ...updates.newLogEntry,
        timestamp: now,
        id: updates.newLogEntry.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9))
      };
      currentLog.push(newEntry);
      console.log('📝 [SQUARE CLOUD] Nova entrada de log adicionada:', newEntry);
    }

    /**
     * CONSTRUÇÃO DINÂMICA DA QUERY DE ATUALIZAÇÃO
     * 
     * Constrói query baseada nos campos fornecidos.
     * Converte tipos conforme necessário para SQLite.
     */
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (key !== 'newLogEntry' && key !== 'id') {
        fields.push(`${key} = ?`);
        
        // SQUARE CLOUD: Conversão de tipos para SQLite
        if (key === 'documents' || key === 'guias') {
          values.push(JSON.stringify(updates[key]));
        } else if (key === 'isFatal' || key === 'needsProcuration' || key === 'needsGuia' || key === 'isDistribution') {
          values.push(updates[key] ? 1 : 0);
        } else {
          values.push(updates[key]);
        }
      }
    });

    // SQUARE CLOUD: Sempre atualizar timestamp e log
    fields.push('updatedAt = ?', 'activityLog = ?');
    values.push(now, JSON.stringify(currentLog));
    values.push(id); // SQUARE CLOUD: WHERE clause parameter

    const updateQuery = `UPDATE protocolos SET ${fields.join(', ')} WHERE id = ?`;
    
    console.log('🔄 [SQUARE CLOUD] Query de atualização:', updateQuery);
    console.log('📊 [SQUARE CLOUD] Valores:', values);

    // SQUARE CLOUD: Executar atualização
    const updateResult = await query(updateQuery, values);
    const changes = updateResult.changes || 0;

    if (changes === 0) {
      console.error('❌ [SQUARE CLOUD] Nenhuma linha foi atualizada');
      return res.status(404).json({ 
        success: false, 
        message: 'Protocolo não encontrado ou nenhuma alteração feita (Square Cloud)' 
      });
    }

    console.log('✅ [SQUARE CLOUD] Protocolo atualizado com sucesso');
    console.log('📊 [SQUARE CLOUD] Linhas afetadas:', changes);
      
    res.json({
      success: true,
      message: 'Protocolo atualizado com sucesso na Square Cloud',
      changes: changes,
      timestamp: new Date().toISOString(),
      platform: 'Square Cloud'
    });
  } catch (err) {
    console.error('❌ [SQUARE CLOUD] Erro ao atualizar protocolo:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar protocolo na Square Cloud',
      error: err.message,
      platform: 'Square Cloud'
    });
  }
});

/**
 * ENDPOINT: DELETAR PROTOCOLO
 * 
 * Remove um protocolo do sistema.
 * Operação irreversível com logs de auditoria.
 * 
 * SQUARE CLOUD:
 * - Validação de existência
 * - Log de operação de deleção
 * - Confirmação de remoção
 */
router.delete('/protocolos/:id', async (req, res) => {
  console.log('🗑️ [SQUARE CLOUD] DELETE /protocolos/:id chamado');
  console.log('🆔 [SQUARE CLOUD] ID:', req.params.id);
  
  const { id } = req.params;

  try {
    // SQUARE CLOUD: Executar deleção
    const result = await query('DELETE FROM protocolos WHERE id = ?', [id]);
    const changes = result.changes || 0;

    if (changes === 0) {
      console.error('❌ [SQUARE CLOUD] Protocolo não encontrado para deleção:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Protocolo não encontrado (Square Cloud)' 
      });
    }

    console.log('✅ [SQUARE CLOUD] Protocolo deletado com sucesso');
    console.log('📊 [SQUARE CLOUD] Linhas afetadas:', changes);
    
    res.json({
      success: true,
      message: 'Protocolo deletado com sucesso na Square Cloud',
      changes: changes,
      timestamp: new Date().toISOString(),
      platform: 'Square Cloud'
    });
  } catch (err) {
    console.error('❌ [SQUARE CLOUD] Erro ao deletar protocolo:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao deletar protocolo na Square Cloud',
      error: err.message,
      platform: 'Square Cloud'
    });
  }
});

/**
 * ENDPOINT: TESTE DE CONECTIVIDADE
 * 
 * Verifica se o módulo de protocolos está funcionando.
 * Útil para debugging e monitoramento na Square Cloud.
 */
router.get('/protocolos/test', async (req, res) => {
  console.log('🧪 [SQUARE CLOUD] GET /protocolos/test chamado');
  
  try {
    // SQUARE CLOUD: Testar conexão com banco
    const result = await query('SELECT COUNT(*) as count FROM protocolos');
    const count = result.rows[0].count;
    
    console.log('✅ [SQUARE CLOUD] Teste de conectividade bem-sucedido');
    res.json({
      success: true,
      message: 'Conectividade com protocolos funcionando na Square Cloud',
      totalProtocols: count,
      timestamp: new Date().toISOString(),
      database: 'SQLite conectado na Square Cloud',
      server: 'Express rodando na Square Cloud',
      platform: 'Square Cloud'
    });
  } catch (err) {
    console.error('❌ [SQUARE CLOUD] Erro no teste de conectividade:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro de conectividade com banco de dados na Square Cloud',
      error: err.message,
      timestamp: new Date().toISOString(),
      platform: 'Square Cloud'
    });
  }
});

// SQUARE CLOUD: Exportar router para uso no servidor principal
export default router;