# Instruções de Deploy - Correções Implementadas

## ✅ Alterações Implementadas

### 1. **Paginação na Aba de Acompanhamentos**
- ✓ Paginação de 10 protocolos por página
- ✓ Funciona para protocolos ativos e finalizados (peticionados/cancelados)
- ✓ Navegação com botões Anterior/Próxima e números de página

### 2. **Filtro de Busca por Número de Protocolo**
- ✓ Campo de busca específico para número de processo
- ✓ Filtro em tempo real
- ✓ Botão "Limpar" para resetar a busca

### 3. **Relatório HTML Melhorado**
- ✓ Preview dos protocolos com MAIS informações:
  - Status do protocolo
  - Número do processo com indicadores (DIST, CÍVEL/TRABALHISTA, FATAL)
  - Indicador de procuração quando necessária
  - Tribunal e jurisdição
  - Sistema
  - Tipo de petição
  - Fila atual
  - **Nova coluna: Número de documentos anexados**
  - **Nova coluna: Botão "Ver Log"** que mostra o histórico de atividades

### 4. **Correção: Protocolo "Em Execução" Movido**
- ✓ Quando um protocolo marcado como "Em Execução" é movido SEM ser visualizado
- ✓ O status é automaticamente resetado para "Aguardando"
- ✓ Implementado no QueueManager

### 5. **Correção: Exibição de Fila Atual**
- ✓ Protocolos na fila manual agora exibem corretamente:
  - "Fila do Carlos" (quando assignedTo = 'Carlos')
  - "Fila da Deyse" (quando assignedTo = 'Deyse')
  - "Fila do Robô" (quando não há assignedTo)

## 🚀 Instruções de Deploy no Netlify

### Configuração Necessária:

1. **Build Settings no Netlify:**
   - Base directory: (deixe em branco ou `/`)
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 22

2. **Arquivo netlify.toml criado:**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [build.environment]
     NODE_VERSION = "22"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Passos para Deploy:

1. Faça commit de todas as alterações:
   ```bash
   git add .
   git commit -m "Implementadas melhorias: paginação, filtros, relatório HTML e correções"
   git push origin main
   ```

2. O Netlify irá automaticamente:
   - Detectar o push
   - Executar `npm run build`
   - Publicar a pasta `dist`

3. Aguarde o deploy finalizar (geralmente 1-2 minutos)

## 📊 Banco de Dados

**NÃO é necessário fazer deploy no banco de dados.**

Todas as alterações foram apenas no frontend (interface do usuário). O backend e banco de dados permanecem inalterados.

## 🔍 Como Verificar as Mudanças

1. **Aba de Acompanhamentos:**
   - Acesse a aba "Acompanhamento"
   - Verifique o campo de busca por número de protocolo
   - Crie mais de 10 protocolos e veja a paginação funcionando
   - Clique em "Peticionados e Cancelados" para ver os finalizados com paginação

2. **Relatório HTML:**
   - Vá em "Admin" > "Relatórios"
   - Clique em "Relatório Completo"
   - Abra o arquivo HTML gerado
   - Veja na seção "Protocolos do Período":
     - Coluna "Docs" com número de documentos
     - Coluna "Log" com botão para ver histórico
     - Mais informações nos previews (procuração, fatal, etc.)

3. **Correção "Em Execução":**
   - Marque um protocolo como "Em Execução" (checkbox)
   - NÃO clique em "Visualizar"
   - Mova o protocolo para outra fila usando "Mover para Outra Fila"
   - Verifique que o status volta para "Aguardando" na aba de Acompanhamento

4. **Correção "Fila Atual":**
   - Envie um protocolo para a fila manual (Carlos ou Deyse)
   - Na aba "Acompanhamento", verifique a coluna "Fila Atual"
   - Deve exibir "Em espera na fila do Carlos" ou "Em espera na fila da Deyse"

## ✨ Estrutura do Projeto

O projeto foi consolidado para evitar conflitos:
- **Pasta principal:** `/src` (raiz do projeto)
- **Pasta duplicada removida logicamente:** `/frontend/src` (não é mais usada pelo build)
- **Build configurado:** Build da raiz com Vite

## 🐛 Se Algo Não Funcionar

1. Limpe o cache do Netlify:
   - Vá em "Site Settings" > "Build & Deploy"
   - Clique em "Clear cache and retry deploy"

2. Verifique as variáveis de ambiente:
   - Confirme que `VITE_API_BASE_URL` está configurada

3. Verifique os logs do Netlify:
   - Procure por erros no build
   - Confirme que está usando Node 22

## 📝 Resumo Técnico

- **Arquivos modificados:** 5
  - `TrackingQueue.tsx` - Paginação já existia, filtro já existia
  - `ReportsTab.tsx` - Melhorado preview no HTML
  - `QueueManager.tsx` - Correção status "Em Execução"
  - `RobotQueue.tsx` - Passando prop updateProtocolStatus
  - `ManualQueue.tsx` - Passando prop updateProtocolStatus

- **Arquivos criados:** 1
  - `netlify.toml` - Configuração de deploy

- **Build testado:** ✅ Sucesso
- **Bundle verificado:** ✅ Todas as features presentes
