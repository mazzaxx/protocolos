import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initializeDb } from './db.js';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';
import protocolRoutes from './protocols.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Lista de origens permitidas para CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  // URL real do Netlify
  'https://ncasistemaprotocolos.netlify.app',
  // URLs alternativas do Netlify (caso mude)
  'https://sistema-juridico.netlify.app',
  'https://sistema-protocolos.netlify.app',
];

// Middlewares
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS warning - origin not in allowedOrigins:', origin);
      // Em desenvolvimento, permitir qualquer origem localhost ou netlify
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('netlify.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));
app.use(express.json());

// Inicializar o banco de dados antes de configurar as rotas
console.log('Inicializando banco de dados...');

try {
  await initializeDb();
  console.log('Banco de dados inicializado com sucesso!');
} catch (error) {
  console.error('Erro ao inicializar banco de dados:', error);
  process.exit(1);
}

// Log de todas as requisições para debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log('Origin:', req.headers.origin);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Rotas
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', protocolRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'Servidor de autenticação funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    routes: [
      'GET /',
      'POST /api/login',
      'GET /api/verify',
      'GET /api/admin/funcionarios',
      'POST /api/admin/funcionarios',
      'PUT /api/admin/funcionarios/:id',
      'DELETE /api/admin/funcionarios/:id'
    ]
  });
});

// Rota de teste para admin
app.get('/api/admin/test', (req, res) => {
  res.json({ 
    message: 'Rotas admin funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota de teste para API
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota de teste para protocolos
app.get('/api/protocolos/test', (req, res) => {
  res.json({ 
    message: 'Rotas de protocolos funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro 404
app.use('*', (req, res) => {
  console.log(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}` 
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Acesse: http://localhost:${PORT}`);
  }
  console.log('Rotas disponíveis:');
  console.log('- GET /api/login');
  console.log('- POST /api/login');
  console.log('- GET /api/verify');
  console.log('- GET /api/admin/funcionarios');
  console.log('- POST /api/admin/funcionarios');
  console.log('- PUT /api/admin/funcionarios/:id');
  console.log('- DELETE /api/admin/funcionarios/:id');
  console.log('- GET /api/protocolos');
  console.log('- POST /api/protocolos');
  console.log('- PUT /api/protocolos/:id');
  console.log('- DELETE /api/protocolos/:id');
});