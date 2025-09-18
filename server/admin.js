import express from 'express';
import { query } from './db.js';

/**
 * MÓDULO DE ADMINISTRAÇÃO - SQUARE CLOUD
 * 
 * Gerencia funcionalidades administrativas do sistema.
 * API para gerenciamento de funcionários e configurações.
 * 
 * FUNCIONALIDADES:
 * - CRUD de funcionários
 * - Gerenciamento de permissões
 * - Validações de segurança
 * - Logs de auditoria
 * 
 * HOSPEDAGEM SQUARE CLOUD:
 * - Queries otimizadas para SQLite
 * - Validação robusta de dados
 * - Tratamento de erros específico
 * - Logs detalhados para monitoramento
 */

const router = express.Router();

/**
 * ENDPOINT: LISTAR TODOS OS FUNCIONÁRIOS
 * 
 * Retorna lista de todos os funcionários cadastrados.
 * Usado para administração e seleção de usuários.
 * 
 * SQUARE CLOUD:
 * - Query otimizada com ordenação
 * - Exclusão de dados sensíveis (senha)
 * - Logs de acesso para auditoria
 */
router.get('/funcionarios', async (req, res) => {
  console.log('[SQUARE CLOUD] GET /funcionarios chamado');
  console.log('[SQUARE CLOUD] Headers recebidos:', req.headers);
  console.log('[SQUARE CLOUD] Origin:', req.headers.origin);
  
  try {
    /**
     * QUERY OTIMIZADA PARA LISTAR FUNCIONÁRIOS
     * 
     * Seleciona apenas campos necessários (sem senha).
     * Ordenação por ID para consistência.
     */
    const result = await query("SELECT id, email, permissao FROM funcionarios ORDER BY id");
    const funcionarios = result.rows || [];

    console.log('[SQUARE CLOUD] Funcionários encontrados:', funcionarios);
    res.json({
      success: true,
      funcionarios: funcionarios,
      total: funcionarios.length,
      platform: 'Square Cloud'
    });
  } catch (err) {
    console.error('[SQUARE CLOUD] Erro ao buscar funcionários:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor (Square Cloud)',
      platform: 'Square Cloud'
    });
  }
});

/**
 * ENDPOINT: CRIAR NOVO FUNCIONÁRIO
 * 
 * Cadastra um novo funcionário no sistema.
 * Inclui validações de email único e dados obrigatórios.
 * 
 * SQUARE CLOUD:
 * - Validação de email único
 * - Verificação de dados obrigatórios
 * - Log de criação para auditoria
 * - Tratamento de conflitos
 */
router.post('/funcionarios', async (req, res) => {
  console.log('[SQUARE CLOUD] POST /funcionarios chamado com:', req.body);
  const { email, senha, permissao } = req.body;

  /**
   * VALIDAÇÕES BÁSICAS
   * 
   * Verifica se todos os campos obrigatórios estão presentes.
   * Essencial para integridade dos dados.
   */
  if (!email || !senha || !permissao) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email, senha e permissão são obrigatórios (Square Cloud)' 
    });
  }

  /**
   * VERIFICAÇÃO DE EMAIL ÚNICO
   * 
   * Consulta otimizada para verificar se email já está em uso.
   * Usa índice no campo email para performance.
   */
  try {
    console.log(`[SQUARE CLOUD] Verificando se email ${email} já existe`);
    const existingUser = await query("SELECT email FROM funcionarios WHERE email = ?", [email]);

    if (existingUser.rows && existingUser.rows.length > 0) {
      console.log(`[SQUARE CLOUD] Email ${email} já está em uso`);
      return res.status(400).json({ 
        success: false, 
        message: 'Email já está em uso (Square Cloud)' 
      });
    }

    /**
     * INSERÇÃO DO NOVO FUNCIONÁRIO
     * 
     * Query otimizada para inserção com retorno do ID.
     * Inclui timestamp automático.
     */
    console.log(`[SQUARE CLOUD] Criando funcionário: ${email} (${permissao})`);
    const result = await query(
      "INSERT INTO funcionarios (email, senha, permissao) VALUES (?, ?, ?)",
      [email, senha, permissao]
    );

    // SQUARE CLOUD: Obter ID do funcionário criado
    const newId = result.insertId || result.lastID;
    
    console.log('[SQUARE CLOUD] Funcionário criado com ID:', newId);
    res.json({
      success: true,
      message: 'Funcionário criado com sucesso na Square Cloud',
      funcionario: {
        id: newId,
        email,
        permissao,
        platform: 'Square Cloud'
      },
      platform: 'Square Cloud'
    });
  } catch (err) {
    console.error('[SQUARE CLOUD] Erro ao criar funcionário:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar funcionário na Square Cloud',
      platform: 'Square Cloud'
    });
  }
});

/**
 * ENDPOINT: ATUALIZAR FUNCIONÁRIO
 * 
 * Atualiza dados de um funcionário existente.
 * Permite atualização opcional da senha.
 * 
 * SQUARE CLOUD:
 * - Validação de email único (exceto próprio)
 * - Atualização condicional de senha
 * - Verificação de existência
 * - Log de alterações
 */
router.put('/funcionarios/:id', async (req, res) => {
  console.log('[SQUARE CLOUD] PUT /funcionarios/:id chamado com:', req.params.id, req.body);
  const { id } = req.params;
  const { email, senha, permissao } = req.body;

  /**
   * VALIDAÇÕES BÁSICAS PARA ATUALIZAÇÃO
   * 
   * Email e permissão são obrigatórios.
   * Senha é opcional (se não fornecida, mantém a atual).
   */
  if (!email || !permissao) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email e permissão são obrigatórios (Square Cloud)' 
    });
  }

  /**
   * VERIFICAÇÃO DE EMAIL ÚNICO (EXCETO PRÓPRIO)
   * 
   * Verifica se email já está em uso por outro funcionário.
   * Exclui o próprio funcionário da verificação.
   */
  try {
    console.log(`[SQUARE CLOUD] Verificando email ${email} para funcionário ${id}`);
    const existingUser = await query("SELECT id FROM funcionarios WHERE email = ? AND id != ?", [email, id]);

    if (existingUser.rows && existingUser.rows.length > 0) {
      console.log(`[SQUARE CLOUD] Email ${email} já está em uso por outro funcionário`);
      return res.status(400).json({ 
        success: false, 
        message: 'Email já está em uso por outro funcionário (Square Cloud)' 
      });
    }

    /**
     * ATUALIZAÇÃO CONDICIONAL DO FUNCIONÁRIO
     * 
     * Se senha foi fornecida, atualiza todos os campos.
     * Caso contrário, mantém senha atual.
     */
    let updateQuery, params;
    
    if (senha) {
      // SQUARE CLOUD: Atualizar com nova senha
      console.log(`[SQUARE CLOUD] Atualizando funcionário ${id} com nova senha`);
      updateQuery = "UPDATE funcionarios SET email = ?, senha = ?, permissao = ? WHERE id = ?";
      params = [email, senha, permissao, id];
    } else {
      // SQUARE CLOUD: Atualizar sem alterar senha
      console.log(`[SQUARE CLOUD] Atualizando funcionário ${id} sem alterar senha`);
      updateQuery = "UPDATE funcionarios SET email = ?, permissao = ? WHERE id = ?";
      params = [email, permissao, id];
    }

    // SQUARE CLOUD: Executar atualização
    const result = await query(updateQuery, params);
    const changes = result.changes || 0;

    if (changes === 0) {
      console.log(`[SQUARE CLOUD] Funcionário ${id} não encontrado para atualização`);
      return res.status(404).json({ 
        success: false, 
        message: 'Funcionário não encontrado (Square Cloud)' 
      });
    }

    console.log('[SQUARE CLOUD] Funcionário atualizado:', id);
    res.json({
      success: true,
      message: 'Funcionário atualizado com sucesso na Square Cloud',
      platform: 'Square Cloud'
    });
  } catch (err) {
    console.error('[SQUARE CLOUD] Erro ao atualizar funcionário:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar funcionário na Square Cloud',
      platform: 'Square Cloud'
    });
  }
});

/**
 * ENDPOINT: DELETAR FUNCIONÁRIO
 * 
 * Remove um funcionário do sistema.
 * Operação irreversível com validação de existência.
 * 
 * SQUARE CLOUD:
 * - Verificação de existência
 * - Log de deleção para auditoria
 * - Confirmação de remoção
 */
router.delete('/funcionarios/:id', async (req, res) => {
  console.log('[SQUARE CLOUD] DELETE /funcionarios/:id chamado com:', req.params.id);
  const { id } = req.params;

  try {
    // SQUARE CLOUD: Executar deleção
    console.log(`[SQUARE CLOUD] Deletando funcionário ${id}`);
    const result = await query("DELETE FROM funcionarios WHERE id = ?", [id]);
    const changes = result.changes || 0;

    if (changes === 0) {
      console.log(`[SQUARE CLOUD] Funcionário ${id} não encontrado para deleção`);
      return res.status(404).json({ 
        success: false, 
        message: 'Funcionário não encontrado (Square Cloud)' 
      });
    }

    console.log('[SQUARE CLOUD] Funcionário deletado:', id);
    res.json({
      success: true,
      message: 'Funcionário deletado com sucesso na Square Cloud',
      platform: 'Square Cloud'
    });
  } catch (err) {
    console.error('[SQUARE CLOUD] Erro ao deletar funcionário:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao deletar funcionário na Square Cloud',
      platform: 'Square Cloud'
    });
  }
});

// SQUARE CLOUD: Exportar router para uso no servidor principal
export default router;