import express from 'express';
import { query } from './db.js';

const router = express.Router();

// Cache para funcionários
let funcionariosCache = null;
let cacheExpiry = 0;
const CACHE_DURATION = 30000; // 30 segundos

// Listar todos os funcionários
router.get('/funcionarios', async (req, res) => {
  const startTime = Date.now();
  console.log('👥 Buscando funcionários Railway...');
  
  try {
    // Verificar cache
    const now = Date.now();
    if (funcionariosCache && now < cacheExpiry) {
      console.log(`✅ Funcionários from cache Railway (${Date.now() - startTime}ms)`);
      return res.json({
        success: true,
        funcionarios: funcionariosCache,
        cached: true,
        duration: `${Date.now() - startTime}ms`
      });
    }

    // Buscar do banco Railway
    const result = await Promise.race([
      query("SELECT id, email, permissao, created_at, updated_at FROM funcionarios ORDER BY id"),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 8000)
      )
    ]);

    const funcionarios = result.rows || [];

    // Atualizar cache
    funcionariosCache = funcionarios;
    cacheExpiry = now + CACHE_DURATION;

    const duration = Date.now() - startTime;
    console.log(`✅ Funcionários loaded Railway: ${funcionarios.length} (${duration}ms)`);

    res.json({
      success: true,
      funcionarios: funcionarios,
      total: funcionarios.length,
      duration: `${duration}ms`
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao buscar funcionários Railway (${duration}ms):`, err);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor Railway',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      duration: `${duration}ms`
    });
  }
});

// Criar novo funcionário
router.post('/funcionarios', async (req, res) => {
  const startTime = Date.now();
  const { email, senha, permissao } = req.body;

  console.log('👤 Criando funcionário Railway:', email);

  if (!email || !senha || !permissao) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email, senha e permissão são obrigatórios' 
    });
  }

  try {
    // Verificar se email já existe
    const existingUser = await Promise.race([
      query("SELECT email FROM funcionarios WHERE email = $1", [email]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Check timeout')), 5000)
      )
    ]);

    if (existingUser.rows && existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email já está em uso' 
      });
    }

    // Inserir novo funcionário
    const result = await Promise.race([
      query(
        "INSERT INTO funcionarios (email, senha, permissao) VALUES ($1, $2, $3) RETURNING id, email, permissao, created_at",
        [email, senha, permissao]
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Insert timeout')), 8000)
      )
    ]);

    const newFuncionario = result.rows && result.rows[0] ? result.rows[0] : null;
    
    if (!newFuncionario) {
      throw new Error('Falha ao criar funcionário');
    }

    // Invalidar cache
    funcionariosCache = null;
    cacheExpiry = 0;

    const duration = Date.now() - startTime;
    console.log(`✅ Funcionário criado Railway: ${email} (${duration}ms)`);
    
    res.json({
      success: true,
      message: 'Funcionário criado com sucesso Railway',
      funcionario: newFuncionario,
      duration: `${duration}ms`
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao criar funcionário Railway (${duration}ms):`, err);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar funcionário Railway',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      duration: `${duration}ms`
    });
  }
});

// Atualizar funcionário
router.put('/funcionarios/:id', async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  const { email, senha, permissao } = req.body;

  console.log(`👤 Atualizando funcionário Railway: ${id}`);

  if (!email || !permissao) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email e permissão são obrigatórios' 
    });
  }

  try {
    // Verificar se email já existe em outro funcionário
    const existingUser = await Promise.race([
      query("SELECT id FROM funcionarios WHERE email = $1 AND id != $2", [email, id]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Check timeout')), 5000)
      )
    ]);

    if (existingUser.rows && existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email já está em uso por outro funcionário' 
      });
    }

    // Atualizar funcionário
    let updateQuery, params;
    
    if (senha) {
      updateQuery = "UPDATE funcionarios SET email = $1, senha = $2, permissao = $3 WHERE id = $4 RETURNING id, email, permissao, updated_at";
      params = [email, senha, permissao, id];
    } else {
      updateQuery = "UPDATE funcionarios SET email = $1, permissao = $2 WHERE id = $3 RETURNING id, email, permissao, updated_at";
      params = [email, permissao, id];
    }

    const result = await Promise.race([
      query(updateQuery, params),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Update timeout')), 8000)
      )
    ]);

    const changes = result.rowCount || 0;

    if (changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Funcionário não encontrado' 
      });
    }

    // Invalidar cache
    funcionariosCache = null;
    cacheExpiry = 0;

    const duration = Date.now() - startTime;
    console.log(`✅ Funcionário atualizado Railway: ${id} (${duration}ms)`);
    
    res.json({
      success: true,
      message: 'Funcionário atualizado com sucesso Railway',
      funcionario: result.rows[0],
      duration: `${duration}ms`
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao atualizar funcionário Railway (${duration}ms):`, err);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar funcionário Railway',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      duration: `${duration}ms`
    });
  }
});

// Deletar funcionário
router.delete('/funcionarios/:id', async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;

  console.log(`👤 Deletando funcionário Railway: ${id}`);

  try {
    // Verificar se funcionário tem protocolos
    const protocolsCheck = await query("SELECT COUNT(*) as count FROM protocolos WHERE created_by = $1", [id]);
    const protocolsCount = protocolsCheck.rows[0].count;

    if (protocolsCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Não é possível deletar funcionário com ${protocolsCount} protocolo(s) associado(s)` 
      });
    }

    const result = await Promise.race([
      query("DELETE FROM funcionarios WHERE id = $1", [id]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Delete timeout')), 8000)
      )
    ]);

    const changes = result.rowCount || 0;

    if (changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Funcionário não encontrado' 
      });
    }

    // Invalidar cache
    funcionariosCache = null;
    cacheExpiry = 0;

    const duration = Date.now() - startTime;
    console.log(`✅ Funcionário deletado Railway: ${id} (${duration}ms)`);
    
    res.json({
      success: true,
      message: 'Funcionário deletado com sucesso Railway',
      duration: `${duration}ms`
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao deletar funcionário Railway (${duration}ms):`, err);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao deletar funcionário Railway',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      duration: `${duration}ms`
    });
  }
});

// Estatísticas do sistema
router.get('/stats', async (req, res) => {
  const startTime = Date.now();
  console.log('📊 Buscando estatísticas Railway...');
  
  try {
    // Executar queries em paralelo
    const [
      funcionariosResult,
      protocolosResult,
      aguardandoResult,
      execucaoResult,
      peticionadoResult,
      devolvidoResult,
      canceladoResult
    ] = await Promise.all([
      query("SELECT COUNT(*) as count FROM funcionarios"),
      query("SELECT COUNT(*) as count FROM protocolos"),
      query("SELECT COUNT(*) as count FROM protocolos WHERE status = 'Aguardando'"),
      query("SELECT COUNT(*) as count FROM protocolos WHERE status = 'Em Execução'"),
      query("SELECT COUNT(*) as count FROM protocolos WHERE status = 'Peticionado'"),
      query("SELECT COUNT(*) as count FROM protocolos WHERE status = 'Devolvido'"),
      query("SELECT COUNT(*) as count FROM protocolos WHERE status = 'Cancelado'")
    ]);

    const stats = {
      funcionarios: {
        total: parseInt(funcionariosResult.rows[0].count)
      },
      protocolos: {
        total: parseInt(protocolosResult.rows[0].count),
        aguardando: parseInt(aguardandoResult.rows[0].count),
        execucao: parseInt(execucaoResult.rows[0].count),
        peticionado: parseInt(peticionadoResult.rows[0].count),
        devolvido: parseInt(devolvidoResult.rows[0].count),
        cancelado: parseInt(canceladoResult.rows[0].count)
      },
      database: {
        type: 'PostgreSQL Railway',
        environment: process.env.NODE_ENV || 'development',
        connectionString: process.env.DATABASE_URL ? 'Railway PostgreSQL Connected' : 'Local PostgreSQL'
      },
      timestamp: new Date().toISOString()
    };

    const duration = Date.now() - startTime;
    console.log(`✅ Estatísticas Railway loaded (${duration}ms)`);
    
    res.json({
      success: true,
      stats,
      duration: `${duration}ms`
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao buscar estatísticas Railway (${duration}ms):`, err);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar estatísticas Railway',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      duration: `${duration}ms`
    });
  }
});

// Endpoint para limpar cache
router.post('/clear-cache', (req, res) => {
  funcionariosCache = null;
  cacheExpiry = 0;
  
  res.json({
    success: true,
    message: 'Cache Railway de funcionários limpo com sucesso',
    timestamp: new Date().toISOString()
  });
});

export default router;