-- 🔧 Script para adicionar campo decision_seq à tabela manual_approvals
-- Execute este script no seu banco PostgreSQL para permitir múltiplas decisões

-- 1. Adicionar o campo decision_seq
ALTER TABLE manual_approvals 
ADD COLUMN decision_seq INTEGER DEFAULT 1;

-- 2. Atualizar registros existentes com sequência
UPDATE manual_approvals 
SET decision_seq = 1 
WHERE decision_seq IS NULL;

-- 3. Tornar o campo NOT NULL
ALTER TABLE manual_approvals 
ALTER COLUMN decision_seq SET NOT NULL;

-- 4. Adicionar índice para melhor performance
CREATE INDEX idx_manual_approvals_decision_seq 
ON manual_approvals(manual_id, version_seq, approver_username, decision_seq);

-- 5. Verificar a estrutura atualizada
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'manual_approvals' 
ORDER BY ordinal_position;

-- 6. Verificar dados existentes
SELECT 
  manual_id, 
  version_seq, 
  approver_username, 
  decision_seq,
  decision, 
  comment, 
  decided_at
FROM manual_approvals 
ORDER BY manual_id, version_seq, approver_username, decision_seq;
