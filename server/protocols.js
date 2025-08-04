import express from 'express';
import { query } from './db.js';

const router = express.Router();

// Cache para protocolos
let protocolsCache = null;
let cacheExpiry = 0;
const CACHE_DURATION = 2000; // 2 segundos

// Função para converter snake_case para camelCase
const toCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

// Listar todos os protocolos
router.get('/protocolos', async (req, res) => {
  const startTime = Date.now();
  console.log('🔍 Buscando protocolos Railway...');
  
  try {
    // Verificar cache
    const now = Date.now();
    if (protocolsCache && now < cacheExpiry) {
      console.log(`✅ Protocolos from cache Railway (${Date.now() - startTime}ms)`);
      return res.json({
        success: true,
        protocolos: protocolsCache,
        total: protocolsCache.length,
        timestamp: new Date().toISOString(),
        cached: true,
        duration: `${Date.now() - startTime}ms`
      });
    }

    // Buscar do banco Railway
    const result = await Promise.race([
      query(`
        SELECT 
          p.*,
          f.email as created_by_email
        FROM protocolos p 
        LEFT JOIN funcionarios f ON p.created_by = f.id 
        ORDER BY p.created_at DESC
        LIMIT 1000
      `),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 10000)
      )
    ]);

    const rows = result.rows || [];
    console.log(`📊 Found ${rows.length} protocolos Railway`);

    // Converter e processar dados
    const protocolos = rows.map(row => {
      try {
        const protocol = toCamelCase(row);
        
        // Processar campos JSON
        protocol.documents = typeof protocol.documents === 'string' 
          ? JSON.parse(protocol.documents) 
          : protocol.documents || [];
        protocol.guias = typeof protocol.guias === 'string' 
          ? JSON.parse(protocol.guias) 
          : protocol.guias || [];
        protocol.activityLog = typeof protocol.activityLog === 'string' 
          ? JSON.parse(protocol.activityLog) 
          : protocol.activityLog || [];

        // Converter datas
        protocol.createdAt = new Date(protocol.createdAt);
        protocol.updatedAt = new Date(protocol.updatedAt);

        // Converter booleans
        protocol.isFatal = Boolean(protocol.isFatal);
        protocol.needsProcuration = Boolean(protocol.needsProcuration);
        protocol.needsGuia = Boolean(protocol.needsGuia);
        protocol.isDistribution = Boolean(protocol.isDistribution);

        return protocol;
      } catch (parseError) {
        console.error('❌ Erro ao processar protocolo Railway:', row.id, parseError);
        return null;
      }
    }).filter(Boolean);

    // Atualizar cache
    protocolsCache = protocolos;
    cacheExpiry = now + CACHE_DURATION;

    const duration = Date.now() - startTime;
    console.log(`✅ Protocolos loaded Railway (${duration}ms)`);
    
    res.json({
      success: true,
      protocolos,
      total: protocolos.length,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao buscar protocolos Railway (${duration}ms):`, error);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor Railway',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      duration: `${duration}ms`
    });
  }
});

// Criar novo protocolo
router.post('/protocolos', async (req, res) => {
  const startTime = Date.now();
  console.log('📝 Criando protocolo Railway...');
  
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

  if (!createdBy) {
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

  try {
    // Preparar dados para inserção
    const insertData = [
      id,
      processNumber || '',
      court || '',
      system || '',
      jurisdiction || '',
      processType || 'civel',
      Boolean(isFatal),
      Boolean(needsProcuration),
      procurationType || '',
      Boolean(needsGuia),
      JSON.stringify(guias || []),
      petitionType || '',
      observations || '',
      JSON.stringify(documents || []),
      status || 'Aguardando',
      assignedTo || null,
      createdBy,
      Boolean(isDistribution),
      now,
      now,
      1,
      JSON.stringify(initialLog)
    ];

    const result = await Promise.race([
      query(`
        INSERT INTO protocolos (
          id, process_number, court, system, jurisdiction, process_type,
          is_fatal, needs_procuration, procuration_type, needs_guia, guias,
          petition_type, observations, documents, status, assigned_to,
          created_by, is_distribution, created_at, updated_at, queue_position, activity_log
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING id
      `, insertData),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Insert timeout')), 15000)
      )
    ]);

    // Invalidar cache
    protocolsCache = null;
    cacheExpiry = 0;

    const duration = Date.now() - startTime;
    console.log(`🎉 Protocolo criado Railway: ${id} (${duration}ms)`);
    
    // Retornar protocolo criado
    const createdProtocol = toCamelCase({
      id,
      process_number: processNumber || '',
      court: court || '',
      system: system || '',
      jurisdiction: jurisdiction || '',
      process_type: processType || 'civel',
      is_fatal: Boolean(isFatal),
      needs_procuration: Boolean(needsProcuration),
      procuration_type: procurationType || '',
      needs_guia: Boolean(needsGuia),
      guias: guias || [],
      petition_type: petitionType || '',
      observations: observations || '',
      documents: documents || [],
      status: status || 'Aguardando',
      assigned_to: assignedTo || null,
      created_by: createdBy,
      is_distribution: Boolean(isDistribution),
      created_at: new Date(now),
      updated_at: new Date(now),
      queue_position: 1,
      activity_log: initialLog
    });
    
    res.json({
      success: true,
      message: 'Protocolo criado com sucesso Railway',
      protocolo: createdProtocol,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao criar protocolo Railway (${duration}ms):`, err);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar protocolo Railway',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      duration: `${duration}ms`
    });
  }
});

// Atualizar protocolo
router.put('/protocolos/:id', async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  const updates = req.body;
  const now = new Date().toISOString();

  console.log(`🔄 Atualizando protocolo Railway: ${id}`);

  try {
    // Buscar protocolo atual
    const currentResult = await query('SELECT * FROM protocolos WHERE id = $1', [id]);
    const currentRow = currentResult.rows && currentResult.rows.length > 0 ? currentResult.rows[0] : null;

    if (!currentRow) {
      return res.status(404).json({ 
        success: false, 
        message: 'Protocolo não encontrado' 
      });
    }

    // Processar log de atividades
    let currentLog = [];
    try {
      currentLog = typeof currentRow.activity_log === 'string' 
        ? JSON.parse(currentRow.activity_log) 
        : currentRow.activity_log || [];
    } catch (parseError) {
      console.error('❌ Erro ao parsear log Railway:', parseError);
      currentLog = [];
    }

    if (updates.newLogEntry) {
      const newEntry = {
        ...updates.newLogEntry,
        timestamp: now,
        id: updates.newLogEntry.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9))
      };
      currentLog.push(newEntry);
    }

    // Construir query de atualização
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (key !== 'newLogEntry' && key !== 'id') {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramIndex}`);
        paramIndex++;
        
        if (key === 'documents' || key === 'guias') {
          values.push(JSON.stringify(updates[key]));
        } else if (key === 'isFatal' || key === 'needsProcuration' || key === 'needsGuia' || key === 'isDistribution') {
          values.push(Boolean(updates[key]));
        } else {
          values.push(updates[key]);
        }
      }
    });

    // Sempre atualizar updated_at e activity_log
    fields.push(`updated_at = $${paramIndex}`, `activity_log = $${paramIndex + 1}`);
    values.push(now, JSON.stringify(currentLog));
    values.push(id);

    const updateQuery = `UPDATE protocolos SET ${fields.join(', ')} WHERE id = $${values.length}`;
    
    const updateResult = await Promise.race([
      query(updateQuery, values),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Update timeout')), 10000)
      )
    ]);

    const changes = updateResult.rowCount || 0;

    if (changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Protocolo não encontrado ou nenhuma alteração feita' 
      });
    }

    // Invalidar cache
    protocolsCache = null;
    cacheExpiry = 0;

    const duration = Date.now() - startTime;
    console.log(`✅ Protocolo atualizado Railway: ${id} (${duration}ms)`);
      
    res.json({
      success: true,
      message: 'Protocolo atualizado com sucesso Railway',
      changes: changes,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao atualizar protocolo Railway (${duration}ms):`, err);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar protocolo Railway',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      duration: `${duration}ms`
    });
  }
});

// Deletar protocolo
router.delete('/protocolos/:id', async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;

  console.log(`🗑️ Deletando protocolo Railway: ${id}`);
  
  try {
    const result = await Promise.race([
      query('DELETE FROM protocolos WHERE id = $1', [id]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Delete timeout')), 8000)
      )
    ]);

    const changes = result.rowCount || 0;

    if (changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Protocolo não encontrado' 
      });
    }

    // Invalidar cache
    protocolsCache = null;
    cacheExpiry = 0;

    const duration = Date.now() - startTime;
    console.log(`✅ Protocolo deletado Railway: ${id} (${duration}ms)`);
    
    res.json({
      success: true,
      message: 'Protocolo deletado com sucesso Railway',
      changes: changes,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao deletar protocolo Railway (${duration}ms):`, err);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao deletar protocolo Railway',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      duration: `${duration}ms`
    });
  }
});

// Rota de teste
router.get('/protocolos/test', async (req, res) => {
  const startTime = Date.now();
  console.log('🧪 Teste de conectividade Railway...');
  
  try {
    const result = await Promise.race([
      query('SELECT COUNT(*) as count FROM protocolos'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), 5000)
      )
    ]);

    const count = result.rows[0].count;
    const duration = Date.now() - startTime;
    
    console.log(`✅ Teste Railway OK (${duration}ms)`);
    
    res.json({
      success: true,
      message: 'Conectividade Railway com protocolos funcionando',
      totalProtocols: count,
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL Railway conectado',
      server: 'Express rodando',
      duration: `${duration}ms`
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Teste Railway falhou (${duration}ms):`, err);
    
    return res.status(500).json({
      success: false,
      message: 'Erro de conectividade Railway com banco de dados',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    });
  }
});

// Endpoint para limpar cache
router.post('/protocolos/clear-cache', (req, res) => {
  protocolsCache = null;
  cacheExpiry = 0;
  
  res.json({
    success: true,
    message: 'Cache Railway limpo com sucesso',
    timestamp: new Date().toISOString()
  });
});

export default router;