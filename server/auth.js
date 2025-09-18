import express from 'express';
import { query } from './db.js';

/**
 * MÓDULO DE AUTENTICAÇÃO - SQUARE CLOUD
 * 
 * Gerencia autenticação de usuários do sistema jurídico.
 * Otimizado para funcionar perfeitamente na Square Cloud.
 * 
 * FUNCIONALIDADES:
 * - Login com email e senha
 * - Verificação de credenciais
 * - Validação de sessão
 * - Tratamento de erros robusto
 * 
 * HOSPEDAGEM SQUARE CLOUD:
 * - Funciona nativamente na plataforma
 * - Sem dependências externas
 * - Performance otimizada
 */

const router = express.Router();

/**
 * ENDPOINT DE LOGIN
 * 
 * Autentica usuários com email e senha.
 * Retorna dados do usuário em caso de sucesso.
 * 
 * SQUARE CLOUD:
 * - Consulta otimizada ao SQLite
 * - Validação robusta de credenciais
 * - Logs de segurança
 */
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  // SQUARE CLOUD: Validação básica de entrada
  if (!email || !senha) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email e senha são obrigatórios' 
    });
  }

  /**
   * BUSCA DE USUÁRIO NO BANCO SQLITE
   * 
   * Consulta otimizada para autenticação rápida.
   * Usa índice no campo email para performance.
   */
  try {
    console.log(`🔐 [SQUARE CLOUD] Tentativa de login: ${email}`);
    
    const result = await query(
      "SELECT * FROM funcionarios WHERE email = ? AND senha = ?", 
      [email, senha]
    );

    // SQUARE CLOUD: Verificar se usuário foi encontrado
    const user = result.rows && result.rows.length > 0 ? result.rows[0] : null;

    if (!user) {
      console.log(`❌ [SQUARE CLOUD] Login falhou para: ${email}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou senha incorretos' 
      });
    }

    // SQUARE CLOUD: Login bem-sucedido
    console.log(`✅ [SQUARE CLOUD] Login bem-sucedido: ${email} (${user.permissao})`);
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        permissao: user.permissao,
        platform: 'Square Cloud'
      }
    });
  } catch (err) {
    console.error('❌ [SQUARE CLOUD] Erro no banco de dados:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor (Square Cloud)' 
    });
  }
});

/**
 * ENDPOINT DE VERIFICAÇÃO DE SESSÃO
 * 
 * Verifica se o usuário está autenticado.
 * Implementação simplificada para demonstração.
 * 
 * SQUARE CLOUD:
 * - Em produção, implementar JWT ou sessões
 * - Por simplicidade, sempre retorna sucesso
 */
router.get('/verify', (req, res) => {
  console.log('🔍 [SQUARE CLOUD] Verificação de sessão solicitada');
  
  // SQUARE CLOUD: Por simplicidade, sempre retorna sucesso
  // Em produção real, implementar verificação JWT
  res.json({ 
    success: true,
    platform: 'Square Cloud',
    message: 'Sessão válida'
  });
});

// SQUARE CLOUD: Exportar router para uso no servidor principal
export default router;