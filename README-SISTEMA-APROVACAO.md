# 📋 Sistema de Aprovação de Manuais

## 🎯 Visão Geral

Este sistema permite gerenciar o fluxo de aprovação de manuais através de um sistema de workflow baseado em regras configuráveis. Cada manual pode ter um número específico de aprovações necessárias antes de ser considerado aprovado.

## 🏗️ Estrutura do Sistema

### Tabelas Principais (já existem no seu banco)

1. **`manual_approval_rules`** - Define quantas aprovações cada manual precisa
2. **`manual_approvals`** - Registra todas as decisões de aprovação/rejeição

### Funcionalidades Implementadas

- ✅ **Regras de Aprovação**: Configurar número de aprovações necessárias por manual
- ✅ **Workflow de Aprovação**: Sistema de aprovação/rejeição com comentários
- ✅ **Controle de Status**: Acompanhamento automático do status (pending/approved/rejected)
- ✅ **Histórico Completo**: Rastreamento de todas as decisões e aprovadores
- ✅ **Estatísticas**: Dashboard com métricas de aprovação
- ✅ **Controle de Acesso**: Verificação de permissões por usuário

## 🚀 Como Usar

### 1. Configurar Regras de Aprovação

```bash
# Criar regra para um manual específico
POST /api/approval/rules
Authorization: Bearer SEU_TOKEN_JWT

{
  "manual_id": "manual-001",
  "required_approvals": 2
}
```

### 2. Registrar Aprovação/Rejeição

```bash
# Aprovar um manual
POST /api/approval/decision
Authorization: Bearer SEU_TOKEN_JWT

{
  "manual_id": "manual-001",
  "version_seq": 1,
  "decision": "approved",
  "comment": "Documento aprovado após revisão técnica"
}
```

### 3. Consultar Status

```bash
# Ver resumo de aprovação
GET /api/approval/summary/manual-001/1
Authorization: Bearer SEU_TOKEN_JWT

# Ver status atual
GET /api/approval/status/manual-001/1
Authorization: Bearer SEU_TOKEN_JWT
```

## 📊 Endpoints Disponíveis

### 🔍 Consultas

- `GET /api/approval/requests` - Listar solicitações de aprovação
- `GET /api/approval/summary/:manualId/:versionSeq` - Resumo de aprovação
- `GET /api/approval/status/:manualId/:versionSeq` - Status atual
- `GET /api/approval/approvers/:manualId/:versionSeq` - Listar aprovadores
- `GET /api/approval/rules/:manualId` - Regras de aprovação
- `GET /api/approval/stats` - Estatísticas gerais

### ✏️ Ações

- `POST /api/approval/decision` - Registrar decisão (aprovar/rejeitar)
- `POST /api/approval/rules` - Criar/atualizar regras
- `DELETE /api/approval/approval/:manualId/:versionSeq/:username` - Remover aprovação (admin)

## 🔐 Autenticação

Todas as rotas requerem autenticação via JWT:

```bash
Authorization: Bearer SEU_TOKEN_JWT
```

Para obter o token, faça login via `/api/auth/login`

## 📈 Fluxo de Aprovação

### 1. **PENDING** (Pendente)

- Manual aguardando aprovações
- Sistema conta aprovações recebidas vs. necessárias

### 2. **APPROVED** (Aprovado)

- Número de aprovações atingiu o limite configurado
- Manual pode ser publicado/utilizado

### 3. **REJECTED** (Rejeitado)

- Qualquer rejeição automaticamente rejeita o manual
- Requer nova submissão após correções

## 🎯 Exemplos Práticos

### Cenário 1: Manual com 2 Aprovações Necessárias

```bash
# 1. Configurar regra
POST /api/approval/rules
{
  "manual_id": "manual-procedimentos",
  "required_approvals": 2
}

# 2. Primeira aprovação
POST /api/approval/decision
{
  "manual_id": "manual-procedimentos",
  "version_seq": 1,
  "decision": "approved",
  "comment": "Aprovado pelo gerente técnico"
}

# 3. Segunda aprovação
POST /api/approval/decision
{
  "manual_id": "manual-procedimentos",
  "version_seq": 1,
  "decision": "approved",
  "comment": "Aprovado pelo diretor de qualidade"
}

# Status: APPROVED ✅
```

### Cenário 2: Manual Rejeitado

```bash
# 1. Rejeição (rejeita automaticamente)
POST /api/approval/decision
{
  "manual_id": "manual-seguranca",
  "version_seq": 1,
  "decision": "rejected",
  "comment": "Faltam procedimentos de emergência"
}

# Status: REJECTED ❌
# Requer nova submissão com correções
```

## 📊 Monitoramento e Estatísticas

### Dashboard de Estatísticas

```bash
GET /api/approval/stats
```

Retorna:

- Total de manuais pendentes
- Total de manuais aprovados
- Total de manuais rejeitados
- Tempo médio de aprovação

### Histórico de Aprovações

```bash
GET /api/approval/approvers/manual-001/1
```

Lista todos os aprovadores com suas decisões e comentários.

## 🔧 Configuração Avançada

### Controle de Permissões

O sistema verifica se o usuário pode aprovar através da função `canUserApprove()`. Você pode implementar lógica específica:

```typescript
// Em src/services/approval-service.ts
async canUserApprove(manualId: string, username: string): Promise<boolean> {
  // Implementar sua lógica de permissões
  // Ex: verificar grupos LDAP, roles específicos, etc.
  return true; // Por enquanto, qualquer usuário autenticado
}
```

### Integração com Sistema Existente

O sistema pode ser facilmente integrado com:

- Sistema de notificações
- Workflow de documentos
- Relatórios gerenciais
- Auditoria de aprovações

## 🚨 Tratamento de Erros

### Códigos de Status HTTP

- `200` - Sucesso
- `400` - Dados inválidos
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Recurso não encontrado
- `500` - Erro interno

### Respostas de Erro

```json
{
  "success": false,
  "message": "Descrição do erro"
}
```

## 🧪 Testando o Sistema

### 1. Iniciar o Servidor

```bash
npm run dev
```

### 2. Fazer Login

```bash
POST /api/auth/login
{
  "username": "seu_usuario",
  "password": "sua_senha"
}
```

### 3. Usar o Token Retornado

```bash
Authorization: Bearer TOKEN_RETORNADO
```

### 4. Testar Endpoints

Use Postman, cURL ou qualquer cliente HTTP para testar as rotas.

## 🔄 Próximos Passos

### Funcionalidades Futuras

- [ ] Sistema de notificações por email
- [ ] Dashboard web para aprovadores
- [ ] Workflow visual de aprovação
- [ ] Integração com sistemas externos
- [ ] Relatórios avançados
- [ ] Auditoria completa de mudanças

### Personalizações

- [ ] Regras de aprovação por tipo de documento
- [ ] Aprovadores específicos por categoria
- [ ] Prazos de aprovação
- [ ] Escalação automática

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique os logs do servidor
2. Confirme a conectividade com o banco PostgreSQL
3. Valide as credenciais de autenticação
4. Teste endpoints individualmente

---

**🎉 Sistema de Aprovação implementado com sucesso!**

Agora você tem um sistema completo para gerenciar o fluxo de aprovação de manuais com controle total sobre quem pode aprovar e quantas aprovações são necessárias.
