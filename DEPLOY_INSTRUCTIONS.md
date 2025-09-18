# 🚀 Instruções Completas de Deploy

## ✅ CONFIGURAÇÃO ATUAL: Railway + Netlify

Seu projeto está configurado para:
- **Backend:** Railway (Node.js + Express + SQLite)
- **Frontend:** Netlify (React + Vite)

## 🔧 PASSOS PARA RESOLVER "Rota não encontrada":

### 1. **Obter URLs reais**
Você precisa das URLs reais dos seus deploys:

**Railway:**
- Acesse seu projeto no Railway
- Copie a URL (ex: `https://sistema-juridico-production-a1b2.up.railway.app`)

**Netlify:**
- Acesse seu projeto no Netlify
- Copie a URL (ex: `https://sistema-juridico-abc123.netlify.app`)

### 2. **Configurar CORS no Railway**
No arquivo `server/server.js`, linha 15, substitua:
```javascript
// JÁ CONFIGURADO:
'https://ncasistemaprotocolos.netlify.app',
```

### 3. **Configurar variável de ambiente no Netlify**
1. Netlify Dashboard → Seu site → Site settings → Environment variables
2. Adicione/edite:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://sistema-protocolos-juridicos-production.up.railway.app`

### 4. **Atualizar netlify.toml**
No arquivo `netlify.toml`, linhas 12 e 15, substitua:
```toml
VITE_API_BASE_URL = "https://sistema-protocolos-juridicos-production.up.railway.app"
```

### 5. **Fazer redeploy**
- **Railway:** Faça push das mudanças ou redeploy manual
- **Netlify:** Trigger deploy ou faça push das mudanças

## 🧪 COMO TESTAR:

### 1. **Teste o backend Railway:**
Acesse: `https://sistema-protocolos-juridicos-production.up.railway.app`
Deve retornar: `{"message":"Servidor de autenticação funcionando!"}`

### 2. **Teste a API:**
Acesse: `https://sistema-protocolos-juridicos-production.up.railway.app/api/admin/funcionarios`
Deve retornar lista de funcionários

### 3. **Teste o frontend:**
1. Acesse: `https://ncasistemaprotocolos.netlify.app`
2. Abra F12 (Console do navegador)
3. Tente fazer login com: `admin@escritorio.com` / `123456`
4. Verifique se não há erros de CORS no console

## 🚨 ERROS COMUNS:

1. **"blocked by CORS policy"**
   → Adicione sua URL do Netlify no `allowedOrigins` do server.js

2. **"Failed to fetch"**
   → Verifique se a variável `VITE_API_BASE_URL` está correta no Netlify

3. **"Rota não encontrada"**
   → Verifique se o Railway está rodando e acessível

## 📝 EXEMPLO DE CONFIGURAÇÃO:

Se suas URLs forem:
- Railway: `https://meu-backend-abc123.up.railway.app`
- Netlify: `https://meu-frontend-xyz789.netlify.app`

Então configure:
```javascript
// server/server.js
const allowedOrigins = [
  'https://meu-frontend-xyz789.netlify.app',
  // ... outras URLs
];
```

```bash
# Netlify Environment Variables
VITE_API_BASE_URL=https://meu-backend-abc123.up.railway.app
```

**🎯 Depois dessas configurações, o erro "Rota não encontrada" deve ser resolvido!**

**💡 Dica:** Use F12 no navegador para ver exatamente qual URL está falhando e ajustar conforme necessário.