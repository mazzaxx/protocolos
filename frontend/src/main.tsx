import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Configuração da URL da API para produção
console.log('🌐 Frontend conectando ao backend:', import.meta.env.VITE_API_BASE_URL || 'URL não configurada');
console.log('🔧 Modo:', import.meta.env.MODE);
console.log('🏗️ Produção:', import.meta.env.PROD);

// Verificar se a URL da API está configurada
if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('⚠️ VITE_API_BASE_URL não está configurada!');
  console.warn('🔧 Configure a variável de ambiente no Netlify:');
  console.warn('   VITE_API_BASE_URL=https://protocolos.squareweb.app');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);