# 🔐 Autenticação LDAP - Sistema de Manuais

## Configuração

### 1. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes configurações:

```bash
LDAP_URL=ldap://192.168.10.10:389
LDAP_BASE_DN=dc=desenvolvemt,dc=local
LDAP_DOMAIN=desenvolvemt.local
JWT_SECRET=secret
```

### 2. Instalação das Dependências
```bash
npm install
```

## 🚀 Como Usar

### 1. Iniciar o Servidor
```bash
npm run dev
```

### 2. Endpoints de Autenticação

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "seu_usuario",
  "password": "sua_senha"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "user": {
    "username": "seu_usuario",
    "nome": "Nome Completo",
    "grupos": ["Grupo1", "Grupo2"],
    "email": "usuario@dominio.com"
  },
  "token": "jwt_token_aqui",
  "message": "Login realizado com sucesso!"
}
```

#### Rota Protegida
```http
GET /api/auth/protected
Authorization: Bearer seu_token_jwt
```

### 3. Funcionalidades Existentes
- Upload de arquivos: `/upload-form`
- Editor OnlyOffice: `/edit`
- Callback para salvamento: `/callback`

## 🔧 Estrutura do Código

- `src/ldap-auth.ts` - Serviço de autenticação LDAP
- `src/config.ts` - Configurações centralizadas
- `src/routes/auth.ts` - Rotas de autenticação
- `src/app.ts` - Configuração principal do Express
- `server.ts` - Servidor principal com todas as funcionalidades

## 📝 Exemplo de Uso com cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"usuario","password":"senha"}'

# Acessar rota protegida
curl -X GET http://localhost:3000/api/auth/protected \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## ⚠️ Observações

- O sistema usa o domínio `desenvolvemt.local` por padrão
- O servidor LDAP deve estar acessível em `192.168.10.10:389`
- Tokens JWT expiram em 8 horas
- Todas as funcionalidades existentes foram mantidas
