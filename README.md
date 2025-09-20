# Sistema de Protocolos Jurídicos - Neycampos Advocacia

Sistema completo para gerenciamento de protocolos jurídicos desenvolvido para o Escritório de Advocacia Neycampos.

## 🚀 Hospedagem Square Cloud

Este sistema está otimizado para funcionar na **Square Cloud**, a plataforma brasileira de hospedagem.

### ✅ Vantagens da Square Cloud
- 🇧🇷 **Plataforma Brasileira**: Baixa latência no Brasil
- 🚀 **Deploy Automático**: Via Git, sem configuração complexa
- 💾 **SQLite Nativo**: Banco funciona perfeitamente
- 💰 **Plano Gratuito**: Ideal para começar
- 🔧 **Node.js Nativo**: Suporte completo
- 📊 **Monitoramento**: Logs e métricas em tempo real

## 🔧 Como executar o projeto

### ⚠️ Limitação de Memória na Square Cloud

**IMPORTANTE:** Se sua hospedagem tem apenas 1024MB de RAM:

1. **Opção A - Build Local (Recomendado):**
```bash
npm run build
git add dist/
git commit -m "Add build files"
git push
```

2. **Opção B - Upgrade de Plano:**
   - Upgrade para 2048MB+ de RAM
   - Build automático funcionará perfeitamente

### 1. Instalar dependências
```bash
npm install
```

### 2. Executar em desenvolvimento
```bash
npm run dev:full
```

### 3. Build para produção
```bash
npm run build:memory-safe  # Otimizado para 1024MB
```

### 4. Executar em produção
```bash
npm start
```

## 🗄️ Banco de Dados SQLite

### ✅ Vantagens do SQLite na Square Cloud
- **Sem Configuração**: Funciona nativamente na plataforma
- **Persistência**: Dados mantidos entre deploys
- **Performance**: WAL mode + Pool de 15 conexões
- **Backup Automático**: Square Cloud faz backup dos dados
- **Escalabilidade**: Suporta 100+ usuários simultâneos
- **Otimizações**: Cache de 10MB, memory-mapped I/O

## 🔐 Acesso ao Sistema

- **Email de teste:** admin@escritorio.com  
- **Senha de teste:** 123456

## ⚡ Funcionalidades

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

### 🗄️ Banco de Dados
- **SQLite Nativo**: Funciona perfeitamente na Square Cloud
- **WAL Mode**: Concorrência otimizada
- **Pool de Conexões**: 15 conexões para alta performance
- **Manutenção Automática**: A cada 6 horas
- **Backup Automático**: Pela Square Cloud
- **Índices Otimizados**: Para consultas rápidas

## 📁 Estrutura do Projeto

```
squarecloud.config          # Configuração da Square Cloud
src/
├── components/
│   ├── Login.tsx           # Login do sistema
│   ├── Header.tsx          # Header com branding
│   ├── ProtectedRoute.tsx  # Proteção de rotas
│   └── ...                 # Componentes do painel
├── contexts/
│   └── AuthContext.tsx     # Autenticação
├── hooks/
│   └── useProtocols.ts     # Hook de protocolos
└── ...

server/
├── server.js              # Servidor Express
├── auth.js                # Autenticação
├── protocols.js           # API de protocolos
├── admin.js               # Administração
├── db.js                  # SQLite otimizado
└── database.sqlite        # Banco SQLite persistente
```

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js 18+, Express
- **Banco**: SQLite3 com WAL mode e pooling
- **Hospedagem**: Square Cloud (plataforma brasileira)
- **Autenticação**: Context API + localStorage
- **Cache**: Sistema inteligente com TTL
- **Performance**: Otimizada para 100+ usuários simultâneos

## 📞 Suporte

Para suporte técnico, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido para o Escritório de Advocacia Neycampos**