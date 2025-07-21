# 🚀 Instruções Completas de Deploy

## Problema Comum: "Erro de conexão"

Se você está vendo "Erro de conexão. Tente novamente." na tela de login, significa que o frontend não consegue se comunicar com o backend. Siga estes passos:

## 1. 📋 Informações Necessárias

Antes de começar, você precisa ter:
- URL do seu projeto no Railway (ex: `https://sistema-juridico-production.up.railway.app`)
- URL do seu site no Netlify (ex: `https://sistema-juridico.netlify.app`)

## 2. 🔧 Configurar Backend (Railway)

### 2.1 Verificar se o deploy funcionou
1. Acesse sua URL do Railway no navegador
2. Você deve ver: `{"message":"Servidor de autenticação funcionando!"}`
3. Teste a rota de funcionários: `https://sua-url-railway.up.railway.app/api/admin/funcionarios`

### 2.2 Configurar CORS
No arquivo `server/server.js`, substitua `'https://seu-site-netlify.netlify.app'` pela sua URL real do Netlify.

## 3. 🌐 Configurar Frontend (Netlify)

### 3.1 Configurar variável de ambiente
1. No painel do Netlify, vá em "Site settings" → "Environment variables"
2. Adicione uma nova variável:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://sua-url-railway.up.railway.app` (SUA URL REAL)

### 3.2 Fazer novo deploy
1. Após adicionar a variável, clique em "Trigger deploy"
2. Aguarde o deploy terminar

## 4. ✅ Testar a Conexão

1. Acesse seu site no Netlify
2. Abra o console do navegador (F12)
3. Tente fazer login com `admin@escritorio.com` / `123456`
4. Se ainda der erro, verifique no console se há erros de CORS

## 5. 🔍 Debugging

### Se ainda não funcionar:

1. **Verificar URLs:**
   - Backend Railway: `https://sua-url.up.railway.app/api/login` deve responder
   - Frontend deve estar fazendo requisições para a URL correta

2. **Verificar CORS:**
   - No console do navegador, procure por erros como "blocked by CORS policy"
   - Certifique-se de que a URL do Netlify está na lista de origens permitidas

3. **Verificar variáveis de ambiente:**
   - No Netlify, vá em "Site settings" → "Environment variables"
   - Confirme que `VITE_API_BASE_URL` está definida corretamente

## 6. 📝 URLs de Exemplo

Substitua pelos seus valores reais:

```bash
# Backend Railway
https://sistema-juridico-production.up.railway.app

# Frontend Netlify  
https://sistema-juridico.netlify.app

# Variável de ambiente no Netlify
VITE_API_BASE_URL=https://sistema-juridico-production.up.railway.app
```

## 7. 🆘 Se Nada Funcionar

1. Verifique os logs do Railway para erros no backend
2. Verifique o console do navegador para erros no frontend
3. Teste as URLs manualmente:
   - `https://sua-url-railway.up.railway.app` → deve mostrar mensagem de funcionamento
   - `https://sua-url-railway.up.railway.app/api/admin/funcionarios` → deve retornar lista de funcionários

## 8. ✨ Após Funcionar

Quando tudo estiver funcionando:
1. Teste o login com as credenciais de teste
2. Verifique se todas as funcionalidades estão operando
3. O sistema estará pronto para uso!

---

**Dica:** Sempre que fizer mudanças no código, você precisará fazer novo deploy tanto no Railway quanto no Netlify.