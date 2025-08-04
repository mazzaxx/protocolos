# Sistema de Protocolos Jurídicos

Sistema completo para gerenciamento de protocolos jurídicos com autenticação de funcionários.

## 🚀 Deploy Rápido (Gratuito)

### ⚠️ IMPORTANTE: Configuração do Banco PostgreSQL no Railway

**ANTES DE FAZER O DEPLOY:**
1. No Railway, vá em seu projeto
2. Clique em "Variables" 
3. Certifique-se de que `DATABASE_URL` está configurada automaticamente
4. Se não estiver, adicione um PostgreSQL database ao projeto
5. O Railway irá gerar automaticamente a `DATABASE_URL`

### Passo a Passo Completo para Deploy

#### 1. Deploy do Backend no Railway
1. Acesse [railway.app](https://railway.app) e faça login
2. Clique em "New Project" → "Deploy from GitHub repo"
3. Selecione este repositório
4. O Railway detectará automaticamente o Node.js
5. **CRÍTICO:** Adicione um PostgreSQL database:
   - Clique em "Add Service" → "Database" → "PostgreSQL"
   - O Railway irá automaticamente configurar a `DATABASE_URL`
6. Anote a URL gerada (ex: `https://seu-projeto-railway.up.railway.app`)

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

### 🔧 Solução de Problemas do Banco

**Se o erro `ECONNREFUSED ::1:5432` aparecer:**
1. Verifique se o PostgreSQL foi adicionado ao projeto Railway
2. Confirme que a variável `DATABASE_URL` existe
3. Redeploy o projeto no Railway
4. Aguarde alguns minutos para o banco inicializar

**Logs para verificar:**
- `🔗 DATABASE_URL presente: true` ✅ (deve ser true)
- `🐘 Usando PostgreSQL com DATABASE_URL do Railway` ✅
- `✅ Teste de conectividade PostgreSQL bem-sucedido` ✅

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

## 🗄️ Banco de Dados

### Produção (Railway)
- **Banco:** PostgreSQL (fornecido automaticamente pelo Railway)
- **Configuração:** Automática via `DATABASE_URL`
- **Backup:** Gerenciado pelo Railway
- **Conexões:** Pool de até 20 conexões simultâneas

### Desenvolvimento Local
- **Banco:** PostgreSQL local
- **Configuração:** Via variáveis de ambiente no `.env`
- **Instalação:** `brew install postgresql` (Mac) ou `apt install postgresql` (Ubuntu)

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

#### Desenvolvimento Local (PostgreSQL):
```bash
# Instalar PostgreSQL
brew install postgresql  # Mac
# ou
sudo apt install postgresql postgresql-contrib  # Ubuntu

# Iniciar serviço
brew services start postgresql  # Mac
# ou  
sudo systemctl start postgresql  # Ubuntu

# Criar banco
createdb protocolos_juridicos

# Configurar .env
cp .env.example .env
# Editar .env com suas configurações locais
```

#### Produção (PostgreSQL):
- Railway fornece automaticamente PostgreSQL
- Variável `DATABASE_URL` é configurada automaticamente
- Não requer configuração manual

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

## 🔍 Monitoramento e Logs

### Railway Logs
```bash
# Ver logs em tempo real
railway logs --follow

# Ver logs específicos do banco
railway logs --filter="PostgreSQL"
```

### Health Checks
- **URL:** `https://seu-projeto.up.railway.app/health`
- **Frequência:** A cada 1 minuto
- **Inclui:** Status do banco, estatísticas, conectividade

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
3. Verifique o health check: https://sistema-protocolos-juridicos-production.up.railway.app/health
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
- **Produção:** PostgreSQL no Railway com backup automático
- **Desenvolvimento:** PostgreSQL local
- Tabela de funcionários
- Tabela de protocolos
- Usuário de teste pré-criado
- Pool de conexões com retry automático
- Health checks periódicos

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
├── db.js                  # Configuração PostgreSQL com retry
└── test-connectivity.js  # Testes de conectividade
```

## Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express
- **Banco:** PostgreSQL (produção e desenvolvimento)
- **Autenticação:** Context API + localStorage
- **Deploy:** Railway (backend) + Netlify (frontend)
- **Monitoramento:** Health checks automáticos
- **Retry Logic:** Conexões com retry automático