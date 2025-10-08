# Sistema de Funcionários - Documentação

## Como Funciona

O sistema de funcionários foi configurado para **NÃO recriar** usuários a cada deploy. Todas as alterações de senha e dados dos funcionários são **permanentes** e ficam salvas no banco de dados SQLite.

## Comportamento no Deploy

### ✅ O que acontece quando você faz deploy:

1. **Verifica se o funcionário já existe** no banco de dados
2. **Se existe**: NÃO faz nada - mantém a senha e todos os dados originais
3. **Se NÃO existe**: Cria o funcionário com senha padrão `123456`

### 📝 Importante:

- **As senhas alteradas pelos funcionários são MANTIDAS** após o deploy
- **Os dados dos funcionários são PERSISTENTES** no banco de dados
- **Nenhum dado é resetado** durante o deploy
- O banco de dados SQLite (`database.sqlite`) mantém todos os dados entre deploys

## Código Responsável

O código que gerencia isso está em `/backend/db.js`, na função `createTestUsers()` (linhas 387-612).

### Trecho Chave:

```javascript
// Verificar se o usuário já existe no banco
const existingUser = await query(
  "SELECT email FROM funcionarios WHERE email = ?",
  [user.email]
);

// Só criar o usuário se NÃO existir no banco
if (existingUser.rows.length === 0) {
  // Criar novo funcionário
  await query(
    "INSERT INTO funcionarios (email, senha, permissao, equipe) VALUES (?, ?, ?, ?)",
    [user.email, user.senha, user.permissao, user.equipe || null]
  );
} else {
  // Usuário já existe - NÃO alteramos nada (senha, equipe, etc)
  console.log(`ℹ️ Usuário já existe (mantendo dados originais): ${user.email}`);
}
```

## Gerenciamento de Funcionários

### Criar Novo Funcionário

Para criar um novo funcionário permanentemente, adicione-o na lista `equipes` em `/backend/db.js` (linhas 395-505).

### Alterar Senha

Os funcionários podem alterar suas senhas:
1. No primeiro login, aparece um modal para trocar a senha
2. A senha é salva no banco de dados
3. A senha **permanece** mesmo após novos deploys

### Remover Funcionário

Para remover um funcionário, você precisa executar SQL diretamente no banco:
```sql
DELETE FROM funcionarios WHERE email = 'email@exemplo.com';
```

## Estrutura do Banco

A tabela `funcionarios` tem as seguintes colunas:
- `id`: ID único do funcionário
- `email`: Email (único)
- `senha`: Senha do funcionário
- `permissao`: Tipo de permissão (admin, mod, advogado)
- `equipe`: Nome da equipe
- `first_login`: Flag indicando se é o primeiro login (0 ou 1)
- `created_at`: Data de criação
- `updated_at`: Data da última atualização

## Resumo

✅ **Sim**, os funcionários são persistentes e suas senhas NÃO são resetadas
✅ **Sim**, todas as modificações feitas são salvas permanentemente
✅ **Sim**, o banco de dados mantém todos os dados entre deploys
❌ **Não**, os funcionários NÃO são recriados a cada deploy
