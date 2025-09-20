import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Configurar URL base da API para produção
if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  // Em produção no Square Cloud, a API está na mesma origem
  (window as any).__API_BASE_URL__ = '';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
