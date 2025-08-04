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
    const result = await Promise.race([
      query(
      "SELECT * FROM funcionarios WHERE email = $1 AND senha = $2", 
      [email, senha]
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 10000)
      )
    ]);

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
        permissao: user.permissao
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

export default router;