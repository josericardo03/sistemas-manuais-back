import { Router, Request, Response } from "express";
import { NotificationService } from "../services/notification-service";
import { CreateNotification } from "../models/notification";

const router = Router();
const notificationService = new NotificationService();

// 🔍 MIDDLEWARE DE AUTENTICAÇÃO
const authenticateUser = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token de autenticação necessário",
    });
  }

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "supersegredo123"
    );
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token inválido",
    });
  }
};

// 📋 LISTAR NOTIFICAÇÕES DO USUÁRIO
router.get("/", authenticateUser, async (req: Request, res: Response) => {
  try {
    const username = (req as any).user.username;
    const limit = parseInt(req.query.limit as string) || 50;

    const notifications = await notificationService.getUserNotifications(
      username,
      limit
    );

    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Erro ao listar notificações:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// 🔍 BUSCAR NOTIFICAÇÕES NÃO LIDAS
router.get("/unread", authenticateUser, async (req: Request, res: Response) => {
  try {
    const username = (req as any).user.username;
    const notifications = await notificationService.getUnreadNotifications(
      username
    );

    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Erro ao buscar notificações não lidas:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// 📊 CONTAR NOTIFICAÇÕES NÃO LIDAS
router.get("/count", authenticateUser, async (req: Request, res: Response) => {
  try {
    const username = (req as any).user.username;
    const count = await notificationService.getUnreadCount(username);

    res.json({
      success: true,
      count: count,
    });
  } catch (error) {
    console.error("Erro ao contar notificações:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// ✅ MARCAR COMO LIDA
router.patch(
  "/:id/read",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      const username = (req as any).user.username;

      await notificationService.markAsRead(notificationId, username);

      res.json({
        success: true,
        message: "Notificação marcada como lida",
      });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

// ✅ MARCAR TODAS COMO LIDAS
router.patch(
  "/read-all",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const username = (req as any).user.username;

      await notificationService.markAllAsRead(username);

      res.json({
        success: true,
        message: "Todas as notificações foram marcadas como lidas",
      });
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

// 🗑️ DELETAR NOTIFICAÇÃO
router.delete("/:id", authenticateUser, async (req: Request, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    const username = (req as any).user.username;

    await notificationService.deleteNotification(notificationId, username);

    res.json({
      success: true,
      message: "Notificação deletada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar notificação:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// 🔔 CRIAR NOTIFICAÇÃO (para testes ou admin)
router.post("/", authenticateUser, async (req: Request, res: Response) => {
  try {
    const notification: CreateNotification = req.body;

    // Verificar se é admin ou se está criando para si mesmo
    if (
      (req as any).user.role !== "admin" &&
      (req as any).user.username !== notification.user_username
    ) {
      return res.status(403).json({
        success: false,
        message: "Sem permissão para criar notificação para outro usuário",
      });
    }

    const createdNotification = await notificationService.createNotification(
      notification
    );

    res.json({
      success: true,
      data: createdNotification,
      message: "Notificação criada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

export default router;
