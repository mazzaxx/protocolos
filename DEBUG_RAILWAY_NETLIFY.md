# 🔧 DEBUG: Railway + Netlify

## ⚡ SOLUÇÃO RÁPIDA para "Rota não encontrada"

## 🎯 **SUAS URLs:**
- **Railway:** https://sistema-protocolos-juridicos-production.up.railway.app
- **Netlify:** https://ncasistemaprotocolos.netlify.app

### 1. **OBTENHA SUAS URLs REAIS**

✅ **JÁ CONFIGURADO:**
- Railway: `https://sistema-protocolos-juridicos-production.up.railway.app`
- Netlify: `https://ncasistemaprotocolos.netlify.app`

### 2. **CONFIGURE O CORS (Railway)**

✅ **JÁ CONFIGURADO** no arquivo `server/server.js`:
```javascript
'https://ncasistemaprotocolos.netlify.app',
```

### 3. **CONFIGURE A VARIÁVEL DE AMBIENTE (Netlify)**

1. Netlify Dashboard → Seu site → Site settings → Environment variables
2. Adicione ou edite:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://sistema-protocolos-juridicos-production.up.railway.app`

### 4. **FAÇA REDEPLOY**

- **Railway:** Push das mudanças ou redeploy manual
- **Netlify:** Trigger deploy

### 5. **TESTE**

1. **Backend:** Acesse `https://sistema-protocolos-juridicos-production.up.railway.app`
   - Deve mostrar: `{"message":"Servidor de autenticação funcionando!"}`

2. **Frontend:** Acesse `https://ncasistemaprotocolos.netlify.app`
   - Abra F12 (Console)
   - Tente login: `admin@escritorio.com` / `123456`
   - Verifique se não há erros de CORS

## 🚨 SE AINDA NÃO FUNCIONAR:

### Verifique os logs:

**Railway:**
- Vá no seu projeto → Deployments → Clique no último deploy → View Logs

**Netlify:**
- Vá no seu site → Deploys → Clique no último deploy → Function logs

### Teste as URLs manualmente:

1. `https://sistema-protocolos-juridicos-production.up.railway.app/api/test`
2. `https://sistema-protocolos-juridicos-production.up.railway.app/api/admin/funcionarios`

### Console do navegador (F12):

Procure por erros como:
- `blocked by CORS policy`
- `Failed to fetch`
- `Network Error`

## 📞 PRECISA DE AJUDA?

Me envie:
1. ✅ Railway: https://sistema-protocolos-juridicos-production.up.railway.app
2. ✅ Netlify: https://ncasistemaprotocolos.netlify.app
3. Screenshot do erro no console (F12)
4. Logs do Railway (se houver erros)

**🎯 Com essas informações, posso ajudar você a resolver rapidamente!**