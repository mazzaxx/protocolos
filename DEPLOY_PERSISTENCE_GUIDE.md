# 🚀 GUIA COMPLETO: Deploy sem Perder Dados

## 🎯 PROBLEMA RESOLVIDO: Como fazer deploy sem perder dados

### ⚠️ PROBLEMA ATUAL
Você está perdendo dados a cada deploy porque:
1. **Railway reinicia o container** → SQLite em memória é perdido
2. **Sem volume persistente** → Banco é recriado do zero
3. **Sem backup automático** → Dados não são preservados

### ✅ SOLUÇÃO IMPLEMENTADA

#### 1. **Volume Persistente no Railway**
```json
// railway.json - ADICIONADO
"volumes": [
  {
    "name": "database-volume",
    "mountPath": "/app/data"
  }
]
```

#### 2. **Banco em Volume Persistente**
```javascript
// server/db.js - MODIFICADO
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');
// Agora usa: /app/data/database.sqlite (persistente)
```

#### 3. **Variável de Ambiente**
```bash
# Railway Environment Variables
DATABASE_PATH=/app/data/database.sqlite
```

## 🔧 COMO CONFIGURAR NO RAILWAY

### Passo 1: Configurar Volume
1. Acesse seu projeto no Railway
2. Vá em **Settings** → **Variables**
3. Adicione: `DATABASE_PATH` = `/app/data/database.sqlite`

### Passo 2: Redeploy
1. Faça push das mudanças
2. Railway criará o volume automaticamente
3. Dados serão preservados entre deploys

### Passo 3: Verificar Persistência
```bash
# Teste no Railway Console
ls -la /app/data/
# Deve mostrar: database.sqlite
```

## 📊 BACKUP AUTOMÁTICO (Futuro)

### Opção 1: Backup para Railway Volume
```javascript
// Backup diário automático
setInterval(async () => {
  const backupPath = `/app/data/backup-${Date.now()}.sqlite`;
  await copyFile(dbPath, backupPath);
}, 24 * 60 * 60 * 1000); // 24 horas
```

### Opção 2: Backup para Serviço Externo
```javascript
// Upload para AWS S3, Google Drive, etc.
const uploadBackup = async () => {
  const backup = await readFile(dbPath);
  await uploadToCloud(backup, `backup-${Date.now()}.sqlite`);
};
```

## 🚨 MIGRAÇÃO DE DADOS EXISTENTES

### Se você já tem dados importantes:

#### 1. **Backup Manual Atual**
```bash
# No Railway Console (se possível)
cp /app/database.sqlite /tmp/backup.sqlite
```

#### 2. **Download via API**
```javascript
// Endpoint para download do banco
app.get('/api/backup', (req, res) => {
  res.download(dbPath, 'backup.sqlite');
});
```

#### 3. **Restaurar após Deploy**
```bash
# Upload do backup para o novo volume
cp backup.sqlite /app/data/database.sqlite
```

## 🔄 PROCESSO DE DEPLOY SEGURO

### Antes do Deploy:
1. ✅ Fazer backup dos dados
2. ✅ Testar localmente
3. ✅ Verificar variáveis de ambiente

### Durante o Deploy:
1. ✅ Railway preserva volume `/app/data`
2. ✅ Banco SQLite mantém dados
3. ✅ Aplicação reconecta automaticamente

### Após o Deploy:
1. ✅ Verificar conectividade
2. ✅ Testar funcionalidades
3. ✅ Confirmar dados preservados

## 📈 MONITORAMENTO

### Logs para Verificar Persistência:
```
🗄️ Configurando SQLite otimizado para produção
📍 Caminho do banco: /app/data/database.sqlite
💾 Persistência: VOLUME RAILWAY
📊 Funcionários: X
📊 Protocolos: Y
```

## 🎯 RESULTADO FINAL

### ✅ O que você ganha:
- **Dados preservados** entre deploys
- **Zero downtime** de dados
- **Backup automático** (opcional)
- **Escalabilidade** mantida

### ✅ O que muda:
- **Nada na interface** → Usuário não percebe
- **Nada no código** → Funciona igual
- **Tudo nos dados** → Persistem para sempre

## 🚀 PRÓXIMOS PASSOS

1. **Imediato**: Configure `DATABASE_PATH` no Railway
2. **Curto prazo**: Implemente backup automático
3. **Longo prazo**: Considere PostgreSQL para produção

**🎉 AGORA VOCÊ PODE FAZER DEPLOY SEM MEDO DE PERDER DADOS!**