# 🔔 Sistema de Notificações

## 📋 **Visão Geral**

Sistema completo de notificações para o backend de manuais, permitindo que usuários recebam notificações automáticas sobre:

- Solicitações de aprovação
- Decisões de aprovação/rejeição
- Atualizações de manuais
- Mensagens do sistema

## 🏗️ **Estrutura do Sistema**

### **Arquivos Criados:**

- `src/models/notification.ts` - Interfaces TypeScript
- `src/services/notification-service.ts` - Lógica de negócio
- `src/routes/notifications.ts` - Endpoints da API
- `create-notifications-table.sql` - Script SQL para criar tabela
- `teste-notificacoes.http` - Arquivo de teste

### **Tabela no Banco:**

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_username TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('approval_request', 'approval_decision', 'manual_update', 'system')),
  related_manual_id UUID,
  related_version_seq INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);
```

## 🚀 **Como Implementar**

### **1. Criar a Tabela:**

```bash
# Execute o script SQL
psql -h 192.168.10.17 -U postgres -d manuais -f create-notifications-table.sql
```

### **2. Reiniciar o Servidor:**

```bash
npm run dev
```

### **3. Testar as Rotas:**

Use o arquivo `teste-notificacoes.http` ou teste diretamente:

```bash
# Listar notificações
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3000/api/notifications

# Contar não lidas
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3000/api/notifications/count
```

## 📡 **Endpoints Disponíveis**

### **🔍 Consultas:**

- `GET /api/notifications` - Listar todas as notificações do usuário
- `GET /api/notifications/unread` - Apenas notificações não lidas
- `GET /api/notifications/count` - Contar notificações não lidas

### **✏️ Ações:**

- `PATCH /api/notifications/:id/read` - Marcar como lida
- `PATCH /api/notifications/read-all` - Marcar todas como lidas
- `DELETE /api/notifications/:id` - Deletar notificação
- `POST /api/notifications` - Criar notificação (admin/teste)

## 🔄 **Notificações Automáticas**

### **1. Solicitação de Aprovação:**

```typescript
// Quando manual é enviado para aprovação
await notificationService.createApprovalRequestNotification(
  manualId,
  versionSeq,
  approverUsername,
  manualTitle
);
```

### **2. Decisão de Aprovação:**

```typescript
// Quando decisão é tomada
await notificationService.createApprovalDecisionNotification(
  manualId,
  versionSeq,
  ownerUsername,
  decision,
  approverUsername
);
```

## 🎯 **Tipos de Notificação**

| Tipo                | Descrição                | Exemplo                                    |
| ------------------- | ------------------------ | ------------------------------------------ |
| `approval_request`  | Manual aguarda aprovação | "Manual 'Segurança' aguarda sua aprovação" |
| `approval_decision` | Decisão foi tomada       | "Seu manual foi aprovado por João"         |
| `manual_update`     | Manual foi atualizado    | "Manual 'Procedimentos' foi atualizado"    |
| `system`            | Mensagem do sistema      | "Manutenção programada às 22h"             |

## 🔐 **Segurança**

- **Autenticação obrigatória** em todas as rotas
- **Usuário só pode acessar** suas próprias notificações
- **Admin pode criar** notificações para outros usuários
- **Validação de tipos** no banco de dados

## 📱 **Interface de Usuário**

A página principal (`/`) foi atualizada com:

- **Seção de Notificações** com links diretos
- **Botões para** listar, buscar não lidas e contar
- **Descrição** do sistema de notificações

## 🧪 **Testando o Sistema**

### **1. Criar Notificação de Teste:**

```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_username": "usuario.teste",
    "title": "Teste",
    "message": "Notificação de teste",
    "type": "system"
  }'
```

### **2. Verificar Notificações:**

```bash
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3000/api/notifications
```

### **3. Marcar como Lida:**

```bash
curl -X PATCH http://localhost:3000/api/notifications/1/read \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 🔗 **Integração com Outros Sistemas**

### **Sistema de Aprovação:**

- **Notifica aprovadores** quando manual é enviado
- **Notifica dono** quando decisão é tomada

### **Sistema de Manuais:**

- **Notifica sobre** atualizações e mudanças
- **Rastreia** versões e alterações

## 📊 **Performance**

### **Índices Criados:**

- `idx_notifications_user` - Por usuário
- `idx_notifications_type` - Por tipo
- `idx_notifications_unread` - Por status de leitura
- `idx_notifications_manual` - Por manual relacionado

### **Otimizações:**

- **Paginação** nas listagens (padrão: 50 itens)
- **Ordenação** por data de criação (mais recentes primeiro)
- **Filtros** por status de leitura

## 🚨 **Troubleshooting**

### **Erro: "Tabela não existe"**

```bash
# Execute o script SQL primeiro
psql -h 192.168.10.17 -U postgres -d manuais -f create-notifications-table.sql
```

### **Erro: "Token inválido"**

- Verifique se está enviando o header `Authorization: Bearer TOKEN`
- Use um token válido obtido via `/api/auth/login`

### **Erro: "Sem permissão"**

- Usuários só podem criar notificações para si mesmos
- Admins podem criar para qualquer usuário

## 🎉 **Próximos Passos**

1. **Execute o SQL** para criar a tabela
2. **Reinicie o servidor** para carregar as rotas
3. **Teste as funcionalidades** básicas
4. **Integre com** sistema de aprovação existente
5. **Personalize** tipos de notificação conforme necessário

---

**🎯 Sistema de notificações implementado e pronto para uso!**
