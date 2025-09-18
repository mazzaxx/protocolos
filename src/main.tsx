import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Log de inicialização para Square Cloud
console.log('🚀 [SQUARE CLOUD] Frontend React iniciando...');
console.log('🌐 [SQUARE CLOUD] URL da API:', import.meta.env.VITE_API_BASE_URL || 'PROXY LOCAL');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);