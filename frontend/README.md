# Sistema de Protocolos Jurídicos - Frontend

Frontend React para o sistema de gerenciamento de protocolos jurídicos.

## 🚀 Deploy

### Opção 1: Vercel
1. Conecte este repositório ao Vercel
2. Configure a variável de ambiente:
   - `VITE_API_BASE_URL` = URL do seu backend (ex: `https://seu-backend.railway.app`)
3. O Vercel detectará automaticamente que é um projeto Vite

### Opção 2: Netlify
1. Conecte este repositório ao Netlify
2. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables: `VITE_API_BASE_URL` = URL do seu backend
3. Configure redirects para SPA (criar arquivo `_redirects` na pasta `public`)

### Opção 3: GitHub Pages
1. Configure GitHub Actions para build automático
2. Configure a variável `VITE_API_BASE_URL` nos secrets do repositório

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar variável de ambiente
cp .env.example .env
# Edite o arquivo .env com a URL do seu backend

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🌐 Configuração da API

O frontend se conecta ao backend através da variável de ambiente `VITE_API_BASE_URL`.

### Desenvolvimento:
```env
VITE_API_BASE_URL=http://localhost:80
```

### Produção:
```env
VITE_API_BASE_URL=https://protocolos.squareweb.app
```

## 📁 Estrutura

```
frontend/
├── src/
│   ├── components/     # Componentes React
│   ├── contexts/       # Context API
│   ├── hooks/          # Custom hooks
│   ├── types.ts        # Tipos TypeScript
│   └── utils/          # Utilitários
├── public/             # Arquivos estáticos
└── dist/               # Build de produção
```

## 🎨 Tecnologias

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (ícones)

## 🔐 Autenticação

O sistema utiliza autenticação baseada em sessão. As credenciais são enviadas para o backend que valida e retorna os dados do usuário.

## 📱 Responsividade

O frontend é totalmente responsivo e funciona em dispositivos móveis, tablets e desktops.