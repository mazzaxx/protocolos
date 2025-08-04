import express from 'express';
import { query } from './db.js';

const router = express.Router();

// Cache para melhorar performance
const userCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para limpar cache expirado
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now > value.expiry) {
      userCache.delete(key);
    }
  }
};

// Limpar cache a cada 5 minutos
setInterval(cleanExpiredCache, 5 * 60 * 1000);

// Endpoint de login otimizado
router.post('/login', async (req, res) => {
  const startTime = Date.now();
  const { email, senha } = req.body;

  console.log('🔐 Login attempt:', email);

  if (!email || !senha) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email e senha são obrigatórios' 
    });
  }

  try {
    // Verificar cache primeiro
    const cacheKey = `${email}:${senha}`;
    const cached = userCache.get(cacheKey);
    
    if (cached && Date.now() < cached.expiry) {
      console.log('✅ Login from cache:', email);
      return res.json({
        success: true,
        message: 'Login realizado com sucesso',
        user: cached.user,
        cached: true
      });
    }

    // Buscar no banco com timeout otimizado
    const result = await Promise.race([
      query(
        "SELECT id, email, permissao FROM funcionarios WHERE email = $1 AND senha = $2", 
        [email, senha]
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 5000)
      )
    ]);

    const user = result.rows && result.rows.length > 0 ? result.rows[0] : null;

    if (!user) {
      console.log('❌ Login failed:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou senha incorretos' 
      });
    }

    // Cache do usuário
    userCache.set(cacheKey, {
      user,
      expiry: Date.now() + CACHE_DURATION
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Login success: ${email} (${duration}ms)`);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      user,
      duration: `${duration}ms`
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Login error (${duration}ms):`, err.message);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Endpoint para verificar se usuário está logado
router.get('/verify', (req, res) => {
  res.json({ 
    success: true,
    timestamp: new Date().toISOString()
  });
});

// Endpoint para logout (limpar cache)
router.post('/logout', (req, res) => {
  const { email } = req.body;
  
  if (email) {
    // Remover do cache
    for (const [key] of userCache.entries()) {
      if (key.startsWith(`${email}:`)) {
        userCache.delete(key);
      }
    }
    console.log('🔓 Logout:', email);
  }
  
  res.json({ 
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

// Endpoint para estatísticas de cache
router.get('/cache-stats', (req, res) => {
  cleanExpiredCache();
  
  res.json({
    success: true,
    stats: {
      cacheSize: userCache.size,
      cacheKeys: Array.from(userCache.keys()).map(key => key.split(':')[0])
    }
  });
});

export default router;