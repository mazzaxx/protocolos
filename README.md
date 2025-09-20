# Sistema de Protocolos Jurídicos

Sistema completo para gerenciamento de protocolos jurídicos com autenticação de funcionários.

## 🚀 Deploy no Square Cloud

### Configuração Automática
Este projeto está configurado para deploy automático no Square Cloud com:
- **Porta:** 80 (padrão)
- **Banco:** SQLite otimizado
- **Build:** Vite automático
- **Capacidade:** 100+ usuários simultâneos

### Passos para Deploy
1. Faça upload do projeto para o Square Cloud
2. O sistema será buildado e iniciado automaticamente
3. Acesse sua URL do Square Cloud

## 🔧 Desenvolvimento Local

### 1. Instalar dependências
```bash
npm install
```

### 2. Executar em desenvolvimento
```bash
# Servidor + Frontend juntos
npm run dev:full
```

**Ou separadamente:**
```bash
# Backend
npm run server

# Frontend (nova aba do terminal)
npm run dev
```

### 3. Testar build de produção
```bash
npm run build
npm start
```

## 🔄 Sincronização de Dados

**IMPORTANTE:** Este sistema funciona com sincronização em tempo real entre todos os usuários.

### Como funciona:
- Todos os protocolos são salvos no servidor
- Dados são sincronizados automaticamente a cada 3 segundos
- Mudanças feitas por qualquer usuário aparecem para todos
- **NÃO há armazenamento local** - tudo depende do servidor

## Acesso ao sistema

- **URL de desenvolvimento:** http://localhost:5173
- **Email de teste:** admin@escritorio.com  
- **Senha de teste:** 123456

## Funcionalidades

### Performance Otimizada
- **SQLite WAL Mode:** Melhor concorrência para múltiplos usuários
- **Conexão Única:** Otimizada para Square Cloud (evita locks)
- **Cache Inteligente:** Reduz requisições desnecessárias
- **Polling Adaptativo:** Intervalo baseado na atividade
- **Índices Otimizados:** Queries rápidas mesmo com milhares de protocolos

### Autenticação
- Login com email e senha
- Proteção de rotas
- Logout seguro
- Dados do usuário no header

### Painel de Protocolos
- Envio de protocolos
- Fila do robô (automática)
- Fila do Carlos (manual)
- Fila da Deyse (manual)
- Acompanhamento de status

### Banco de Dados
- **SQLite Otimizado** (desenvolvimento e produção)
- **WAL Mode** para melhor concorrência
- **Conexão Única** otimizada para Square Cloud
- **Manutenção automática** a cada 12 horas
- Tabela de funcionários
- Tabela de protocolos
- Usuário de teste pré-criado

## Estrutura do Projeto

```
src/
├── components/
│   ├── Login.tsx           # Página de login
│   ├── Header.tsx          # Header com info do usuário
│   ├── ProtectedRoute.tsx  # Proteção de rotas
│   └── ...                 # Outros componentes do painel
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticação
└── ...

server/
├── server.js              # Servidor Express
├── auth.js                # Rotas de autenticação  
├── protocols.js           # Rotas de protocolos
├── admin.js               # Rotas administrativas
├── db.js                  # SQLite otimizado
└── database.sqlite        # Banco SQLite
```

## Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express
- **Banco:** SQLite3 otimizado com WAL mode
- **Autenticação:** Context API + localStorage
- **Deploy:** Square Cloud
- **Capacidade:** 100+ usuários simultâneos

## 🌐 URLs de Acesso

- **Desenvolvimento**: http://localhost:5173
- **Produção**: Sua URL do Square Cloud

## Comandos Disponíveis

```bash
npm run dev          # Frontend em desenvolvimento
npm run server       # Backend apenas
npm run dev:full     # Frontend + Backend
npm run build        # Build para produção
npm run start        # Iniciar servidor de produção
npm run lint         # Verificar código
```

## Suporte

Para suporte técnico, verifique:
1. Se o servidor está rodando na porta 80
2. Se o banco SQLite foi criado corretamente
3. Se as dependências foram instaladas
4. Logs do console para erros específicos