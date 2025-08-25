import { Pool } from "pg";
import { config } from "../config";

export interface Manual {
  id: string;
  title: string;
  slug: string;
  owner_username: string;
  state: string;
  created_at: Date;
  updated_at: Date;
  latest_version_seq: number;
  published_version_seq?: number;
}

export interface ManualVersion {
  manual_id: string;
  version_seq: number;
  format: string;
  object_key: string;
  s3_version_id: string;
  checksum_sha256: string;
  size_bytes: number;
  created_by: string;
  created_at: Date;
  changelog: string;
  file_data: Buffer;
}

export class ManualService {
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

  // 📋 LISTAR TODOS OS MANUAIS
  async getAllManuals(): Promise<Manual[]> {
    try {
      const query = `
        SELECT 
          id, title, slug, owner_username, state, 
          created_at, updated_at, latest_version_seq, published_version_seq
        FROM manuals 
        ORDER BY updated_at DESC
      `;

      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("Erro ao buscar manuais:", error);
      throw error;
    }
  }

  // 🔍 BUSCAR MANUAL POR ID
  async getManualById(manualId: string): Promise<Manual | null> {
    try {
      const query = `
        SELECT 
          id, title, slug, owner_username, state, 
          created_at, updated_at, latest_version_seq, published_version_seq
        FROM manuals 
        WHERE id = $1
      `;

      const result = await this.pool.query(query, [manualId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Erro ao buscar manual:", error);
      throw error;
    }
  }

  // 📄 BUSCAR VERSÃO ESPECÍFICA DO MANUAL
  async getManualVersion(
    manualId: string,
    versionSeq: number
  ): Promise<ManualVersion | null> {
    try {
      const query = `
        SELECT 
          manual_id, version_seq, format, object_key, s3_version_id,
          checksum_sha256, size_bytes, created_by, created_at, 
          changelog, file_data
        FROM manual_versions 
        WHERE manual_id = $1 AND version_seq = $2
      `;

      const result = await this.pool.query(query, [manualId, versionSeq]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Erro ao buscar versão do manual:", error);
      throw error;
    }
  }

  // 📊 BUSCAR MANUAIS COM STATUS DE APROVAÇÃO
  async getManualsWithApprovalStatus(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          m.id,
          m.title,
          m.slug,
          m.owner_username,
          m.state,
          m.latest_version_seq,
          m.created_at,
          m.updated_at,
          CASE 
            WHEN COUNT(CASE WHEN ma.decision = 'approved' THEN 1 END) >= COALESCE(mar.required_approvals, 0) 
            THEN 'approved'
            WHEN COUNT(CASE WHEN ma.decision = 'rejected' THEN 1 END) > 0 
            THEN 'rejected'
            ELSE 'pending'
          END as approval_status,
          COUNT(CASE WHEN ma.decision = 'approved' THEN 1 END) as approvals_count,
          COALESCE(mar.required_approvals, 0) as required_approvals
        FROM manuals m
        LEFT JOIN manual_approvals ma ON m.id = ma.manual_id AND m.latest_version_seq = ma.version_seq
        LEFT JOIN manual_approval_rules mar ON m.id = mar.manual_id
        GROUP BY m.id, m.title, m.slug, m.owner_username, m.state, m.latest_version_seq, m.created_at, m.updated_at, mar.required_approvals
        ORDER BY m.updated_at DESC
      `;

      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("Erro ao buscar manuais com status:", error);
      throw error;
    }
  }

  // 🗑️ Fechar conexão do pool
  async close(): Promise<void> {
    await this.pool.end();
  }
}
