import express from 'express';
import { query } from './db.js';

const router = express.Router();

// Listar todos os funcionários
router.get('/funcionarios', async (req, res) => {
  console.log('👥 GET /admin/funcionarios - Listando funcionários');
  
  try {
    const result = await query(`
      SELECT id, email, permissao, equipe, created_at, updated_at 
      FROM funcionarios 
      ORDER BY created_at DESC
    `);

    const funcionarios = result.rows || [];
    console.log(`✅ ${funcionarios.length} funcionários encontrados`);

    res.json({
      success: true,
      funcionarios,
      total: funcionarios.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar funcionários:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Criar novo funcionário
router.post('/funcionarios', async (req, res) => {
  console.log('➕ POST /admin/funcionarios - Criando funcionário');
  
  const { email, senha, permissao, equipe } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      success: false,
      message: 'Email e senha são obrigatórios'
    });
  }

  try {
    // Verificar se o email já existe
    const existingUser = await query(
      "SELECT email FROM funcionarios WHERE email = ?",
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email já está em uso'
      });
    }

    const result = await query(
      "INSERT INTO funcionarios (email, senha, permissao, equipe) VALUES (?, ?, ?, ?)",
      [email, senha, permissao || 'advogado', equipe || null]
    );

    console.log('✅ Funcionário criado com sucesso:', email);
    
    res.json({
      success: true,
      message: 'Funcionário criado com sucesso',
      funcionario: {
        id: result.insertId,
        email,
        permissao: permissao || 'advogado',
        equipe: equipe || null
      }
    });
  } catch (error) {
    console.error('❌ Erro ao criar funcionário:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar funcionário',
      error: error.message
    });
  }
});

// Atualizar funcionário
router.put('/funcionarios/:id', async (req, res) => {
  console.log('✏️ PUT /admin/funcionarios/:id - Atualizando funcionário');
  
  const { id } = req.params;
  const { email, senha, permissao, equipe } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email é obrigatório'
    });
  }

  try {
    // Verificar se o funcionário existe
    const existingUser = await query(
      "SELECT * FROM funcionarios WHERE id = ?",
      [id]
    );
    
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado'
      });
    }

    // Verificar se o email já está em uso por outro funcionário
    const emailCheck = await query(
      "SELECT id FROM funcionarios WHERE email = ? AND id != ?",
      [email, id]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email já está em uso por outro funcionário'
      });
    }

    // Preparar query de atualização
    let updateQuery = "UPDATE funcionarios SET email = ?, permissao = ?, equipe = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    let updateParams = [email, permissao || 'advogado', equipe || null, id];

    // Se senha foi fornecida, incluir na atualização
    if (senha && senha.trim()) {
      updateQuery = "UPDATE funcionarios SET email = ?, senha = ?, permissao = ?, equipe = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
      updateParams = [email, senha, permissao || 'advogado', equipe || null, id];
    }

    const result = await query(updateQuery, updateParams);

    console.log('✅ Funcionário atualizado com sucesso:', email);
    
    res.json({
      success: true,
      message: 'Funcionário atualizado com sucesso',
      changes: result.changes
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar funcionário:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar funcionário',
      error: error.message
    });
  }
});

// Deletar funcionário
router.delete('/funcionarios/:id', async (req, res) => {
  console.log('🗑️ DELETE /admin/funcionarios/:id - Deletando funcionário');
  
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM funcionarios WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado'
      });
    }

    console.log('✅ Funcionário deletado com sucesso');
    
    res.json({
      success: true,
      message: 'Funcionário deletado com sucesso',
      changes: result.changes
    });
  } catch (error) {
    console.error('❌ Erro ao deletar funcionário:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao deletar funcionário',
      error: error.message
    });
  }
});

// Estatísticas administrativas
router.get('/stats', async (req, res) => {
  console.log('📊 GET /admin/stats - Carregando estatísticas');
  
  try {
    // Estatísticas de funcionários
    const funcionariosTotal = await query('SELECT COUNT(*) as count FROM funcionarios');
    const funcionariosPorPermissao = await query(`
      SELECT permissao, COUNT(*) as count 
      FROM funcionarios 
      GROUP BY permissao
    `);

    // Estatísticas de protocolos
    const protocolosTotal = await query('SELECT COUNT(*) as count FROM protocolos');
    const protocolosPorStatus = await query(`
      SELECT status, COUNT(*) as count 
      FROM protocolos 
      GROUP BY status
    `);
    
    const protocolosPorFila = await query(`
      SELECT 
        CASE 
          WHEN assignedTo IS NULL THEN 'Robô'
          WHEN assignedTo = 'Carlos' THEN 'Carlos'
          WHEN assignedTo = 'Deyse' THEN 'Deyse'
          ELSE 'Outros'
        END as fila,
        COUNT(*) as count
      FROM protocolos 
      WHERE status = 'Aguardando'
      GROUP BY assignedTo
    `);

    const stats = {
      funcionarios: {
        total: funcionariosTotal.rows[0].count,
        porPermissao: funcionariosPorPermissao.rows || []
      },
      protocolos: {
        total: protocolosTotal.rows[0].count,
        porStatus: protocolosPorStatus.rows || [],
        porFila: protocolosPorFila.rows || []
      }
    };

    console.log('✅ Estatísticas carregadas:', stats);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Erro ao carregar estatísticas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao carregar estatísticas',
      error: error.message
    });
  }
});

export default router;