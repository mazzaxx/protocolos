import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Log de todas as requisições para debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Rotas
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);

// Servir o frontend para todas as rotas não-API em produção
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Rota de teste
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  } else {
    res.json({ message: 'Servidor de autenticação funcionando!' });
  }
});

// Rota de teste para admin
app.get('/api/admin/test', (req, res) => {
  res.json({ message: 'Rotas admin funcionando!' });
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
});