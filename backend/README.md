# Sistema de Protocolos Jurídicos - Backend API

Backend API para o sistema de gerenciamento de protocolos jurídicos.

## 🚀 Deploy

### Opção 1: Railway
1. Conecte este repositório ao Railway
2. Configure as variáveis de ambiente se necessário
3. O Railway detectará automaticamente o `package.json` e fará o deploy

### Opção 2: Render
1. Conecte este repositório ao Render
2. Configure o serviço como "Web Service"
3. Build Command: `npm install`
4. Start Command: `npm start`

### Opção 3: Heroku
1. Conecte este repositório ao Heroku
2. O Heroku detectará automaticamente o Node.js
3. Configure a variável `PORT` se necessário

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Iniciar servidor de produção
npm start
```

## 📡 Endpoints

- `GET /` - Informações da API
- `GET /health` - Health check
- `POST /api/login` - Autenticação
- `GET /api/protocolos` - Listar protocolos
- `POST /api/protocolos` - Criar protocolo
- `PUT /api/protocolos/:id` - Atualizar protocolo
- `DELETE /api/protocolos/:id` - Deletar protocolo
- `GET /api/admin/*` - Rotas administrativas

## 🗄️ Banco de Dados

Utiliza SQLite com arquivo local `database.sqlite` que é criado automaticamente na primeira execução.

## 🔐 CORS

Configurado para aceitar requisições do frontend. Atualize a lista `allowedOrigins` no arquivo `server.js` com a URL do seu frontend em produção.

## 📝 Logs

Em desenvolvimento, todas as requisições são logadas no console.