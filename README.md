# 🚀 Sistema de Protocolos Jurídicos - Square Cloud

Sistema completo para gerenciamento de protocolos jurídicos hospedado exclusivamente na **Square Cloud**.

## ☁️ HOSPEDAGEM SQUARE CLOUD

Este sistema está otimizado para funcionar na **Square Cloud**, a plataforma brasileira de hospedagem:

### ✅ Vantagens da Square Cloud
- 🇧🇷 **Plataforma Brasileira**: Baixa latência no Brasil
- 🚀 **Deploy Automático**: Via Git, sem configuração complexa
- 💾 **SQLite Nativo**: Banco funciona perfeitamente
- 💰 **Plano Gratuito**: Ideal para começar
- 🔧 **Node.js Nativo**: Suporte completo
- 📊 **Monitoramento**: Logs e métricas em tempo real
- 🌐 **Mesmo Domínio**: Frontend e backend juntos

## 🚀 DEPLOY NA SQUARE CLOUD

### Passo 1: Preparar o Repositório
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

### ✅ Pronto!
Seu sistema estará disponível em: `https://seu-app.squareweb.app`

## 🔄 ATUALIZAÇÕES AUTOMÁTICAS

- **Deploy Contínuo**: Toda vez que você fizer push, a Square Cloud faz redeploy automático
- **Sem Configuração**: Não precisa configurar nada adicional
- **Logs em Tempo Real**: Monitore via painel da Square Cloud

## 🗄️ BANCO DE DADOS SQLITE

### ✅ Vantagens do SQLite na Square Cloud
- **Sem Configuração**: Funciona nativamente na plataforma
- **Persistência**: Dados mantidos entre deploys
- **Performance**: WAL mode + Pool de 15 conexões
- **Backup Automático**: Square Cloud faz backup dos dados
- **Escalabilidade**: Suporta 100+ usuários simultâneos

## 🌐 ARQUITETURA UNIFICADA

### Frontend + Backend no Mesmo Domínio
- **Frontend**: React SPA servido estaticamente
- **Backend**: Node.js + Express + SQLite
- **Porta**: 80 (padrão Square Cloud)
- **Host**: 0.0.0.0 (aceita conexões externas)
- **URLs**: Relativas (mesmo domínio)

### Estrutura de Arquivos
```
/
├── dist/                   # Frontend buildado (React)
├── server/                 # Backend (Node.js)
│   ├── server.js          # Servidor principal
│   ├── db.js              # SQLite otimizado
│   ├── auth.js            # Autenticação
│   ├── protocols.js       # API de protocolos
│   └── admin.js           # Administração
├── src/                   # Código fonte React
├── squarecloud.config     # Configuração Square Cloud
└── package.json           # Dependências
```

## 🔐 ACESSO AO SISTEMA

- **Email de teste:** admin@escritorio.com  
- **Senha de teste:** 123456

## ⚡ FUNCIONALIDADES

### 🚀 Performance Otimizada
- **SQLite WAL Mode**: Concorrência otimizada
- **Connection Pooling**: 15 conexões simultâneas
- **Cache Inteligente**: Reduz latência
- **Polling Adaptativo**: Economiza recursos
- **Logs Otimizados**: Prefixo `[SQUARE CLOUD]`

### 🔐 Autenticação
- Login com email e senha
- Proteção de rotas
- Dados do usuário no header

### 📋 Painel de Protocolos
- Envio de protocolos
- Fila do robô (automática)
- Fila do Carlos (manual)
- Fila da Deyse (manual)
- Acompanhamento de status
- Sistema de devoluções

## 🛠️ DESENVOLVIMENTO LOCAL

### Comandos Disponíveis
```bash
# Instalar dependências
npm install

# Desenvolvimento completo (frontend + backend)
npm run dev:full

# Apenas backend
npm run server

# Apenas frontend
npm run dev

# Build para produção
npm run build

# Iniciar produção (usado pela Square Cloud)
npm start
```

## 📊 MONITORAMENTO

### Health Check
- **URL**: `/health`
- **Retorna**: Status do sistema, banco, performance

### Logs Detalhados
Todos os logs incluem prefixo `[SQUARE CLOUD]`:
```javascript
console.log('[SQUARE CLOUD] 🚀 Servidor iniciado');
console.log('[SQUARE CLOUD] 📝 Protocolo criado:', id);
```

## 🚨 TROUBLESHOOTING

### Problemas Comuns

#### 1. Frontend não aparece
**Causa**: Build não foi executado
**Solução**: A Square Cloud executa `npm run build` automaticamente

#### 2. Erro de CORS
**Causa**: Domínio não permitido
**Solução**: CORS configurado para aceitar qualquer `.squareweb.app`

#### 3. Banco não conecta
**Causa**: SQLite deve funcionar automaticamente
**Solução**: Verificar logs no painel da Square Cloud

## 💰 CUSTOS SQUARE CLOUD

### 🆓 Plano Gratuito
- ✅ 512MB RAM
- ✅ 1GB armazenamento
- ✅ Domínio .squareweb.app
- ✅ Deploy automático

### 💎 Planos Pagos
- 🚀 Mais recursos
- 🚀 Domínio customizado
- 🚀 Tráfego ilimitado

## 📞 SUPORTE

- **Documentação**: https://docs.squarecloud.app
- **Discord**: Comunidade brasileira
- **GitHub**: https://github.com/squarecloudofc

## ✅ CHECKLIST DE DEPLOY

- [ ] `squarecloud.config` na raiz
- [ ] Script "start" no `package.json`
- [ ] Código commitado no GitHub
- [ ] Repositório conectado na Square Cloud
- [ ] Deploy automático funcionando

## 🎉 SISTEMA PRONTO!

Após o deploy na Square Cloud:
- ✅ Frontend e backend no mesmo domínio
- ✅ SQLite funcionando automaticamente
- ✅ Deploy automático configurado
- ✅ Logs detalhados disponíveis
- ✅ Sistema pronto para produção!

---

**🚀 Desenvolvido exclusivamente para Square Cloud - A plataforma brasileira de hospedagem!**