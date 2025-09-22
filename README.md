# Sistema de Protocolos Jurídicos - Square Cloud Extension

Sistema completo para gerenciamento de protocolos jurídicos com automação de peticionamento.

## 🚀 Deploy com Square Cloud VS Code Extension

### Pré-requisitos
1. **VS Code** instalado
2. **Node.js** 18+ instalado
3. **Conta na Square Cloud**
4. **Extensão Square Cloud** instalada no VS Code

### 📋 Passo a Passo Completo

#### 1. Instalar a Extensão Square Cloud
```bash
# No VS Code, vá em Extensions (Ctrl+Shift+X) e procure por:
Square Cloud
# Ou instale via marketplace: https://marketplace.visualstudio.com/items?itemName=squarecloud.squarecloud
```

#### 2. Configurar a Extensão
1. Abra o VS Code neste projeto
2. Pressione `Ctrl+Shift+P` e digite: `Square Cloud: Login`
3. Faça login com sua conta Square Cloud
4. Configure o App ID (será criado automaticamente)

#### 3. Configurar o Projeto
O projeto já está configurado com:
- ✅ `squarecloud.config` - Configurações do Square Cloud
- ✅ `.squareignore` - Arquivos que não serão enviados
- ✅ Scripts otimizados no `package.json`
- ✅ Servidor Express configurado para produção

#### 4. Deploy Automático
1. **Primeira vez:**
   ```bash
   # No terminal do VS Code:
   Ctrl+Shift+P -> "Square Cloud: Upload"
   ```

2. **Deploys subsequentes:**
   - A extensão pode fazer upload automático quando você salvar arquivos
   - Ou use `Ctrl+Shift+P -> "Square Cloud: Upload"` manualmente

#### 5. Monitoramento
- Use `Ctrl+Shift+P -> "Square Cloud: Logs"` para ver logs em tempo real
- Use `Ctrl+Shift+P -> "Square Cloud: Status"` para ver status da aplicação

### 🔧 Comandos Úteis da Extensão

| Comando | Descrição |
|---------|-----------|
| `Square Cloud: Upload` | Faz upload do projeto |
| `Square Cloud: Logs` | Mostra logs em tempo real |
| `Square Cloud: Status` | Status da aplicação |
| `Square Cloud: Restart` | Reinicia a aplicação |
| `Square Cloud: Delete` | Deleta a aplicação |

### 💾 Backup Automático de Dados

#### Vantagens da Extensão para Backup:
1. **Deploy Instantâneo**: Mudanças são aplicadas em segundos
2. **Logs em Tempo Real**: Veja exatamente o que está acontecendo
3. **Rollback Fácil**: Reverta mudanças rapidamente
4. **Sincronização Automática**: Dados persistem entre deploys

#### Como Funciona o Backup:
- ✅ **Banco SQLite**: Persiste automaticamente no Square Cloud
- ✅ **Uploads de Arquivos**: Mantidos entre deploys
- ✅ **Configurações**: Salvas no `squarecloud.config`
- ✅ **Logs**: Histórico completo disponível

### 🌐 URLs e Acesso

Após o deploy, sua aplicação estará disponível em:
```
https://protocolos-juridicos.squarecloud.app
```

### 🔐 Usuários de Teste

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@escritorio.com | 123456 |
| Moderador | mod@escritorio.com | 123456 |
| Advogado | advogado@escritorio.com | 123456 |

### 📊 Monitoramento e Debug

#### Ver Logs:
```bash
# No VS Code:
Ctrl+Shift+P -> "Square Cloud: Logs"
```

#### Verificar Status:
```bash
# No VS Code:
Ctrl+Shift+P -> "Square Cloud: Status"
```

#### Reiniciar Aplicação:
```bash
# No VS Code:
Ctrl+Shift+P -> "Square Cloud: Restart"
```

### 🛠️ Desenvolvimento Local

Para testar localmente antes do deploy:
```bash
npm install
npm run dev:full
```

### 📁 Estrutura de Arquivos

```
projeto/
├── squarecloud.config      # Configurações Square Cloud
├── .squareignore          # Arquivos ignorados no upload
├── start.js               # Script de inicialização
├── server/                # Backend Express
├── src/                   # Frontend React (não enviado)
├── dist/                  # Frontend buildado (enviado)
└── .vscode/settings.json  # Configurações VS Code
```

### 🚨 Troubleshooting

#### Problema: Upload falha
**Solução**: Verifique se está logado: `Ctrl+Shift+P -> "Square Cloud: Login"`

#### Problema: Aplicação não inicia
**Solução**: Verifique logs: `Ctrl+Shift+P -> "Square Cloud: Logs"`

#### Problema: Banco de dados vazio
**Solução**: Os usuários são criados automaticamente na primeira inicialização

### 🎯 Próximos Passos

1. **Faça o primeiro deploy** usando a extensão
2. **Configure domínio personalizado** (opcional)
3. **Configure backup automático** dos dados
4. **Monitore performance** através dos logs

### 📞 Suporte

- **Square Cloud Docs**: https://docs.squarecloud.app/
- **Extensão VS Code**: https://marketplace.visualstudio.com/items?itemName=squarecloud.squarecloud
- **Discord Square Cloud**: https://discord.gg/squarecloud