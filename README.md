# Sistema de Protocolos Jurídicos

Sistema completo para gerenciamento de protocolos jurídicos com autenticação de funcionários.

## Como executar o projeto

### 1. Instalar dependências
```bash
npm install
```

### 2. Executar servidor backend e frontend simultaneamente
```bash
npm run dev:full
```

## Deploy Gratuito (Railway)

### 1. Preparar para produção
```bash
# Instalar dependências
npm install

# Testar build local
npm run build
npm run preview:production
```

### 2. Deploy no Railway
1. Acesse [railway.app](https://railway.app)
2. Conecte seu GitHub
3. Selecione este repositório
4. Railway detectará automaticamente e fará deploy
5. Acesse a URL fornecida

### 3. Outras opções gratuitas
- **Render**: render.com (750h/mês grátis)
- **Vercel + Supabase**: Frontend + Backend separados
- **Netlify + Railway**: Híbrido

Ou executar separadamente:

**Backend (servidor de autenticação):**
```bash
npm run server
```

**Frontend:**
```bash
npm run dev
```

## Acesso ao sistema

- **URL:** http://localhost:5173
- **Email de teste:** admin@escritorio.com  
- **Senha de teste:** 123456

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