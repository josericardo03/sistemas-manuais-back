-- 🔔 Criar tabela de notificações
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

-- 🔍 Índices para performance
CREATE INDEX idx_notifications_user ON notifications(user_username);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_unread ON notifications(user_username, is_read);
CREATE INDEX idx_notifications_manual ON notifications(related_manual_id, related_version_seq);

-- 📊 Verificar se a tabela foi criada
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;
