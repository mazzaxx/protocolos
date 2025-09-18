# Sistema de Protocolos Jurídicos

Sistema completo para gerenciamento de protocolos jurídicos hospedado na **Square Cloud**.

## ☁️ HOSPEDAGEM SQUARE CLOUD

Este sistema está otimizado para funcionar na **Square Cloud**, a plataforma brasileira de hospedagem:

### ✅ Vantagens da Square Cloud
- 🇧🇷 **Plataforma Brasileira**: Baixa latência no Brasil
- 🚀 **Deploy Automático**: Via Git, sem configuração complexa
- 💾 **SQLite Nativo**: Banco funciona perfeitamente
- 💰 **Plano Gratuito**: Ideal para começar
- 🔧 **Node.js Nativo**: Suporte completo
- 📊 **Monitoramento**: Logs e métricas em tempo real

### 🌐 URLs do Sistema
- **Produção**: https://sistema-protocolos.squareweb.app
- **Desenvolvimento**: http://localhost:5173
- **API**: https://sistema-protocolos.squareweb.app/api

## 🚀 Deploy na Square Cloud

### Passo 1: Preparar o Projeto
1. Clone este repositório
2. Certifique-se de que o arquivo `squarecloud.config` está na raiz
3. Verifique se todas as dependências estão no `package.json`

### Passo 2: Criar Conta na Square Cloud
1. Acesse: https://squarecloud.app
2. Faça cadastro/login com GitHub
3. Conecte sua conta GitHub

### Passo 3: Deploy Automático
1. No painel da Square Cloud, clique em "Nova Aplicação"
2. Selecione "GitHub Repository"
3. Escolha este repositório
4. A Square Cloud detectará automaticamente o Node.js
5. Deploy será feito automaticamente em 2-5 minutos

### Passo 4: Configurar Variáveis (Opcional)
No painel da Square Cloud, adicione se necessário:
```
NODE_ENV=production
VITE_API_BASE_URL=https://seu-app.squareweb.app
```

### ✅ Pronto!
Seu sistema estará disponível em: `https://seu-app.squareweb.app`

## 🔄 Atualizações Automáticas

- **Deploy Contínuo**: Toda vez que você fizer push, a Square Cloud faz redeploy automático
- **Sem Configuração**: Não precisa configurar nada adicional
- **Logs em Tempo Real**: Monitore via painel da Square Cloud

## Como executar o projeto

### 1. Instalar dependências
```bash
npm install
```

### 2. Modos de execução

#### Desenvolvimento Completo (Recomendado)
```bash
npm run dev:full
```

#### Frontend + Square Cloud Backend
```bash
npm run dev:cloud
```

#### Apenas Backend Local
```bash
npm run server
```

#### Build para Produção
```bash
npm run build
```

## 🗄️ Banco de Dados SQLite na Square Cloud

### ✅ Vantagens do SQLite na Square Cloud
- **Sem Configuração**: Funciona nativamente na plataforma
- **Persistência**: Dados mantidos entre deploys
- **Performance**: WAL mode + Pool de 15 conexões
- **Backup Automático**: Square Cloud faz backup dos dados
- **Escalabilidade**: Suporta 100+ usuários simultâneos
- **Otimizações**: Cache de 10MB, memory-mapped I/O

### 🔧 Configurações Otimizadas
```sql
-- WAL mode para concorrência
PRAGMA journal_mode = WAL;

-- Cache otimizado para Square Cloud
PRAGMA cache_size = 10000;

-- Timeout configurado
PRAGMA busy_timeout = 30000;
```

## 🔄 Sincronização de Dados

**IMPORTANTE:** Sistema com sincronização em tempo real otimizada para Square Cloud.

### Como funciona:
- Todos os protocolos são salvos no servidor Square Cloud
- Dados são sincronizados automaticamente a cada 3 segundos
- Mudanças feitas por qualquer usuário aparecem para todos
- Cache inteligente reduz requisições desnecessárias
- Polling adaptativo baseado na atividade do usuário

### Se os dados não estão sincronizando:
1. Verifique se o servidor Square Cloud está online
2. Teste a URL: https://sistema-protocolos.squareweb.app
3. Verifique o console do navegador (F12) para erros
4. Verifique logs no painel da Square Cloud

## 🔐 Acesso ao Sistema

- **URL de produção:** https://sistema-protocolos.squareweb.app
- **URL de desenvolvimento:** http://localhost:5173
- **Email de teste:** admin@escritorio.com  
- **Senha de teste:** 123456

## ⚡ Funcionalidades Otimizadas para Square Cloud

### 🚀 Performance
- **SQLite WAL Mode**: Concorrência otimizada para Square Cloud
- **Connection Pooling**: 15 conexões simultâneas
- **Cache Inteligente**: Reduz latência e uso de banda
- **Polling Adaptativo**: Economiza recursos da plataforma
- **Índices Otimizados**: Queries rápidas mesmo com milhares de protocolos
- **Logs Otimizados**: Prefixo `[SQUARE CLOUD]` para fácil identificação

### 🔐 Autenticação
- Login com email e senha
- Proteção de rotas
- Logout seguro
- Dados do usuário no header
- Validação robusta de credenciais

### 📋 Painel de Protocolos
- Envio de protocolos
- Fila do robô (automática)
- Fila do Carlos (manual)
- Fila da Deyse (manual)
- Acompanhamento de status
- Sistema de devoluções
- Logs de atividade detalhados

### 🗄️ Banco de Dados na Square Cloud
- **SQLite Nativo**: Funciona perfeitamente na plataforma
- **WAL Mode**: Concorrência otimizada
- **Pool de Conexões**: 15 conexões para alta performance
- **Manutenção Automática**: A cada 6 horas
- **Backup Automático**: Pela Square Cloud
- **Índices Otimizados**: Para consultas rápidas

## 📁 Estrutura do Projeto Otimizada

```
squarecloud.config          # Configuração da Square Cloud
src/
├── components/
│   ├── Login.tsx           # Login otimizado para Square Cloud
│   ├── Header.tsx          # Header com info da plataforma
│   ├── ProtectedRoute.tsx  # Proteção de rotas
│   └── ...                 # Componentes do painel
├── contexts/
│   └── AuthContext.tsx     # Autenticação com Square Cloud
├── hooks/
│   └── useProtocols.ts     # Hook otimizado para Square Cloud
└── ...

server/
├── server.js              # Servidor Express para Square Cloud
├── auth.js                # Autenticação otimizada
├── protocols.js           # API de protocolos
├── admin.js               # Administração
├── db.js                  # SQLite otimizado para Square Cloud
└── database.sqlite        # Banco SQLite persistente
```

## 🛠️ Tecnologias Otimizadas para Square Cloud

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js 18+, Express
- **Banco**: SQLite3 com WAL mode e pooling
- **Hospedagem**: Square Cloud (plataforma brasileira)
- **Autenticação**: Context API + localStorage
- **Cache**: Sistema inteligente com TTL
- **Logs**: Prefixo `[SQUARE CLOUD]` para identificação
- **Performance**: Otimizada para 100+ usuários simultâneos

## 📊 Monitoramento na Square Cloud

### 🔍 Logs Detalhados
Todos os logs incluem prefixo `[SQUARE CLOUD]`:
```javascript
console.log('[SQUARE CLOUD] 🚀 Servidor iniciado');
console.log('[SQUARE CLOUD] 📝 Protocolo criado:', id);
console.error('[SQUARE CLOUD] ❌ Erro:', error);
```

### 📈 Métricas Importantes
- Tempo de resposta das queries
- Número de conexões ativas no pool
- Uso de memória e CPU
- Erros e exceções
- Status de sincronização

### 🔧 Debugging
- Logs em tempo real no painel da Square Cloud
- Health checks automáticos
- Estatísticas do banco de dados
- Monitoramento de performance

## 🚨 Troubleshooting Square Cloud

### Problemas Comuns

#### 1. Erro de CORS
**Sintoma**: "blocked by CORS policy"
**Solução**: Verificar se domínio está em `allowedOrigins` no `server.js`

#### 2. Banco não conecta
**Sintoma**: "Database connection failed"
**Solução**: SQLite funciona automaticamente na Square Cloud, verificar logs

#### 3. Deploy falha
**Sintoma**: "Build failed"
**Solução**: Verificar se `npm run build` funciona localmente

#### 4. Aplicação não inicia
**Sintoma**: "Application failed to start"
**Solução**: Verificar `squarecloud.config` e script "start" no `package.json`

### 🔧 Comandos de Debug
```bash
# Testar API localmente
curl http://localhost:3000/health

# Testar API na Square Cloud
curl https://seu-app.squareweb.app/health

# Build local
npm run build

# Testar produção localmente
npm run preview:production
```

## 💰 Custos Square Cloud

### 🆓 Plano Gratuito
- ✅ 512MB RAM
- ✅ 1GB armazenamento
- ✅ Domínio .squareweb.app
- ✅ Deploy automático
- ⚠️ Limitações de tráfego

### 💎 Planos Pagos
- 🚀 Mais RAM e armazenamento
- 🚀 Domínio customizado
- 🚀 Tráfego ilimitado
- 🚀 Suporte prioritário
- 🚀 Backups avançados

## 📞 Suporte Square Cloud

### 🔗 Recursos
- **Documentação**: https://docs.squarecloud.app
- **Discord**: Comunidade brasileira ativa
- **GitHub**: https://github.com/squarecloudofc
- **YouTube**: Tutoriais em português

### 🇧🇷 Comunidade Brasileira
- Suporte em português
- Exemplos e templates
- Ajuda entre desenvolvedores
- Atualizações frequentes

## ✅ Checklist de Deploy

Antes do deploy na Square Cloud:
- [ ] `squarecloud.config` configurado
- [ ] Script "start" no `package.json`
- [ ] Variáveis de ambiente definidas
- [ ] CORS configurado para Square Cloud
- [ ] Logs com prefixo `[SQUARE CLOUD]`
- [ ] Build funciona localmente (`npm run build`)
- [ ] Testes passando (`npm run test:connectivity`)

## 🎉 Sistema Pronto na Square Cloud!

Após seguir este guia, seu sistema estará:
- ✅ Hospedado na Square Cloud
- ✅ Com banco SQLite funcionando
- ✅ Deploy automático configurado
- ✅ Logs detalhados para monitoramento
- ✅ Performance otimizada para Brasil
- ✅ Pronto para produção!

---

**🚀 Desenvolvido para funcionar perfeitamente na Square Cloud - A plataforma brasileira de hospedagem!**