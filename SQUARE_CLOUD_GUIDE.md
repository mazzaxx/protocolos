# 🚀 GUIA COMPLETO - SQUARE CLOUD

## 📋 PASSO A PASSO PARA DEPLOY

### 1. 🗂️ PREPARAR O REPOSITÓRIO

```bash
# 1. Criar novo repositório no GitHub
# 2. Clonar este código
# 3. Fazer commit de todos os arquivos
git add .
git commit -m "Sistema jurídico para Square Cloud"
git push origin main
```

### 2. 🌐 ACESSAR SQUARE CLOUD

1. Acesse: **https://squarecloud.app**
2. Clique em **"Entrar"**
3. Faça login com sua conta **GitHub**
4. Autorize a Square Cloud a acessar seus repositórios

### 3. 🚀 CRIAR APLICAÇÃO

1. No painel, clique em **"Nova Aplicação"**
2. Selecione **"GitHub Repository"**
3. Escolha o repositório com este código
4. A Square Cloud detectará automaticamente:
   - **Linguagem**: Node.js
   - **Arquivo principal**: `server/server.js`
   - **Porta**: 80

### 4. ⚙️ CONFIGURAÇÃO AUTOMÁTICA

A Square Cloud lerá o arquivo `squarecloud.config`:
```
MAIN=server/server.js
MEMORY=512
VERSION=recommended
NODE_ENV=production
PORT=80
HOST=0.0.0.0
```

### 5. 🔄 DEPLOY AUTOMÁTICO

1. A Square Cloud iniciará o build automaticamente
2. Executará `npm install`
3. Executará `npm run build` (para o frontend React)
4. Iniciará o servidor com `npm start`
5. Em 2-5 minutos, sua aplicação estará online!

### 6. 🌐 ACESSAR O SISTEMA

Sua URL será algo como:
- `https://seu-app.squareweb.app`
- `https://sistema-juridico.squareweb.app`

## 🔧 COMO FUNCIONA

### Frontend + Backend Unificado
```
https://seu-app.squareweb.app/
├── / (React SPA - Frontend)
├── /api/login (Backend - Autenticação)
├── /api/protocolos (Backend - Protocolos)
├── /health (Backend - Status)
└── /* (React Router - SPA)
```

### Fluxo de Requisições
1. **Frontend**: React servido estaticamente da pasta `dist/`
2. **API**: Rotas `/api/*` processadas pelo Express
3. **SPA**: Todas as outras rotas retornam `index.html`

## 📊 MONITORAMENTO

### Logs em Tempo Real
No painel da Square Cloud:
1. Clique na sua aplicação
2. Vá em **"Logs"**
3. Veja logs em tempo real com prefixo `[SQUARE CLOUD]`

### Health Check
Acesse: `https://seu-app.squareweb.app/health`
```json
{
  "status": "healthy",
  "message": "Sistema Jurídico funcionando na Square Cloud",
  "database": "connected",
  "platform": "Square Cloud"
}
```

## 🔄 ATUALIZAÇÕES

### Deploy Automático
1. Faça alterações no código
2. Commit e push para GitHub:
   ```bash
   git add .
   git commit -m "Atualização do sistema"
   git push origin main
   ```
3. A Square Cloud fará redeploy automaticamente!

## 🗄️ BANCO DE DADOS

### SQLite Nativo
- **Arquivo**: `server/database.sqlite`
- **Modo**: WAL (Write-Ahead Logging)
- **Pool**: 15 conexões simultâneas
- **Backup**: Automático pela Square Cloud

### Usuários de Teste
```
Admin: admin@escritorio.com / 123456
Moderador: mod@escritorio.com / 123456
Advogado: advogado@escritorio.com / 123456
```

## 🚨 TROUBLESHOOTING

### ❌ Problema: "Aplicação não inicia"
**Solução**: Verificar se `squarecloud.config` está correto

### ❌ Problema: "Frontend não aparece"
**Solução**: Square Cloud executa `npm run build` automaticamente

### ❌ Problema: "Erro de CORS"
**Solução**: CORS já configurado para `.squareweb.app`

### ❌ Problema: "Banco não conecta"
**Solução**: SQLite funciona nativamente, verificar logs

## 💰 CUSTOS

### 🆓 Plano Gratuito
- **RAM**: 512MB
- **Armazenamento**: 1GB
- **Domínio**: .squareweb.app
- **Ideal para**: Testes e projetos pequenos

### 💎 Planos Pagos
- **Mais recursos**: RAM e armazenamento
- **Domínio customizado**: seu-dominio.com
- **Tráfego ilimitado**
- **Suporte prioritário**

## 📞 SUPORTE

### Recursos Oficiais
- **Docs**: https://docs.squarecloud.app
- **Discord**: Comunidade ativa em português
- **GitHub**: https://github.com/squarecloudofc

### Comunidade Brasileira
- Suporte em português 🇧🇷
- Exemplos práticos
- Ajuda entre desenvolvedores

## ✅ CHECKLIST FINAL

Antes do deploy, verifique:
- [ ] Código commitado no GitHub
- [ ] `squarecloud.config` na raiz do projeto
- [ ] `package.json` com script "start"
- [ ] Repositório conectado na Square Cloud
- [ ] Deploy iniciado automaticamente

## 🎉 SUCESSO!

Após seguir este guia:
- ✅ Sistema funcionando na Square Cloud
- ✅ Frontend e backend no mesmo domínio
- ✅ SQLite funcionando automaticamente
- ✅ Deploy automático configurado
- ✅ Logs detalhados disponíveis
- ✅ Pronto para produção!

---

**🚀 Parabéns! Seu sistema jurídico está rodando na Square Cloud!**

Para futuras atualizações, basta fazer push no GitHub que o deploy será automático.