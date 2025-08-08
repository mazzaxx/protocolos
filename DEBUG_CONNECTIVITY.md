# 🔧 DEBUG: Conectividade Sistema de Protocolos

## 🎯 **CONFIGURAÇÃO ATUAL**
- **Backend Railway:** https://sistema-protocolos-juridicos-production.up.railway.app
- **Frontend Netlify:** https://ncasistemaprotocolos.netlify.app

## 🚨 **CORREÇÕES APLICADAS**

### 1. **CORS Melhorado**
- ✅ Adicionado suporte para deploy previews do Netlify
- ✅ Logs detalhados de CORS em produção
- ✅ Permitindo temporariamente origins não listadas para debug

### 2. **Headers de Requisição**
- ✅ Adicionado header `Origin` em todas as requisições
- ✅ Melhor tratamento de erros HTTP
- ✅ Logs detalhados de conectividade

### 3. **Validações de Configuração**
- ✅ Verificação se `VITE_API_BASE_URL` está configurada
- ✅ Health check antes de enviar protocolos
- ✅ Mensagens de erro mais claras

### 4. **Debug Visual**
- ✅ Status de conectividade mostra URLs sendo usadas
- ✅ Logs detalhados no console do navegador
- ✅ Informações de debug no componente de status

## 🧪 **COMO TESTAR**

### 1. **Verificar Configuração**
Abra o console do navegador (F12) e procure por:
```
🌐 Configuração atual:
   - Backend: https://sistema-protocolos-juridicos-production.up.railway.app
   - Frontend: https://ncasistemaprotocolos.netlify.app
```

### 2. **Testar Backend Diretamente**
Acesse: https://sistema-protocolos-juridicos-production.up.railway.app
Deve retornar: `{"message":"Servidor de autenticação funcionando!"}`

### 3. **Testar Health Check**
No console, procure por:
```
🏥 Verificando saúde do backend: https://sistema-protocolos-juridicos-production.up.railway.app/health
✅ Backend online: {status: "healthy", ...}
```

### 4. **Testar CORS**
No console, procure por:
```
🌐 CORS - Origin recebido: https://ncasistemaprotocolos.netlify.app
✅ CORS - Origin permitida: https://ncasistemaprotocolos.netlify.app
```

## 🔍 **DIAGNÓSTICO DE PROBLEMAS**

### Se ainda houver erro "Failed to fetch":

1. **Verificar se o Railway está online:**
   ```
   curl https://sistema-protocolos-juridicos-production.up.railway.app
   ```

2. **Verificar logs do Railway:**
   - Acesse Railway Dashboard
   - Vá em Deployments → View Logs
   - Procure por erros de CORS ou conexão

3. **Verificar variáveis de ambiente no Netlify:**
   - Site Settings → Environment Variables
   - `VITE_API_BASE_URL` deve estar definida

### Se o erro persistir:

1. **Limpar cache do navegador**
2. **Fazer hard refresh** (Ctrl+Shift+R)
3. **Verificar se não há firewall corporativo bloqueando**

## 📞 **PRÓXIMOS PASSOS**

1. Faça deploy das alterações
2. Teste o envio de protocolo
3. Verifique os logs no console
4. Se ainda houver problemas, me envie:
   - Screenshot do console (F12)
   - URL exata que está sendo usada
   - Logs do Railway (se possível)

## ⚡ **MELHORIAS IMPLEMENTADAS**

- 🔄 Retry automático mais inteligente
- 📊 Logs detalhados para debug
- 🛡️ Validações de configuração
- 🌐 CORS mais permissivo
- 📱 Funciona de qualquer lugar (casa/escritório)
- 👥 Sincronização em tempo real entre todos os funcionários