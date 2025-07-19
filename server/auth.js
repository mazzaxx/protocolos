import express from 'express';
import db from './db.js';

const router = express.Router();

// Endpoint de login
router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email e senha são obrigatórios' 
    });
  }

  // Buscar usuário no banco
  db.get(
    "SELECT * FROM funcionarios WHERE email = ? AND senha = ?", 
    [email, senha], 
    (err, row) => {
      if (err) {
        console.error('Erro no banco de dados:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro interno do servidor' 
        });
      }

      if (!row) {
        return res.status(401).json({ 
          success: false, 
          message: 'Email ou senha incorretos' 
        });
      }

      // Login bem-sucedido
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        user: {
          id: row.id,
          email: row.email,
          permissao: row.permissao
        }
      });
    }
  );
});

// Endpoint para verificar se usuário está logado
router.get('/verify', (req, res) => {
  // Por simplicidade, vamos apenas retornar sucesso
  // Em produção, você implementaria verificação de token JWT
  res.json({ success: true });
});

export default router;