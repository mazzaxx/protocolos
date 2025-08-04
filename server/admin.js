import express from 'express';
import { query } from './db.js';

const router = express.Router();

// Listar todos os funcionários
router.get('/funcionarios', async (req, res) => {
  console.log('GET /funcionarios chamado');
  console.log('Headers recebidos:', req.headers);
  console.log('Origin:', req.headers.origin);
  
  try {
    const result = await query("SELECT id, email, permissao FROM funcionarios ORDER BY id");
    const funcionarios = result.rows || [];

    console.log('Funcionários encontrados:', funcionarios);
    res.json({
      success: true,
      funcionarios: funcionarios
    });
  } catch (err) {
    console.error('Erro ao buscar funcionários:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Criar novo funcionário
router.post('/funcionarios', async (req, res) => {
  console.log('POST /funcionarios chamado com:', req.body);
  const { email, senha, permissao } = req.body;

  if (!email || !senha || !permissao) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email, senha e permissão são obrigatórios' 
    });
  }

  // Verificar se email já existe
  try {
    const existingUser = await query("SELECT email FROM funcionarios WHERE email = $1", [email]);

    if (existingUser.rows && existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email já está em uso' 
      });
    }

    // Inserir novo funcionário
    const result = await query(
      "INSERT INTO funcionarios (email, senha, permissao) VALUES ($1, $2, $3) RETURNING id",
      [email, senha, permissao]
    );

    const newId = result.rows && result.rows[0] ? result.rows[0].id : result.insertId;
    
    console.log('Funcionário criado com ID:', newId);
    res.json({
      success: true,
      message: 'Funcionário criado com sucesso',
      funcionario: {
        id: newId,
        email,
        permissao
      }
    });
  } catch (err) {
    console.error('Erro ao criar funcionário:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar funcionário' 
    });
  }
});

// Atualizar funcionário
router.put('/funcionarios/:id', async (req, res) => {
  console.log('PUT /funcionarios/:id chamado com:', req.params.id, req.body);
  const { id } = req.params;
  const { email, senha, permissao } = req.body;

  if (!email || !permissao) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email e permissão são obrigatórios' 
    });
  }

  // Verificar se email já existe em outro funcionário
  try {
    const existingUser = await query("SELECT id FROM funcionarios WHERE email = $1 AND id != $2", [email, id]);

    if (existingUser.rows && existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email já está em uso por outro funcionário' 
      });
    }

    // Atualizar funcionário
    let updateQuery, params;
    
    if (senha) {
      updateQuery = "UPDATE funcionarios SET email = $1, senha = $2, permissao = $3 WHERE id = $4";
      params = [email, senha, permissao, id];
    } else {
      updateQuery = "UPDATE funcionarios SET email = $1, permissao = $2 WHERE id = $3";
      params = [email, permissao, id];
    }

    const result = await query(updateQuery, params);

    const changes = result.rowCount || result.changes || 0;

    if (changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Funcionário não encontrado' 
      });
    }

    console.log('Funcionário atualizado:', id);
    res.json({
      success: true,
      message: 'Funcionário atualizado com sucesso'
    });
  } catch (err) {
    console.error('Erro ao atualizar funcionário:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar funcionário' 
    });
  }
});

// Deletar funcionário
router.delete('/funcionarios/:id', async (req, res) => {
  console.log('DELETE /funcionarios/:id chamado com:', req.params.id);
  const { id } = req.params;

  try {
    const result = await query("DELETE FROM funcionarios WHERE id = $1", [id]);
    const changes = result.rowCount || result.changes || 0;

    if (changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Funcionário não encontrado' 
      });
    }

    console.log('Funcionário deletado:', id);
    res.json({
      success: true,
      message: 'Funcionário deletado com sucesso'
    });
  } catch (err) {
    console.error('Erro ao deletar funcionário:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao deletar funcionário' 
    });
  }
});

export default router;