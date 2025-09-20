# Sistema de Protocolos Jurídicos

Sistema completo para gerenciamento de protocolos jurídicos com autenticação de funcionários.

## 🎯 Configuração Atual: 4GB RAM Otimizado

Este projeto está otimizado para funcionar com **4GB de RAM** no Square Cloud, com build automático melhorado.

## 🚀 Deploy Rápido (Gratuito)

### ✅ Build Automático (Recomendado para 4GB RAM)

Com 4GB de RAM, o build automático deve funcionar perfeitamente:

1. **Square Cloud** detecta automaticamente o projeto
2. **Build automático** otimizado para 4GB RAM
3. **Deploy instantâneo** sem configuração manual
4. **Cache inteligente** para builds mais rápidos

### 🔧 Build Manual (Backup)

Se preferir fazer build local e commitar:

```bash
# Fazer build local otimizado
npm run build:production

# Verificar se build foi bem-sucedido
ls -la dist/

# Commitar pasta dist
git add dist/
git commit -m "Build para produção"
git push
```

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

### 2. Banco de Dados SQLite Otimizado para 4GB RAM
- **Desenvolvimento e Produção:** SQLite com WAL mode
- **Pool de Conexões:** 20 conexões simultâneas (otimizado para 4GB)
- **Otimizações:** Cache de 20MB, memory-mapped I/O de 512MB
- **Capacidade:** 200+ usuários simultâneos
- **Nenhuma configuração adicional necessária**

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

### Performance Otimizada
- **SQLite WAL Mode:** Melhor concorrência para múltiplos usuários
- **Connection Pooling:** 20 conexões simultâneas (4GB RAM)
- **Cache Inteligente:** Reduz requisições desnecessárias
- **Polling Adaptativo:** Intervalo baseado na atividade

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
- **SQLite Otimizado para 4GB RAM** (desenvolvimento e produção)
- **WAL Mode** para melhor concorrência
- **Connection Pooling** otimizado para 4GB RAM
- **Manutenção automática** a cada 6 horas
- Tabela de funcionários
- Tabela de protocolos

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
├── db.js                  # SQLite otimizado com pooling
└── database.sqlite        # Banco SQLite (desenvolvimento)
```

## Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express
- **Banco:** SQLite3 otimizado com WAL mode e pooling
- **Autenticação:** Context API + localStorage
- **Deploy:** Railway (backend) + Netlify (frontend)
- **Capacidade:** 100+ usuários simultâneos