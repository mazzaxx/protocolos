import express from 'express';
import { query } from './db.js';

const router = express.Router();

// Endpoint de login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email e senha são obrigatórios' 
    });
  }

  // Buscar usuário no banco
  try {
    const result = await query(
      "SELECT * FROM funcionarios WHERE email = ? AND senha = ?", 
      [email, senha]
    );

    const user = result.rows && result.rows.length > 0 ? result.rows[0] : null;

    if (!user) {
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
        id: user.id,
        email: user.email,
        permissao: user.permissao,
        equipe: user.equipe,
        firstLogin: user.first_login === 1
      }
    });
  } catch (err) {
    console.error('Erro no banco de dados:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Endpoint para verificar se usuário está logado
router.get('/verify', (req, res) => {
  // Por simplicidade, vamos apenas retornar sucesso
  // Em produção, você implementaria verificação de token JWT
  res.json({ success: true });
});

// Endpoint para alterar senha
router.post('/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Todos os campos são obrigatórios'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'A nova senha deve ter pelo menos 6 caracteres'
    });
  }

  try {
    const result = await query(
      "SELECT * FROM funcionarios WHERE id = ? AND senha = ?",
      [userId, currentPassword]
    );

    const user = result.rows && result.rows.length > 0 ? result.rows[0] : null;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    await query(
      "UPDATE funcionarios SET senha = ?, first_login = 0 WHERE id = ?",
      [newPassword, userId]
    );

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint para adiar troca de senha no primeiro login
router.post('/skip-password-change', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'userId é obrigatório'
    });
  }

  try {
    await query(
      "UPDATE funcionarios SET first_login = 0 WHERE id = ?",
      [userId]
    );

    res.json({
      success: true,
      message: 'Troca de senha adiada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao adiar troca de senha:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;