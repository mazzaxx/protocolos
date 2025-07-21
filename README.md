# Sistema de Protocolos Jurídicos

Sistema completo para gerenciamento de protocolos jurídicos com autenticação de funcionários.

## 🚀 Deploy Rápido (Gratuito)

### Railway (Recomendado)
1. Fork este repositório
2. Acesse [railway.app](https://railway.app)
3. Login com GitHub
4. "New Project" → "Deploy from GitHub repo"
5. Selecione o repositório
6. Deploy automático em ~2 minutos

### Render
1. Fork este repositório  
2. Acesse [render.com](https://render.com)
3. "New Web Service" → Conecte GitHub
4. Configure: `npm run start:production`

## Como executar o projeto

### 1. Instalar dependências
```bash
npm install
```

### 2. Executar servidor backend e frontend simultaneamente
```bash
npm run dev:full
```

## 🔧 Desenvolvimento Local

### 1. Instalar dependências
```bash
npm install
```

### 2. Executar em desenvolvimento
```bash
# Servidor + Frontend juntos
npm run dev:full
```

**Ou separadamente:**
```bash
# Backend
npm run server

# Frontend (nova aba do terminal)
npm run dev
```

### 3. Testar build de produção
```bash
npm run build
npm run preview:production
```

## Acesso ao sistema

- **URL:** http://localhost:5173
- **Email de teste:** admin@escritorio.com  
- **Senha de teste:** 123456

## 🌐 URLs de Acesso

- **Desenvolvimento**: http://localhost:5173
- **Produção**: Será fornecida após deploy

## Funcionalidades

### Autenticação
- Login com email e senha
- Proteção de rotas
- Logout seguro
- Dados do usuário no header

### Painel de Protocolos
- Envio de protocolos
- Fila do robô (automática)
- Fila do Carlos (manual)
- Fila da Deyse (manual)
- Acompanhamento de status

### Banco de Dados
- SQLite local
- Tabela de funcionários
- Usuário de teste pré-criado

## Estrutura do Projeto

```
src/
├── components/
│   ├── Login.tsx           # Página de login
│   ├── Header.tsx          # Header com info do usuário
│   ├── ProtectedRoute.tsx  # Proteção de rotas
│   └── ...                 # Outros componentes do painel
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticação
└── ...

server/
├── server.js              # Servidor Express
├── auth.js                # Rotas de autenticação  
├── db.js                  # Configuração SQLite
└── database.sqlite        # Banco de dados (criado automaticamente)
```

## Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express
- **Banco:** SQLite3
- **Autenticação:** Context API + localStorage