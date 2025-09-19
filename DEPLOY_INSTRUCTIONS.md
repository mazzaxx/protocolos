# 🚀 INSTRUÇÕES DE DEPLOY - SQUARE CLOUD

## ⚠️ IMPORTANTE: BUILD OBRIGATÓRIO ANTES DO DEPLOY

Para evitar problemas de build na Square Cloud, **SEMPRE** execute o build localmente antes de fazer o deploy.

## 📋 PASSO A PASSO PARA DEPLOY

### 1. Build Local (OBRIGATÓRIO)
```bash
# Execute o build localmente
npm run build

# Verificar se a pasta dist foi criada
ls -la dist/
```

### 2. Commit das Alterações
```bash
# Adicionar arquivos do build
git add dist/
git add .
git commit -m "Build para produção - Square Cloud"
```

### 3. Deploy na Square Cloud
1. Faça push para o repositório
2. A Square Cloud detectará as mudanças
3. O servidor iniciará automaticamente

## 🔧 ESTRUTURA OTIMIZADA

### Arquivos Importantes:
- `dist/` - Build do React (DEVE estar commitado)
- `build-and-start.js` - Script otimizado para Square Cloud
- `squarecloud.config` - Configuração da plataforma
- `server/` - Backend Node.js + SQLite

### Fluxo de Deploy:
1. **Local**: `npm run build` (cria pasta `dist/`)
2. **Git**: Commit da pasta `dist/`
3. **Square Cloud**: Executa `build-and-start.js`
4. **Servidor**: Serve React + API Node.js

## ✅ VANTAGENS DESTA ABORDAGEM

### 🎯 Build Local:
- ✅ Evita problemas de dependências na Square Cloud
- ✅ Build mais rápido e confiável
- ✅ Controle total sobre o processo
- ✅ Debugging mais fácil

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