# Sistema de Protocolos Jurídicos

Sistema completo para gerenciamento de protocolos jurídicos com automação de peticionamento, dividido em duas aplicações independentes.

## 🏗️ Arquitetura

O projeto está dividido em duas aplicações separadas:

### 📡 Backend (API + Database)
- **Localização**: `/backend`
- **Tecnologia**: Node.js + Express + SQLite
- **Responsabilidade**: API REST, autenticação, banco de dados
- **Deploy**: Railway, Render, Heroku

### 🎨 Frontend (Interface)
- **Localização**: `/frontend`
- **Tecnologia**: React + TypeScript + Vite + Tailwind
- **Responsabilidade**: Interface do usuário, consumo da API
- **Deploy**: Vercel, Netlify, GitHub Pages

## 🚀 Deploy Separado

### 1. Deploy do Backend

#### Railway (Recomendado)
1. Crie uma conta no [Railway](https://railway.app)
2. Conecte o repositório
3. Selecione a pasta `/backend`
4. O deploy será automático

#### Render
1. Crie uma conta no [Render](https://render.com)
2. Conecte o repositório
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

#### Heroku
1. Crie uma conta no [Heroku](https://heroku.com)
2. Conecte o repositório
3. Configure para usar a pasta `backend`

### 2. Deploy do Frontend

#### Vercel (Recomendado)
1. Crie uma conta no [Vercel](https://vercel.com)
2. Conecte o repositório
3. Configure:
   - **Root Directory**: `frontend`
   - **Environment Variable**: `VITE_API_BASE_URL` = URL do seu backend

#### Netlify
1. Crie uma conta no [Netlify](https://netlify.com)
2. Conecte o repositório
3. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
   - **Environment Variable**: `VITE_API_BASE_URL` = URL do seu backend

## 🔧 Desenvolvimento Local

### Backend
```bash
cd backend
npm install
npm run dev
# Servidor rodando em http://localhost:80
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edite o .env com a URL do backend
npm run dev
# Interface rodando em http://localhost:5173
```

## 🌐 Configuração de Produção

1. **Deploy o Backend primeiro** e anote a URL
2. **Configure o Frontend** com a URL do backend:
   ```env
   VITE_API_BASE_URL=https://protocolos.squareweb.app
   ```
3. **Deploy o Frontend**

## 🔗 URLs de Produção

- **Frontend (Netlify)**: https://protocolosnca.netlify.app
- **Backend (Square Cloud)**: https://protocolos.squareweb.app

## ✅ Vantagens desta Arquitetura

- ✅ **Deploy Independente**: Atualize frontend sem afetar o backend
- ✅ **Dados Preservados**: Banco de dados nunca é perdido
- ✅ **Cache Limpo**: Frontend sempre atualizado
- ✅ **Escalabilidade**: Cada parte pode escalar independentemente
- ✅ **Flexibilidade**: Use diferentes provedores para cada parte
- ✅ **Desenvolvimento**: Equipes podem trabalhar independentemente

## 🔐 Usuários de Teste

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@escritorio.com | 123456 |
| Moderador | mod@escritorio.com | 123456 |
| Advogado | advogado@escritorio.com | 123456 |

## 📞 Suporte

- **Backend**: Verifique logs no provedor escolhido
- **Frontend**: Verifique console do navegador
- **CORS**: Certifique-se que a URL do frontend está na lista permitida do backend

## 🔄 Fluxo de Deploy

1. **Primeira vez**:
   - Deploy backend → Anote URL
   - Configure frontend com URL do backend
   - Deploy frontend

2. **Atualizações**:
   - **Só backend**: Deploy backend (frontend não afetado)
   - **Só frontend**: Deploy frontend (dados preservados)
   - **Ambos**: Deploy backend primeiro, depois frontend