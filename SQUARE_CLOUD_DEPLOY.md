# 🚀 GUIA COMPLETO DE DEPLOY NA SQUARE CLOUD

## 📋 SOBRE A SQUARE CLOUD

A Square Cloud é uma plataforma brasileira de hospedagem que oferece:
- ✅ Hospedagem gratuita e paga
- ✅ Suporte nativo ao Node.js
- ✅ SQLite funciona perfeitamente
- ✅ Deploy automático via Git
- ✅ Domínios .squareweb.app
- ✅ Baixa latência no Brasil
- ✅ Interface em português

## 🔧 CONFIGURAÇÃO DO PROJETO

### 1. Arquivo de Configuração (squarecloud.config)
```
MAIN=server/server.js
MEMORY=512
VERSION=recommended
NODE_ENV=production
VITE_API_BASE_URL=https://sistema-protocolos.squareweb.app
```

### 2. Scripts do Package.json
```json
{
  "scripts": {
    "start": "node server/server.js",
    "squarecloud": "npm run build && node server/server.js"
  }
}
```

## 🚀 PASSO A PASSO PARA DEPLOY

### Passo 1: Preparar o Repositório
1. Certifique-se de que todos os arquivos estão commitados
2. O arquivo `squarecloud.config` deve estar na raiz
3. Verifique se o `package.json` tem o script "start"

### Passo 2: Criar Conta na Square Cloud
1. Acesse: https://squarecloud.app
2. Faça cadastro/login
3. Conecte sua conta GitHub

### Passo 3: Criar Nova Aplicação
1. No painel, clique em "Nova Aplicação"
2. Selecione "GitHub Repository"
3. Escolha este repositório
4. A Square Cloud detectará automaticamente o Node.js

### Passo 4: Configurar Variáveis de Ambiente
No painel da Square Cloud, adicione:
```
NODE_ENV=production
VITE_API_BASE_URL=https://seu-app.squareweb.app
```

### Passo 5: Deploy Automático
1. A Square Cloud fará o deploy automaticamente
2. O processo leva cerca de 2-5 minutos
3. Você receberá uma URL como: `https://seu-app.squareweb.app`

## 🔄 ATUALIZAÇÕES AUTOMÁTICAS

### Deploy Contínuo
- Toda vez que você fizer push para o repositório
- A Square Cloud automaticamente fará redeploy
- Sem necessidade de configuração adicional

### Monitoramento
- Logs em tempo real no painel
- Métricas de uso e performance
- Alertas automáticos em caso de erro

## 🗄️ BANCO DE DADOS SQLITE

### Vantagens na Square Cloud
- ✅ **Sem configuração**: SQLite funciona nativamente
- ✅ **Persistência**: Dados são mantidos entre deploys
- ✅ **Performance**: Otimizado para a plataforma
- ✅ **Backup**: Square Cloud faz backup automático
- ✅ **Escalabilidade**: Suporta 100+ usuários simultâneos

### Configurações Otimizadas
```javascript
// WAL mode para concorrência
db.run("PRAGMA journal_mode = WAL");

// Cache otimizado para Square Cloud
db.run("PRAGMA cache_size = 10000");

// Timeout configurado
db.run("PRAGMA busy_timeout = 30000");
```

## 🌐 CONFIGURAÇÃO DE CORS

### Domínios Permitidos
```javascript
const allowedOrigins = [
  'https://sistema-protocolos.squareweb.app',
  /^https:\/\/.*\.squareweb\.app$/,
  'http://localhost:5173' // Para desenvolvimento
];
```

### Headers Configurados
```javascript
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
```

## 📊 MONITORAMENTO E LOGS

### Logs Otimizados
Todos os logs incluem prefixo `[SQUARE CLOUD]` para fácil identificação:
```javascript
console.log('[SQUARE CLOUD] Servidor iniciado');
console.log('[SQUARE CLOUD] Protocolo criado:', id);
console.error('[SQUARE CLOUD] Erro:', error);
```

### Métricas Importantes
- Tempo de resposta das queries
- Número de conexões ativas
- Uso de memória
- Erros e exceções

## 🔧 DESENVOLVIMENTO LOCAL

### Comandos Úteis
```bash
# Desenvolvimento completo (backend + frontend)
npm run dev:full

# Apenas frontend (usando Square Cloud como backend)
npm run dev:cloud

# Build para produção
npm run build

# Testar build localmente
npm run preview:production
```

### Variáveis de Ambiente
```bash
# .env.local (desenvolvimento)
VITE_API_BASE_URL=http://localhost:3000

# .env.production (Square Cloud)
VITE_API_BASE_URL=https://seu-app.squareweb.app
```

## 🚨 TROUBLESHOOTING

### Problemas Comuns

#### 1. Erro de CORS
**Sintoma**: "blocked by CORS policy"
**Solução**: Verificar se o domínio está em `allowedOrigins`

#### 2. Banco não conecta
**Sintoma**: "Database connection failed"
**Solução**: Verificar logs da Square Cloud, SQLite deve funcionar automaticamente

#### 3. Build falha
**Sintoma**: Deploy falha na etapa de build
**Solução**: Verificar se `npm run build` funciona localmente

#### 4. Aplicação não inicia
**Sintoma**: "Application failed to start"
**Solução**: Verificar se `MAIN=server/server.js` está correto no `squarecloud.config`

### Comandos de Debug
```bash
# Testar conectividade
curl https://seu-app.squareweb.app/health

# Testar API
curl https://seu-app.squareweb.app/api/protocolos

# Ver logs em tempo real
# (disponível no painel da Square Cloud)
```

## 💰 CUSTOS E LIMITES

### Plano Gratuito
- ✅ 512MB RAM
- ✅ 1GB armazenamento
- ✅ Domínio .squareweb.app
- ✅ Deploy automático
- ⚠️ Limitações de tráfego

### Planos Pagos
- 🚀 Mais RAM e armazenamento
- 🚀 Domínio customizado
- 🚀 Tráfego ilimitado
- 🚀 Suporte prioritário

## 🔐 SEGURANÇA

### Configurações Implementadas
- ✅ CORS restritivo
- ✅ Validação de entrada
- ✅ Sanitização de dados
- ✅ Logs de auditoria
- ✅ Tratamento de erros

### Recomendações Adicionais
- 🔒 Implementar JWT para autenticação
- 🔒 Adicionar rate limiting
- 🔒 Configurar HTTPS (automático na Square Cloud)
- 🔒 Monitorar logs de segurança

## 📞 SUPORTE

### Recursos Disponíveis
- 📚 Documentação: https://docs.squarecloud.app
- 💬 Discord: Comunidade ativa
- 📧 Email: Suporte técnico
- 🎥 YouTube: Tutoriais em português

### Comunidade
- 🇧🇷 Comunidade brasileira ativa
- 💡 Exemplos e templates
- 🤝 Ajuda entre desenvolvedores
- 📈 Atualizações frequentes

## ✅ CHECKLIST FINAL

Antes do deploy, verifique:
- [ ] `squarecloud.config` configurado
- [ ] Scripts do `package.json` corretos
- [ ] Variáveis de ambiente definidas
- [ ] CORS configurado para Square Cloud
- [ ] Logs com prefixo `[SQUARE CLOUD]`
- [ ] Build funciona localmente
- [ ] Testes de conectividade passando

## 🎉 DEPLOY REALIZADO!

Após o deploy bem-sucedido:
1. ✅ Aplicação disponível em: `https://seu-app.squareweb.app`
2. ✅ Banco SQLite funcionando automaticamente
3. ✅ Logs disponíveis no painel
4. ✅ Deploy automático configurado
5. ✅ Sistema pronto para produção!

---

**🚀 Parabéns! Seu sistema jurídico está rodando na Square Cloud!**

Para futuras modificações, basta fazer push no repositório que o deploy será automático.