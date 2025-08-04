# Sistema de Protocolos Jurídicos

Sistema completo para gerenciamento de protocolos jurídicos com autenticação de funcionários.

## 🚀 Deploy Rápido (Gratuito)

### Passo a Passo Completo para Deploy

#### 1. Deploy do Backend no Railway
1. Acesse [railway.app](https://railway.app) e faça login
2. Clique em "New Project" → "Deploy from GitHub repo"
3. Selecione este repositório
4. O Railway detectará automaticamente o Node.js
5. Anote a URL gerada (ex: `https://seu-projeto-railway.up.railway.app`)

#### 2. Configurar Frontend para Produção
1. Edite o arquivo `.env` e coloque a URL do Railway:
   ```
   VITE_API_BASE_URL=https://sua-url-railway.up.railway.app
   ```
2. Edite o arquivo `netlify.toml` e substitua as URLs pelos seus domínios reais
3. Edite o arquivo `server/server.js` e adicione sua URL do Netlify na lista de origens permitidas

#### 3. Deploy do Frontend no Netlify
1. Acesse [netlify.com](https://netlify.com) e faça login
2. Clique em "New site from Git"
3. Conecte seu repositório GitHub
4. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Nas configurações do site, vá em "Environment variables" e adicione:
   - `VITE_API_BASE_URL` = sua URL do Railway

#### 4. Verificar CORS no Backend
Certifique-se de que o backend está configurado para aceitar requisições do seu domínio Netlify.

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

### 2. Escolher modo de execução

#### Modo Local (Desenvolvimento)
```bash
npm run dev:local
```

#### Modo Nuvem (Testes com backend em produção)
```bash
npm run dev:cloud
```

#### Modo Completo Local
```bash
npm run dev:full
```

## 🔧 Desenvolvimento Local

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar Banco de Dados

#### Desenvolvimento Local (SQLite):
- O sistema usa SQLite automaticamente em desenvolvimento
- Nenhuma configuração adicional necessária

#### Produção (PostgreSQL):
- Railway fornece automaticamente a variável `DATABASE_URL`
- O sistema detecta automaticamente e usa PostgreSQL

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

## 🔄 Sincronização de Dados

**IMPORTANTE:** Este sistema funciona com sincronização em tempo real entre todos os usuários.

### Como funciona:
- Todos os protocolos são salvos no servidor (Railway)
- Dados são sincronizados automaticamente a cada 3 segundos
- Mudanças feitas por qualquer usuário aparecem para todos
- **NÃO há armazenamento local** - tudo depende do servidor

### Se os dados não estão sincronizando:
1. Verifique se o servidor backend está online
2. Teste a URL: https://sistema-protocolos-juridicos-production.up.railway.app
3. Verifique o console do navegador (F12) para erros
4. Certifique-se de que a variável `VITE_API_BASE_URL` está configurada corretamente

## Acesso ao sistema

- **URL de desenvolvimento:** http://localhost:5173
- **URL de produção:** Sua URL do Netlify
- **Email de teste:** admin@escritorio.com  
- **Senha de teste:** 123456

## 🌐 URLs de Acesso

- **Desenvolvimento**: http://localhost:5173
- **Backend**: https://sistema-protocolos-juridicos-production.up.railway.app
- **Frontend**: https://ncasistemaprotocolos.netlify.app

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
- SQLite no Railway (produção)
- SQLite local (desenvolvimento)
- Tabela de funcionários
- Tabela de protocolos
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
├── protocols.js           # Rotas de protocolos
├── admin.js               # Rotas administrativas
├── db.js                  # Configuração de banco (SQLite/PostgreSQL)
└── database.sqlite        # Banco SQLite (desenvolvimento)
```

## Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express
- **Banco:** SQLite3 (desenvolvimento), PostgreSQL (produção)
- **Autenticação:** Context API + localStorage
- **Deploy:** Railway (backend) + Netlify (frontend)