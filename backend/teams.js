import express from 'express';
import { query } from './db.js';

const router = express.Router();

// Listar todas as equipes
router.get('/equipes', async (req, res) => {
  console.log('📋 GET /admin/equipes - Listando equipes');
  
  try {
    // Buscar equipes dos funcionários + equipes temporárias
    const result = await query(`
      SELECT nome, COALESCE(membros, 0) as membros
      FROM (
        SELECT DISTINCT equipe as nome, COUNT(*) as membros
        FROM funcionarios 
        WHERE equipe IS NOT NULL AND equipe != ''
        GROUP BY equipe
        
        UNION
        
        SELECT nome, 0 as membros
        FROM equipes_temp
        WHERE nome NOT IN (
          SELECT DISTINCT equipe 
          FROM funcionarios 
          WHERE equipe IS NOT NULL AND equipe != ''
        )
      )
      ORDER BY nome
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

    // Criar uma entrada temporária para a equipe (será removida quando funcionários forem atribuídos)
    // Isso garante que a equipe apareça na lista mesmo sem funcionários
    await query(
      "INSERT OR IGNORE INTO equipes_temp (nome, created_at) VALUES (?, CURRENT_TIMESTAMP)",
      [nome.trim()]
    );

    console.log('✅ Equipe validada para criação:', nome.trim());
    
    res.json({
      success: true,
      message: 'Equipe criada com sucesso',
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
    const nomeDecoded = decodeURIComponent(nome);
    
    // Verificar se a equipe existe
    const existingTeamInFuncionarios = await query(
      "SELECT COUNT(*) as count FROM funcionarios WHERE equipe = ?",
      [nomeDecoded]
    );
    
    const existingTeamTemp = await query(
      "SELECT COUNT(*) as count FROM equipes_temp WHERE nome = ?",
      [nomeDecoded]
    );
    
    const membrosCount = existingTeamInFuncionarios.rows[0].count;
    const existsInTemp = existingTeamTemp.rows[0].count > 0;
    
    if (membrosCount === 0 && !existsInTemp) {
      return res.status(404).json({
        success: false,
        message: 'Equipe não encontrada'
      });
    }

    let funcionariosAtualizados = 0;

    // Remover a equipe de todos os funcionários (se houver)
    if (membrosCount > 0) {
      const result = await query(
        "UPDATE funcionarios SET equipe = NULL, updated_at = CURRENT_TIMESTAMP WHERE equipe = ?",
        [nomeDecoded]
      );
      funcionariosAtualizados = result.changes;
    }
    
    // Remover da tabela temporária (se existir)
    if (existsInTemp) {
      await query(
        "DELETE FROM equipes_temp WHERE nome = ?",
        [nomeDecoded]
      );
    }

    console.log('✅ Equipe deletada com sucesso:', nomeDecoded);
    console.log('📊 Funcionários atualizados:', funcionariosAtualizados);
    
    res.json({
      success: true,
      message: 'Equipe deletada com sucesso',
      funcionariosAtualizados,
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