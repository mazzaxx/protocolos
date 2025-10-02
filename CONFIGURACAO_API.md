# Configuração da API

## Variáveis de Ambiente

O sistema agora utiliza a variável `VITE_API_URL` para conectar o frontend com o backend.

### Arquivo `.env`

Certifique-se de que seu arquivo `.env` contém:

```env
VITE_API_URL=https://protocolos.squareweb.app
```

### Para Desenvolvimento Local

Se você estiver rodando o backend localmente na porta 80:

```env
VITE_API_URL=http://localhost:80
```

Ou na porta 3001:

```env
VITE_API_URL=http://localhost:3001
```

## Alterações Realizadas

### Backend (`backend/server.js`)

As rotas de autenticação agora estão registradas com o prefixo `/api/auth`:

```javascript
app.use('/api/auth', authRoutes);
```

### Endpoints de Autenticação

- **Login**: `POST /api/auth/login`
- **Alteração de Senha**: `POST /api/auth/change-password`
- **Verificação**: `GET /api/auth/verify`

### Frontend

Os componentes foram atualizados para usar a nova estrutura de endpoints:

- `Login.tsx`: Usa `${VITE_API_URL}/api/auth/login`
- `UserProfile.tsx`: Usa `${VITE_API_URL}/api/auth/change-password`
- `FirstLoginModal.tsx`: Usa `${VITE_API_URL}/api/auth/change-password`

## Testando a Conexão

Você pode testar se o backend está respondendo corretamente acessando:

```
https://protocolos.squareweb.app/health
```

Ou localmente:

```
http://localhost:80/health
```

## Troubleshooting

### Erro "Erro ao conectar com o servidor"

1. Verifique se a variável `VITE_API_URL` está definida no `.env`
2. Certifique-se de que o backend está rodando
3. Verifique se o CORS está configurado corretamente no backend
4. Teste o endpoint de health check

### Erro de CORS

Se você receber erros de CORS, certifique-se de que a origem do seu frontend está listada em `corsOptions.allowedOrigins` no arquivo `backend/server.js`.
