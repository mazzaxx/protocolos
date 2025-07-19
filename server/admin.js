import express from 'express';
import db from './db.js';

const router = express.Router();

// Listar todos os funcionários
router.get('/funcionarios', (req, res) => {
  console.log('GET /funcionarios chamado');
  db.all("SELECT id, email, permissao FROM funcionarios ORDER BY id", (err, rows) => {
    if (err) {
      console.error('Erro ao buscar funcionários:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

    console.log('Funcionários encontrados:', rows);
    res.json({
      success: true,
      funcionarios: rows
    });
  });
});

// Criar novo funcionário
router.post('/funcionarios', (req, res) => {
  console.log('POST /funcionarios chamado com:', req.body);
  const { email, senha, permissao } = req.body;

  if (!email || !senha || !permissao) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email, senha e permissão são obrigatórios' 
    });
  }

  // Verificar se email já existe
  db.get("SELECT email FROM funcionarios WHERE email = ?", [email], (err, row) => {
    if (err) {
      console.error('Erro ao verificar email:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

    if (row) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email já está em uso' 
      });
    }

    // Inserir novo funcionário
    db.run(
      "INSERT INTO funcionarios (email, senha, permissao) VALUES (?, ?, ?)",
      [email, senha, permissao],
      function(err) {
        if (err) {
          console.error('Erro ao criar funcionário:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Erro ao criar funcionário' 
          });
        }

        console.log('Funcionário criado com ID:', this.lastID);
        res.json({
          success: true,
          message: 'Funcionário criado com sucesso',
          funcionario: {
            id: this.lastID,
            email,
            permissao
          }
        });
      }
    );
  });
});

// Atualizar funcionário
router.put('/funcionarios/:id', (req, res) => {
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
  db.get("SELECT id FROM funcionarios WHERE email = ? AND id != ?", [email, id], (err, row) => {
    if (err) {
      console.error('Erro ao verificar email:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

    if (row) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email já está em uso por outro funcionário' 
      });
    }

    // Atualizar funcionário
    const updateQuery = senha 
      ? "UPDATE funcionarios SET email = ?, senha = ?, permissao = ? WHERE id = ?"
      : "UPDATE funcionarios SET email = ?, permissao = ? WHERE id = ?";
    
    const params = senha 
      ? [email, senha, permissao, id]
      : [email, permissao, id];

    db.run(updateQuery, params, function(err) {
      if (err) {
        console.error('Erro ao atualizar funcionário:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao atualizar funcionário' 
        });
      }

      if (this.changes === 0) {
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
    });
  });
});

// Deletar funcionário
router.delete('/funcionarios/:id', (req, res) => {
  console.log('DELETE /funcionarios/:id chamado com:', req.params.id);
  const { id } = req.params;

  db.run("DELETE FROM funcionarios WHERE id = ?", [id], function(err) {
    if (err) {
      console.error('Erro ao deletar funcionário:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao deletar funcionário' 
      });
    }

    if (this.changes === 0) {
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
  });
});

export default router;