# 🚀 INSTRUÇÕES DE DEPLOY - SQUARE CLOUD

## ✅ NOVO: BUILD AUTOMÁTICO NA SQUARE CLOUD

O sistema agora executa o build **AUTOMATICAMENTE** na Square Cloud! Não é mais necessário fazer build manual.

## 📋 PASSO A PASSO PARA DEPLOY

### 1. Commit das Alterações (SIMPLES)
```bash
# Adicionar arquivos modificados
git add .
git commit -m "Atualização do sistema - Square Cloud"
```

### 2. Deploy na Square Cloud
1. Faça push para o repositório
2. A Square Cloud detectará as mudanças
3. O build será executado automaticamente
4. O servidor iniciará automaticamente

## 🔧 ESTRUTURA OTIMIZADA

### Arquivos Importantes:
- `build-and-start.js` - Script que executa build automático
- `squarecloud.config` - Configuração da plataforma
- `server/` - Backend Node.js + SQLite

### Fluxo de Deploy:
1. **Git**: Commit das alterações
2. **Square Cloud**: Executa `build-and-start.js`
3. **Build**: Executado automaticamente se necessário
4. **Servidor**: Serve React + API Node.js

## ✅ VANTAGENS DESTA ABORDAGEM

### 🎯 Build Automático:
- ✅ Não precisa fazer build manual
- ✅ Build sempre atualizado na Square Cloud
- ✅ Menos chance de erro humano
- ✅ Deploy mais simples e rápido

### 🌐 Fullstack em Um Domínio:
- ✅ Mais simples de gerenciar
- ✅ Sem problemas de CORS
- ✅ Um único deploy
- ✅ Custo menor

### 🚀 Square Cloud Otimizada:
- ✅ SQLite funciona perfeitamente
- ✅ Servidor Node.js nativo
- ✅ Domínio brasileiro (.squareweb.app)
- ✅ Deploy automático via Git

## 🔄 COMANDOS ÚTEIS

```bash
# Desenvolvimento local completo
npm run dev:full

# Build para produção
npm run build

# Testar build localmente
npm run preview

# Build + Start (para testar localmente)
npm run build:start
```

## 🚨 TROUBLESHOOTING

### Problema: "Build não encontrado"
**Solução**: Execute `npm run build` antes do deploy

### Problema: "Vite not found"
**Solução**: O build local resolve isso automaticamente

### Problema: "Fallback HTML"
**Solução**: Significa que o build não foi feito. Execute `npm run build`

## 📊 MONITORAMENTO

### Logs da Square Cloud:
- ✅ "Build do React encontrado!" = Sucesso
- ⚠️ "Build incompleto detectado" = Execute npm run build
- ❌ "Build não encontrado" = Faltou fazer o build

### URLs Importantes:
- **Aplicação**: https://seu-app.squareweb.app
- **Health Check**: https://seu-app.squareweb.app/health
- **API**: https://seu-app.squareweb.app/api/protocolos

## 🎉 RESULTADO FINAL

Após seguir estas instruções:
1. ✅ Sistema funcionando na Square Cloud
2. ✅ React + Node.js em um domínio
3. ✅ SQLite persistente
4. ✅ Deploy automático
5. ✅ Performance otimizada

---

**🚀 Agora execute: `npm run build` e faça o deploy!**