import { Router, Request, Response } from "express";
import { LDAPAuthService } from "../ldap-auth";
import { UserSyncService } from "../user-sync-service";
import { config } from "../config";

const router = Router();
const authService = new LDAPAuthService(config.ldap);
const userSyncService = new UserSyncService(config.database);

// Rota de login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Usuário e senha são obrigatórios",
      });
    }

    console.log(`🔐 Tentativa de login: ${username}`);

    const userData = await authService.authenticateUser(username, password);

    if (!userData) {
      console.log(`❌ Login falhou para: ${username}`);
      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas",
      });
    }

    // 🔄 SINCRONIZAR USUÁRIO NO BANCO AUTOMATICAMENTE
    try {
      await userSyncService.syncUserFromLDAP(userData);
      console.log(`🔄 Usuário ${username} sincronizado no banco`);
    } catch (syncError) {
      console.error(`⚠️ Erro ao sincronizar usuário ${username}:`, syncError);
      // Continua o login mesmo com erro de sincronização
    }

    const token = authService.generateToken(userData);

    console.log(`✅ Login bem-sucedido para: ${username}`);

    res.json({
      success: true,
      user: userData,
      token: token,
      message: "Login realizado com sucesso!",
    });
  } catch (error) {
    console.error("🚨 Erro no login:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// Rota protegida de exemplo
router.get("/protected", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token não fornecido",
    });
  }

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, config.jwt.secret);
    res.json({
      success: true,
      message: "Rota protegida acessada!",
      user: decoded,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token inválido",
    });
  }
});

// 🔍 Rota para listar usuários sincronizados (debug)
router.get("/users", async (req, res) => {
  try {
    const users = await userSyncService.getAllUsers();
    res.json({
      success: true,
      users: users,
      count: users.length,
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar usuários",
    });
  }
});

// 🔍 Rota para listar grupos sincronizados (debug)
router.get("/groups", async (req, res) => {
  try {
    const groups = await userSyncService.getAllGroups();
    res.json({
      success: true,
      groups: groups,
      count: groups.length,
    });
  } catch (error) {
    console.error("Erro ao buscar grupos:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar grupos",
    });
  }
});

export default router;
