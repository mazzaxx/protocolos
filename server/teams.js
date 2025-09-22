import express from 'express';
import { query } from './db.js';

const router = express.Router();

// Listar todas as equipes
router.get('/equipes', async (req, res) => {
  console.log('📋 GET /admin/equipes - Listando equipes');
  
  try {
    // Buscar equipes únicas dos funcionários
    const result = await query(`
      SELECT DISTINCT equipe as nome, COUNT(*) as membros
      FROM funcionarios 
      WHERE equipe IS NOT NULL AND equipe != ''
      GROUP BY equipe
      ORDER BY equipe
    `);

    const equipes = result.rows || [];
    console.log(`✅ ${equipes.length} equipes encontradas`);

    res.json({
      success: true,
      equipes,
      total: equipes.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar equipes:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Criar nova equipe
router.post('/equipes', async (req, res) => {
  console.log('➕ POST /admin/equipes - Criando equipe');
  
  const { nome } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Nome da equipe é obrigatório'
    });
  }

  try {
    // Verificar se a equipe já existe
    const existingTeam = await query(
      "SELECT COUNT(*) as count FROM funcionarios WHERE equipe = ?",
      [nome.trim()]
    );
    
    if (existingTeam.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Equipe já existe'
      });
    }

    console.log('✅ Equipe validada para criação:', nome.trim());
    
    res.json({
      success: true,
      message: 'Equipe criada com sucesso (será visível quando funcionários forem atribuídos)',
      equipe: {
        nome: nome.trim(),
        membros: 0
      }
    });
  } catch (error) {
    console.error('❌ Erro ao criar equipe:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar equipe',
      error: error.message
    });
  }
});

// Renomear equipe
router.put('/equipes/:nomeAntigo', async (req, res) => {
  console.log('✏️ PUT /admin/equipes/:nomeAntigo - Renomeando equipe');
  
  const { nomeAntigo } = req.params;
  const { nomeNovo } = req.body;

  if (!nomeNovo || !nomeNovo.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Novo nome da equipe é obrigatório'
    });
  }

  try {
    // Verificar se a equipe antiga existe
    const existingTeam = await query(
      "SELECT COUNT(*) as count FROM funcionarios WHERE equipe = ?",
      [decodeURIComponent(nomeAntigo)]
    );
    
    if (existingTeam.rows[0].count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipe não encontrada'
      });
    }

    // Verificar se o novo nome já existe
    const newTeamExists = await query(
      "SELECT COUNT(*) as count FROM funcionarios WHERE equipe = ?",
      [nomeNovo.trim()]
    );
    
    if (newTeamExists.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma equipe com este nome'
      });
    }

    // Atualizar todos os funcionários da equipe
    const result = await query(
      "UPDATE funcionarios SET equipe = ?, updated_at = CURRENT_TIMESTAMP WHERE equipe = ?",
      [nomeNovo.trim(), decodeURIComponent(nomeAntigo)]
    );

    console.log('✅ Equipe renomeada com sucesso:', `${nomeAntigo} -> ${nomeNovo.trim()}`);
    console.log('📊 Funcionários atualizados:', result.changes);
    
    res.json({
      success: true,
      message: 'Equipe renomeada com sucesso',
      funcionariosAtualizados: result.changes,
      equipe: {
        nomeAntigo: decodeURIComponent(nomeAntigo),
        nomeNovo: nomeNovo.trim()
      }
    });
  } catch (error) {
    console.error('❌ Erro ao renomear equipe:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao renomear equipe',
      error: error.message
    });
  }
});

// Deletar equipe (remove a equipe de todos os funcionários)
router.delete('/equipes/:nome', async (req, res) => {
  console.log('🗑️ DELETE /admin/equipes/:nome - Deletando equipe');
  
  const { nome } = req.params;

  try {
    // Verificar se a equipe existe
    const existingTeam = await query(
      "SELECT COUNT(*) as count FROM funcionarios WHERE equipe = ?",
      [decodeURIComponent(nome)]
    );
    
    if (existingTeam.rows[0].count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipe não encontrada'
      });
    }

    const membrosCount = existingTeam.rows[0].count;

    // Remover a equipe de todos os funcionários (definir como NULL)
    const result = await query(
      "UPDATE funcionarios SET equipe = NULL, updated_at = CURRENT_TIMESTAMP WHERE equipe = ?",
      [decodeURIComponent(nome)]
    );

    console.log('✅ Equipe deletada com sucesso:', nome);
    console.log('📊 Funcionários atualizados:', result.changes);
    
    res.json({
      success: true,
      message: 'Equipe deletada com sucesso',
      funcionariosAtualizados: result.changes,
      membrosAntes: membrosCount
    });
  } catch (error) {
    console.error('❌ Erro ao deletar equipe:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao deletar equipe',
      error: error.message
    });
  }
});

// Limpar protocolos finalizados
router.delete('/protocolos/finalizados', async (req, res) => {
  console.log('🧹 DELETE /admin/protocolos/finalizados - Limpando protocolos finalizados');
  
  try {
    // Contar protocolos que serão removidos
    const countResult = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Peticionado' THEN 1 ELSE 0 END) as peticionados,
        SUM(CASE WHEN status = 'Cancelado' THEN 1 ELSE 0 END) as cancelados,
        SUM(CASE WHEN status = 'Devolvido' THEN 1 ELSE 0 END) as devolvidos
      FROM protocolos 
      WHERE status IN ('Peticionado', 'Cancelado', 'Devolvido')
    `);

    const counts = countResult.rows[0];
    
    if (counts.total === 0) {
      return res.json({
        success: true,
        message: 'Nenhum protocolo finalizado encontrado para limpeza',
        removidos: {
          total: 0,
          peticionados: 0,
          cancelados: 0,
          devolvidos: 0
        }
      });
    }

    // Remover protocolos finalizados
    const deleteResult = await query(`
      DELETE FROM protocolos 
      WHERE status IN ('Peticionado', 'Cancelado', 'Devolvido')
    `);

    console.log('✅ Limpeza de protocolos concluída');
    console.log('📊 Protocolos removidos:', {
      total: counts.total,
      peticionados: counts.peticionados,
      cancelados: counts.cancelados,
      devolvidos: counts.devolvidos
    });
    
    res.json({
      success: true,
      message: 'Protocolos finalizados removidos com sucesso',
      removidos: {
        total: parseInt(counts.total),
        peticionados: parseInt(counts.peticionados),
        cancelados: parseInt(counts.cancelados),
        devolvidos: parseInt(counts.devolvidos)
      }
    });
  } catch (error) {
    console.error('❌ Erro ao limpar protocolos:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao limpar protocolos finalizados',
      error: error.message
    });
  }
});

// Estatísticas de limpeza (preview do que será removido)
router.get('/protocolos/finalizados/preview', async (req, res) => {
  console.log('👁️ GET /admin/protocolos/finalizados/preview - Preview de limpeza');
  
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Peticionado' THEN 1 ELSE 0 END) as peticionados,
        SUM(CASE WHEN status = 'Cancelado' THEN 1 ELSE 0 END) as cancelados,
        SUM(CASE WHEN status = 'Devolvido' THEN 1 ELSE 0 END) as devolvidos,
        MIN(createdAt) as maisAntigo,
        MAX(createdAt) as maisRecente
      FROM protocolos 
      WHERE status IN ('Peticionado', 'Cancelado', 'Devolvido')
    `);

    const preview = result.rows[0];
    
    res.json({
      success: true,
      preview: {
        total: parseInt(preview.total),
        peticionados: parseInt(preview.peticionados),
        cancelados: parseInt(preview.cancelados),
        devolvidos: parseInt(preview.devolvidos),
        maisAntigo: preview.maisAntigo,
        maisRecente: preview.maisRecente
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter preview:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter preview de limpeza',
      error: error.message
    });
  }
});

export default router;