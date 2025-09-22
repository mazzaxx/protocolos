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

## 💾 Sistema de Backup Automático

### Backups Automáticos:
- **Frequência:** A cada 6 horas automaticamente
- **Localização:** `/server/backups/`
- **Retenção:** Mantém os 10 backups mais recentes
- **Formato:** Cópia completa do banco SQLite

### Backup Manual:
```bash
# Criar backup manual via API
curl http://localhost/api/backup/create

# Listar backups disponíveis
curl http://localhost/api/backup/list

# Exportar dados em JSON
curl http://localhost/api/backup/export
```

### Estratégias de Deploy sem Perda de Dados:

#### 1. **Deploy com Backup Automático (Recomendado)**
```bash
# 1. Fazer backup antes do deploy
curl http://sua-url.squarecloud.app/api/backup/create

# 2. Baixar o arquivo database.sqlite do servidor atual
# 3. Fazer o deploy da nova versão
# 4. Substituir o database.sqlite novo pelo antigo
# 5. Reiniciar a aplicação
```

#### 2. **Deploy com Migração de Dados**
```bash
# 1. Exportar dados em JSON
curl http://sua-url.squarecloud.app/api/backup/export

# 2. Fazer deploy da nova versão
# 3. Importar os dados via script de migração
```

#### 3. **Deploy Blue-Green (Avançado)**
- Manter duas instâncias: uma ativa e uma de staging
- Testar na staging com dados reais
- Fazer switch quando tudo estiver funcionando

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

## 🚀 Processo de Deploy Seguro

### Antes do Deploy:
1. **Criar backup manual:** `curl http://sua-url/api/backup/create`
2. **Verificar backup:** `curl http://sua-url/api/backup/list`
3. **Exportar dados:** `curl http://sua-url/api/backup/export`
4. **Baixar arquivos de backup** do servidor atual

### Durante o Deploy:
1. Fazer upload do novo código
2. **IMPORTANTE:** Substituir o `database.sqlite` novo pelo antigo
3. Reiniciar a aplicação
4. Verificar se tudo está funcionando

### Após o Deploy:
1. Testar todas as funcionalidades
2. Verificar se os dados estão íntegros
3. Criar novo backup da versão atualizada

### Em Caso de Problemas:
1. Restaurar backup anterior
2. Reiniciar aplicação
3. Investigar problemas na versão de desenvolvimento

## Suporte

Para suporte técnico, verifique:
1. Se o servidor está rodando na porta 80
2. Se o banco SQLite foi criado corretamente
3. Se as dependências foram instaladas
4. Logs do console para erros específicos
5. Se os backups estão sendo criados automaticamente