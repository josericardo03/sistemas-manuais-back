import { Pool } from "pg";
import { config } from "../config";
import { Notification, CreateNotification } from "../models/notification";

export class NotificationService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
    });
  }

  // CRIAR NOTIFICAÇÃO
  async createNotification(
    notification: CreateNotification
  ): Promise<Notification> {
    try {
      const query = `
        INSERT INTO notifications 
        (user_username, title, message, type, related_manual_id, related_version_seq)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        notification.user_username,
        notification.title,
        notification.message,
        notification.type,
        notification.related_manual_id,
        notification.related_version_seq,
      ]);

      return result.rows[0];
    } catch (error) {
      console.error("Erro ao criar notificação:", error);
      throw error;
    }
  }

  // 📋 LISTAR NOTIFICAÇÕES DO USUÁRIO
  async getUserNotifications(
    username: string,
    limit: number = 50
  ): Promise<Notification[]> {
    try {
      const query = `
        SELECT * FROM notifications 
        WHERE user_username = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;

      const result = await this.pool.query(query, [username, limit]);
      return result.rows;
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      throw error;
    }
  }

  // 🔍 BUSCAR NOTIFICAÇÕES NÃO LIDAS
  async getUnreadNotifications(username: string): Promise<Notification[]> {
    try {
      const query = `
        SELECT * FROM notifications 
        WHERE user_username = $1 AND is_read = FALSE 
        ORDER BY created_at DESC
      `;

      const result = await this.pool.query(query, [username]);
      return result.rows;
    } catch (error) {
      console.error("Erro ao buscar notificações não lidas:", error);
      throw error;
    }
  }

  // ✅ MARCAR COMO LIDA
  async markAsRead(notificationId: number, username: string): Promise<void> {
    try {
      const query = `
        UPDATE notifications 
        SET is_read = TRUE, read_at = NOW() 
        WHERE id = $1 AND user_username = $2
      `;

      await this.pool.query(query, [notificationId, username]);
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      throw error;
    }
  }

  // ✅ MARCAR TODAS COMO LIDAS
  async markAllAsRead(username: string): Promise<void> {
    try {
      const query = `
        UPDATE notifications 
        SET is_read = TRUE, read_at = NOW() 
        WHERE user_username = $1 AND is_read = FALSE
      `;

      await this.pool.query(query, [username]);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      throw error;
    }
  }

  // 🗑️ DELETAR NOTIFICAÇÃO
  async deleteNotification(
    notificationId: number,
    username: string
  ): Promise<void> {
    try {
      const query = `
        DELETE FROM notifications 
        WHERE id = $1 AND user_username = $2
      `;

      await this.pool.query(query, [notificationId, username]);
    } catch (error) {
      console.error("Erro ao deletar notificação:", error);
      throw error;
    }
  }

  // 📊 CONTAR NOTIFICAÇÕES NÃO LIDAS
  async getUnreadCount(username: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_username = $1 AND is_read = FALSE
      `;

      const result = await this.pool.query(query, [username]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error("Erro ao contar notificações não lidas:", error);
      throw error;
    }
  }

  // NOTIFICAÇÕES AUTOMÁTICAS
  async createApprovalRequestNotification(
    manualId: string,
    versionSeq: number,
    approverUsername: string,
    manualTitle: string
  ): Promise<void> {
    const notification: CreateNotification = {
      user_username: approverUsername,
      title: "Manual para Aprovar",
      message: `Manual "${manualTitle}" (v${versionSeq}) aguarda sua aprovação`,
      type: "approval_request",
      related_manual_id: manualId,
      related_version_seq: versionSeq,
    };

    await this.createNotification(notification);
  }

  async createApprovalDecisionNotification(
    manualId: string,
    versionSeq: number,
    ownerUsername: string,
    decision: string,
    approverUsername: string
  ): Promise<void> {
    const notification: CreateNotification = {
      user_username: ownerUsername,
      title: `Manual ${decision === "approved" ? "Aprovado" : "Rejeitado"}`,
      message: `Seu manual foi ${
        decision === "approved" ? "aprovado" : "rejeitado"
      } por ${approverUsername}`,
      type: "approval_decision",
      related_manual_id: manualId,
      related_version_seq: versionSeq,
    };

    await this.createNotification(notification);
  }

  // 🗑️ Fechar conexão
  async close(): Promise<void> {
    await this.pool.end();
  }
}
