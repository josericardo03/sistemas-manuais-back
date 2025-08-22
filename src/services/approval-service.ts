import { Pool } from "pg";
import { config } from "../config";
import {
  ManualApprovalRule,
  ManualApproval,
  ApprovalRequest,
  ApprovalDecision,
  ApprovalSummary,
} from "../models/approval";

export class ApprovalService {
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

  // 🔍 OBTER REGRAS DE APROVAÇÃO
  async getApprovalRules(manualId: string): Promise<ManualApprovalRule | null> {
    try {
      const query = `
        SELECT manual_id, required_approvals 
        FROM manual_approval_rules 
        WHERE manual_id = $1
      `;
      const result = await this.pool.query(query, [manualId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Erro ao buscar regras de aprovação:", error);
      throw error;
    }
  }

  // 📝 CRIAR REGRAS DE APROVAÇÃO
  async createApprovalRule(rule: ManualApprovalRule): Promise<void> {
    try {
      const query = `
        INSERT INTO manual_approval_rules (manual_id, required_approvals)
        VALUES ($1, $2)
        ON CONFLICT (manual_id) 
        DO UPDATE SET required_approvals = EXCLUDED.required_approvals
      `;
      await this.pool.query(query, [rule.manual_id, rule.required_approvals]);
      console.log(`✅ Regra de aprovação criada para manual ${rule.manual_id}`);
    } catch (error) {
      console.error("Erro ao criar regra de aprovação:", error);
      throw error;
    }
  }

  // 📋 LISTAR SOLICITAÇÕES DE APROVAÇÃO
  async getApprovalRequests(status?: string): Promise<ApprovalRequest[]> {
    try {
      let query = `
        SELECT 
          ma.manual_id,
          ma.version_seq,
          ma.manual_id as title,
          ma.approver_username as submitted_by,
          ma.decided_at as submitted_at,
          CASE 
            WHEN COUNT(CASE WHEN ma.decision = 'approved' THEN 1 END) >= mar.required_approvals 
            THEN 'approved'
            WHEN COUNT(CASE WHEN ma.decision = 'rejected' THEN 1 END) > 0 
            THEN 'rejected'
            ELSE 'pending'
          END as status,
          COUNT(CASE WHEN ma.decision = 'approved' THEN 1 END) as current_approvals,
          COALESCE(mar.required_approvals, 0) as required_approvals
        FROM manual_approvals ma
        LEFT JOIN manual_approval_rules mar ON ma.manual_id = mar.manual_id
        GROUP BY ma.manual_id, ma.version_seq, mar.required_approvals
      `;

      const params: any[] = [];
      if (status) {
        query += ` HAVING CASE 
          WHEN COUNT(CASE WHEN ma.decision = 'approved' THEN 1 END) >= mar.required_approvals 
          THEN 'approved'
          WHEN COUNT(CASE WHEN ma.decision = 'rejected' THEN 1 END) > 0 
          THEN 'rejected'
          ELSE 'pending'
        END = $1`;
        params.push(status);
      }

      query += ` ORDER BY ma.decided_at DESC`;

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error("Erro ao buscar solicitações de aprovação:", error);
      throw error;
    }
  }

  // ✅ APROVAR/REJEITAR MANUAL
  async approveManual(decision: ApprovalDecision): Promise<void> {
    try {
      // Primeiro, vamos obter a próxima sequência de decisão para este usuário/manual
      const nextSeqQuery = `
        SELECT COALESCE(MAX(decision_seq), 0) + 1 as next_seq
        FROM manual_approvals 
        WHERE manual_id = $1 AND version_seq = $2 AND approver_username = $3
      `;

      const seqResult = await this.pool.query(nextSeqQuery, [
        decision.manual_id,
        decision.version_seq,
        decision.approver_username,
      ]);

      const nextSeq = seqResult.rows[0].next_seq;

      const query = `
        INSERT INTO manual_approvals 
        (manual_id, version_seq, approver_username, decision_seq, decision, comment, decided_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `;

      await this.pool.query(query, [
        decision.manual_id,
        decision.version_seq,
        decision.approver_username,
        nextSeq,
        decision.decision,
        decision.comment,
      ]);

      console.log(
        `✅ Nova decisão registrada: ${decision.decision} para manual ${decision.manual_id} (seq: ${nextSeq})`
      );
    } catch (error) {
      console.error("Erro ao registrar decisão:", error);
      throw error;
    }
  }

  // 📊 OBTER RESUMO DE APROVAÇÃO
  async getApprovalSummary(
    manualId: string,
    versionSeq: number
  ): Promise<ApprovalSummary | null> {
    try {
      const query = `
        SELECT 
          ma.manual_id,
          ma.version_seq,
          ma.manual_id as title,
          CASE 
            WHEN COUNT(CASE WHEN ma.decision = 'approved' THEN 1 END) >= mar.required_approvals 
            THEN 'approved'
            WHEN COUNT(CASE WHEN ma.decision = 'rejected' THEN 1 END) > 0 
            THEN 'rejected'
            ELSE 'pending'
          END as status,
          COUNT(CASE WHEN ma.decision = 'approved' THEN 1 END) as approvals_count,
          COALESCE(mar.required_approvals, 0) as required_approvals,
          MAX(ma.decided_at) as last_decision,
          ARRAY_AGG(DISTINCT ma.approver_username) as approvers
        FROM manual_approvals ma
        LEFT JOIN manual_approval_rules mar ON ma.manual_id = mar.manual_id
        WHERE ma.manual_id = $1 AND ma.version_seq = $2
        GROUP BY ma.manual_id, ma.version_seq, mar.required_approvals
      `;

      const result = await this.pool.query(query, [manualId, versionSeq]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Erro ao buscar resumo de aprovação:", error);
      throw error;
    }
  }

  // 🔄 VERIFICAR STATUS DE APROVAÇÃO
  async checkApprovalStatus(
    manualId: string,
    versionSeq: number
  ): Promise<string> {
    try {
      const summary = await this.getApprovalSummary(manualId, versionSeq);
      return summary?.status || "pending";
    } catch (error) {
      console.error("Erro ao verificar status de aprovação:", error);
      throw error;
    }
  }

  // 👥 LISTAR APROVADORES DE UM MANUAL
  async getManualApprovers(
    manualId: string,
    versionSeq: number
  ): Promise<ManualApproval[]> {
    try {
      const query = `
        SELECT 
          manual_id, version_seq, approver_username, decision_seq,
          decision, comment, decided_at
        FROM manual_approvals 
        WHERE manual_id = $1 AND version_seq = $2
        ORDER BY approver_username ASC, decision_seq ASC
      `;

      const result = await this.pool.query(query, [manualId, versionSeq]);
      return result.rows;
    } catch (error) {
      console.error("Erro ao buscar aprovadores:", error);
      throw error;
    }
  }

  // 🗑️ REMOVER APROVAÇÃO (para casos especiais)
  async removeApproval(
    manualId: string,
    versionSeq: number,
    approverUsername: string,
    decisionSeq?: number
  ): Promise<void> {
    try {
      let query: string;
      let params: any[];

      if (decisionSeq !== undefined) {
        // Remover decisão específica
        query = `
          DELETE FROM manual_approvals 
          WHERE manual_id = $1 AND version_seq = $2 AND approver_username = $3 AND decision_seq = $4
        `;
        params = [manualId, versionSeq, approverUsername, decisionSeq];
      } else {
        // Remover todas as decisões do usuário para este manual
        query = `
          DELETE FROM manual_approvals 
          WHERE manual_id = $1 AND version_seq = $2 AND approver_username = $3
        `;
        params = [manualId, versionSeq, approverUsername];
      }

      await this.pool.query(query, params);
      console.log(`🗑️ Aprovação removida para ${approverUsername}`);
    } catch (error) {
      console.error("Erro ao remover aprovação:", error);
      throw error;
    }
  }

  // 📈 ESTATÍSTICAS DE APROVAÇÃO
  async getApprovalStats(): Promise<{
    total_pending: number;
    total_approved: number;
    total_rejected: number;
    avg_approval_time: number;
  }> {
    try {
      const query = `
        SELECT 
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as total_pending,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as total_approved,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as total_rejected,
          AVG(EXTRACT(EPOCH FROM (last_decision - submitted_at))/3600) as avg_approval_time
        FROM (
          SELECT 
            manual_id,
            version_seq,
            CASE 
              WHEN COUNT(CASE WHEN ma.decision = 'approved' THEN 1 END) >= mar.required_approvals 
              THEN 'approved'
              WHEN COUNT(CASE WHEN ma.decision = 'rejected' THEN 1 END) > 0 
              THEN 'rejected'
              ELSE 'pending'
            END as status,
            MIN(ma.decided_at) as submitted_at,
            MAX(ma.decided_at) as last_decision
          FROM manual_approvals ma
          LEFT JOIN manual_approval_rules mar ON ma.manual_id = mar.manual_id
          GROUP BY ma.manual_id, ma.version_seq, mar.required_approvals
        ) as approval_summary
      `;

      const result = await this.pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      throw error;
    }
  }

  // 🔒 VERIFICAR PERMISSÕES DE APROVAÇÃO
  async canUserApprove(manualId: string, username: string): Promise<boolean> {
    try {
      // Aqui você pode implementar lógica específica de permissões
      // Por exemplo, verificar se o usuário está em grupos específicos
      // Por enquanto, retorna true para qualquer usuário autenticado
      return true;
    } catch (error) {
      console.error("Erro ao verificar permissões:", error);
      return false;
    }
  }

  // 🚪 Fechar conexão do pool
  async close(): Promise<void> {
    await this.pool.end();
  }
}
