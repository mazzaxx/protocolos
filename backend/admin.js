import express from 'express';
import { query } from './db.js';

const router = express.Router();

// Listar todos os funcionários (apenas para admins)
router.get('/funcionarios', async (req, res) => {
  console.log('📋 GET /admin/funcionarios - Listando funcionários');
  
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

  if (!email || !senha || !permissao) {
    return res.status(400).json({
      success: false,
      message: 'Email, senha e permissão são obrigatórios'
    });
  }

  try {
    // Verificar se o email já existe
    const existingUser = await query(
      "SELECT email FROM funcionarios WHERE email = ?",
      [email]
    );
    
    if (existingUser.rows && existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email já está em uso'
      });
    }

    // Criar novo funcionário
    const result = await query(
      "INSERT INTO funcionarios (email, senha, permissao, equipe) VALUES (?, ?, ?, ?)",
      [email, senha, permissao, equipe || null]
    );

    console.log('✅ Funcionário criado com sucesso:', email);
    
    res.json({
      success: true,
      message: 'Funcionário criado com sucesso',
      funcionario: {
        id: result.insertId,
        email,
        permissao,
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

  if (!email || !permissao) {
    return res.status(400).json({
      success: false,
      message: 'Email e permissão são obrigatórios'
    });
  }

  try {
    // Verificar se o funcionário existe
    const existingUser = await query(
      "SELECT * FROM funcionarios WHERE id = ?",
      [id]
    );
    
    if (!existingUser.rows || existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado'
      });
    }

    // Verificar se o email já está em uso por outro usuário
    const emailCheck = await query(
      "SELECT id FROM funcionarios WHERE email = ? AND id != ?",
      [email, id]
    );
    
    if (emailCheck.rows && emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email já está em uso por outro funcionário'
      });
    }

    // Preparar query de atualização
    let updateQuery = "UPDATE funcionarios SET email = ?, permissao = ?, equipe = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    let params = [email, permissao, equipe || null, id];

    // Se senha foi fornecida, incluir na atualização
    if (senha && senha.trim()) {
      updateQuery = "UPDATE funcionarios SET email = ?, senha = ?, permissao = ?, equipe = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
      params = [email, senha, permissao, equipe || null, id];
    }

    const result = await query(updateQuery, params);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado ou nenhuma alteração feita'
      });
    }

    console.log('✅ Funcionário atualizado com sucesso:', email);
    
    res.json({
      success: true,
      message: 'Funcionário atualizado com sucesso',
      funcionario: {
        id: parseInt(id),
        email,
        permissao,
        equipe: equipe || null
      }
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
    // Verificar se o funcionário existe
    const existingUser = await query(
      "SELECT email FROM funcionarios WHERE id = ?",
      [id]
    );
    
    if (!existingUser.rows || existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado'
      });
    }

    const email = existingUser.rows[0].email;

    // Deletar funcionário
    const result = await query(
      "DELETE FROM funcionarios WHERE id = ?",
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado'
      });
    }

    console.log('✅ Funcionário deletado com sucesso:', email);
    
    res.json({
      success: true,
      message: 'Funcionário deletado com sucesso'
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

// Obter estatísticas do sistema
router.get('/stats', async (req, res) => {
  console.log('📊 GET /admin/stats - Obtendo estatísticas');
  
  try {
    // Estatísticas de funcionários
    const funcionariosResult = await query("SELECT COUNT(*) as count FROM funcionarios");
    const funcionariosPorPermissao = await query(`
      SELECT permissao, COUNT(*) as count 
      FROM funcionarios 
      GROUP BY permissao
    `);

    // Estatísticas de funcionários por equipe (usando a tabela de equipes)
    const funcionariosPorEquipe = await query(`
      SELECT 
        e.nome as equipe, 
        COUNT(f.id) as count 
      FROM equipes e
      LEFT JOIN funcionarios f ON e.nome = f.equipe
      GROUP BY e.nome
      ORDER BY e.nome
    `);

    // Estatísticas de protocolos
    const protocolosResult = await query("SELECT COUNT(*) as count FROM protocolos");
    const protocolosPorStatus = await query(`
      SELECT status, COUNT(*) as count 
      FROM protocolos 
      GROUP BY status
    `);
    const protocolosPorFila = await query(`
      SELECT 
        CASE 
          WHEN assignedTo IS NULL THEN 'Robô'
          ELSE assignedTo
        END as fila,
        COUNT(*) as count 
      FROM protocolos 
      WHERE status = 'Aguardando'
      GROUP BY assignedTo
    `);

    const stats = {
      funcionarios: {
        total: funcionariosResult.rows[0].count,
        porPermissao: funcionariosPorPermissao.rows || [],
        porEquipe: funcionariosPorEquipe.rows || []
      },
      protocolos: {
        total: protocolosResult.rows[0].count,
        porStatus: protocolosPorStatus.rows || [],
        porFila: protocolosPorFila.rows || []
      }
    };

    console.log('✅ Estatísticas obtidas com sucesso');
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter estatísticas',
      error: error.message
    });
  }
});

// Buscar funcionário por ID
router.get('/funcionarios/:id', async (req, res) => {
  console.log('🔍 GET /admin/funcionarios/:id - Buscando funcionário');
  
  const { id } = req.params;

  try {
    const result = await query(
      "SELECT id, email, permissao, equipe, created_at, updated_at FROM funcionarios WHERE id = ?",
      [id]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado'
      });
    }

    const funcionario = result.rows[0];
    console.log('✅ Funcionário encontrado:', funcionario.email);
    
    res.json({
      success: true,
      funcionario
    });
  } catch (error) {
    console.error('❌ Erro ao buscar funcionário:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar funcionário',
      error: error.message
    });
  }
});

// Rota de teste para verificar se as rotas admin estão funcionando
router.get('/test', (req, res) => {
  console.log('🧪 GET /admin/test - Teste das rotas administrativas');
  
  res.json({
    success: true,
    message: 'Rotas administrativas funcionando corretamente',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /admin/funcionarios - Listar funcionários',
      'POST /admin/funcionarios - Criar funcionário',
      'PUT /admin/funcionarios/:id - Atualizar funcionário',
      'DELETE /admin/funcionarios/:id - Deletar funcionário',
      'GET /admin/funcionarios/:id - Buscar funcionário por ID',
      'GET /admin/stats - Obter estatísticas',
      'GET /admin/test - Teste das rotas'
    ]
  });
});

// Gerar relatório por período
router.post('/relatorio', async (req, res) => {
  console.log('📊 POST /admin/relatorio - Gerando relatório');
  
  const { dataInicio, dataFim } = req.body;

  if (!dataInicio || !dataFim) {
    return res.status(400).json({
      success: false,
      message: 'Data de início e fim são obrigatórias'
    });
  }

  try {
    // Converter datas para formato SQLite
    const inicio = new Date(dataInicio).toISOString();
    const fim = new Date(dataFim + 'T23:59:59').toISOString();
    
    console.log('📅 Período do relatório:', { inicio, fim });

    // Buscar protocolos do período
    const protocolosResult = await query(`
      SELECT 
        p.*,
        f.email as createdByEmail,
        f.equipe as createdByEquipe
      FROM protocolos p
      LEFT JOIN funcionarios f ON p.createdBy = f.id
      WHERE p.createdAt BETWEEN ? AND ?
      ORDER BY p.createdAt DESC
    `, [inicio, fim]);

    const protocolos = protocolosResult.rows || [];
    
    // Estatísticas gerais
    const totalProtocolos = protocolos.length;
    const fatais = protocolos.filter(p => p.isFatal).length;
    const trabalhistas = protocolos.filter(p => p.processType === 'trabalhista').length;
    const civeis = protocolos.filter(p => p.processType === 'civel').length;
    const distribuicoes = protocolos.filter(p => p.isDistribution).length;
    
    // Estatísticas por status
    const porStatus = {};
    protocolos.forEach(p => {
      porStatus[p.status] = (porStatus[p.status] || 0) + 1;
    });
    
    // Estatísticas por equipe
    const porEquipe = {};
    protocolos.forEach(p => {
      const equipe = p.createdByEquipe || 'Sem equipe';
      porEquipe[equipe] = (porEquipe[equipe] || 0) + 1;
    });
    
    // Estatísticas por tribunal
    const porTribunal = {};
    protocolos.forEach(p => {
      const tribunal = p.court || 'Não especificado';
      porTribunal[tribunal] = (porTribunal[tribunal] || 0) + 1;
    });
    
    // Estatísticas por sistema
    const porSistema = {};
    protocolos.forEach(p => {
      const sistema = p.system || 'Não especificado';
      porSistema[sistema] = (porSistema[sistema] || 0) + 1;
    });

    const relatorio = {
      periodo: {
        inicio: dataInicio,
        fim: dataFim
      },
      resumo: {
        totalProtocolos,
        fatais,
        trabalhistas,
        civeis,
        distribuicoes,
        normais: totalProtocolos - fatais - distribuicoes
      },
      detalhes: {
        porStatus,
        porEquipe,
        porTribunal,
        porSistema
      },
      protocolos: protocolos.map(p => ({
        id: p.id,
        processNumber: p.processNumber,
        court: p.court,
        system: p.system,
        processType: p.processType,
        isFatal: Boolean(p.isFatal),
        isDistribution: Boolean(p.isDistribution),
        status: p.status,
        createdAt: p.createdAt,
        createdByEmail: p.createdByEmail,
        createdByEquipe: p.createdByEquipe
      }))
    };

    console.log('✅ Relatório gerado com sucesso');
    console.log('📊 Resumo:', relatorio.resumo);
    
    res.json({
      success: true,
      relatorio
    });
  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao gerar relatório',
      error: error.message
    });
  }
});

export default router;