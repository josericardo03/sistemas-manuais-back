# 🔐 Guia de Teste das Rotas de Autenticação

## 📋 Rotas Disponíveis

### 1. **POST /api/auth/login** - Login LDAP

**Endpoint:** `http://SEU_IP:3000/api/auth/login`

**Body (JSON):**

```json
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
    "displayName": "Nome Completo",
    "email": "usuario@dominio.com",
    "groups": ["grupo1", "grupo2"]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login realizado com sucesso!"
}
```

**Resposta de Erro:**

```json
{
  "success": false,
  "message": "Credenciais inválidas"
}
```

---

### 2. **GET /api/auth/protected** - Rota Protegida

**Endpoint:** `http://SEU_IP:3000/api/auth/protected`

**Headers:**

```
Authorization: Bearer SEU_TOKEN_JWT
```

**Resposta de Sucesso:**

```json
{
  "success": true,
  "message": "Rota protegida acessada!",
  "user": {
    "username": "seu_usuario",
    "iat": 1234567890,
    "exp": 1234567890
  }
}
```

---

### 3. **GET /api/auth/users** - Listar Usuários

**Endpoint:** `http://SEU_IP:3000/api/auth/users`

**Resposta:**

```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "usuario1",
      "display_name": "Nome 1",
      "email": "email1@dominio.com"
    }
  ],
  "count": 1
}
```

---

### 4. **GET /api/auth/groups** - Listar Grupos

**Endpoint:** `http://SEU_IP:3000/api/auth/groups`

**Resposta:**

```json
{
  "success": true,
  "groups": [
    {
      "id": 1,
      "name": "Administradores",
      "description": "Grupo de administradores"
    }
  ],
  "count": 1
}
```

---

## 🧪 Como Testar

### **Opção 1: Usando cURL**

#### Teste de Login:

```bash
curl -X POST http://SEU_IP:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "seu_usuario",
    "password": "sua_senha"
  }'
```

#### Teste de Rota Protegida:

```bash
curl -X GET http://SEU_IP:3000/api/auth/protected \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

#### Listar Usuários:

```bash
curl -X GET http://SEU_IP:3000/api/auth/users
```

#### Listar Grupos:

```bash
curl -X GET http://SEU_IP:3000/api/auth/groups
```

---

### **Opção 2: Usando Postman/Insomnia**

1. **Configure a URL base:** `http://SEU_IP:3000`
2. **Use os endpoints:** `/api/auth/login`, `/api/auth/protected`, etc.
3. **Configure os headers e body conforme necessário**

---

### **Opção 3: Usando JavaScript/Fetch**

#### Login:

```javascript
const response = await fetch("http://SEU_IP:3000/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: "seu_usuario",
    password: "sua_senha",
  }),
});

const data = await response.json();
console.log(data);
```

#### Rota Protegida:

```javascript
const response = await fetch("http://SEU_IP:3000/api/auth/protected", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
console.log(data);
```

---

## ⚙️ Configurações Necessárias

### **Variáveis de Ambiente (.env):**

```env
# LDAP
LDAP_URL=ldap://192.168.10.10:389
LDAP_BASE_DN=dc=desenvolvemt,dc=local
LDAP_DOMAIN=desenvolvemt.local

# JWT
JWT_SECRET=seu_segredo_jwt

# PostgreSQL
DB_HOST=192.168.10.17
DB_PORT=5432
DB_NAME=manuais
DB_USER=postgres
DB_PASSWORD=12345678
```

---

## 🔍 Debug e Logs

### **Logs do Console:**

- `🔐 Tentativa de login: usuario`
- `✅ Login bem-sucedido para: usuario`
- `❌ Login falhou para: usuario`
- `🔄 Usuário usuario sincronizado no banco`
- `⚠️ Erro ao sincronizar usuário usuario`

### **Verificar Status:**

```bash
# Teste básico da aplicação
curl http://SEU_IP:3000/test

# Verificar se o servidor está rodando
curl http://SEU_IP:3000/api/auth/users
```

---

## 🚨 Solução de Problemas

### **Erro 401 - Credenciais Inválidas:**

- Verifique se o usuário existe no LDAP
- Confirme se a senha está correta
- Verifique se o servidor LDAP está acessível

### **Erro 500 - Erro Interno:**

- Verifique os logs do console
- Confirme se o PostgreSQL está rodando
- Verifique as configurações de conexão

### **Erro de Conexão:**

- Confirme se o servidor está rodando
- Verifique se a porta 3000 está liberada
- Confirme se o IP está correto na rede

---

## 📱 Interface de Teste

A aplicação também inclui uma interface web em `http://SEU_IP:3000` com:

- Botão de teste do OnlyOffice
- Formulário de upload de documentos
- Informações da rede para acesso remoto

---

## 🎯 Próximos Passos

1. **Configure as variáveis de ambiente**
2. **Teste o login com um usuário válido do LDAP**
3. **Use o token retornado para acessar rotas protegidas**
4. **Verifique a sincronização automática com o banco**
5. **Teste o acesso de outros computadores da rede**
