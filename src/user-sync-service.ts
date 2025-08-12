import { Pool } from "pg";

interface UserData {
  username: string;
  nome: string;
  grupos: string[];
  email: string | null;
}

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export class UserSyncService {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
    });
  }

  async syncUserFromLDAP(userData: UserData): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      // 1. UPSERT em users
      const userQuery = `
        INSERT INTO users (username, full_name, email, last_login_at, is_active)
        VALUES ($1, $2, $3, now(), TRUE)
        ON CONFLICT (username) DO UPDATE
        SET full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            last_login_at = now(),
            is_active = TRUE
      `;

      await client.query(userQuery, [
        userData.username, // $1 - username
        userData.nome, // $2 - full_name
        userData.email, // $3 - email
      ]);

      // 2. Garantir grupos existam
      if (userData.grupos.length > 0) {
        const groupsQuery = `
          WITH incoming(name) AS (SELECT UNNEST($1::text[]))
          INSERT INTO groups(name)
          SELECT name FROM incoming
          ON CONFLICT (name) DO NOTHING
        `;

        await client.query(groupsQuery, [userData.grupos]);
      }

      // 3. Sincronizar vínculos em user_groups
      // Primeiro remove todos os grupos antigos
      await client.query("DELETE FROM user_groups WHERE username = $1", [
        userData.username,
      ]);

      // Depois insere os novos grupos
      if (userData.grupos.length > 0) {
        const userGroupsQuery = `
          INSERT INTO user_groups (username, group_name)
          SELECT $1, name FROM UNNEST($2::text[]) AS t(name)
        `;

        await client.query(userGroupsQuery, [
          userData.username,
          userData.grupos,
        ]);
      }

      await client.query("COMMIT");
      console.log(`✅ Usuário ${userData.username} sincronizado com sucesso`);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Erro ao sincronizar usuário:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserFromDatabase(username: string): Promise<any> {
    const query = `
      SELECT u.username, u.full_name, u.email, u.last_login_at, u.is_active,
             array_agg(ug.group_name) as grupos
      FROM users u
      LEFT JOIN user_groups ug ON u.username = ug.username
      WHERE u.username = $1
      GROUP BY u.username, u.full_name, u.email, u.last_login_at, u.is_active
    `;

    const result = await this.pool.query(query, [username]);
    return result.rows[0] || null;
  }

  // 🔍 Método para listar todos os usuários (útil para debug)
  async getAllUsers(): Promise<any[]> {
    const query = `
      SELECT u.username, u.full_name, u.email, u.last_login_at, u.is_active,
             array_agg(ug.group_name) as grupos
      FROM users u
      LEFT JOIN user_groups ug ON u.username = ug.username
      GROUP BY u.username, u.full_name, u.email, u.last_login_at, u.is_active
      ORDER BY u.username
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  // 🔍 Método para listar todos os grupos
  async getAllGroups(): Promise<any[]> {
    const query = `
      SELECT g.name, g.description, COUNT(ug.username) as user_count
      FROM groups g
      LEFT JOIN user_groups ug ON g.name = ug.group_name
      GROUP BY g.name, g.description
      ORDER BY g.name
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
