import { Router, Request, Response } from "express";
import { ApprovalService } from "../services/approval-service";
import { ApprovalDecision, ManualApprovalRule } from "../models/approval";

const router = Router();
const approvalService = new ApprovalService();

// 🔍 MIDDLEWARE DE AUTENTICAÇÃO (simplificado)
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

// 📋 LISTAR SOLICITAÇÕES DE APROVAÇÃO
router.get(
  "/requests",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      const requests = await approvalService.getApprovalRequests(status);

      res.json({
        success: true,
        data: requests,
        count: requests.length,
      });
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

// 📊 OBTER RESUMO DE APROVAÇÃO
router.get(
  "/summary/:manualId/:versionSeq",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { manualId, versionSeq } = req.params;
      const summary = await approvalService.getApprovalSummary(
        manualId,
        parseInt(versionSeq)
      );

      if (!summary) {
        return res.status(404).json({
          success: false,
          message: "Manual não encontrado",
        });
      }

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("Erro ao buscar resumo:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

// ✅ APROVAR/REJEITAR MANUAL
router.post(
  "/decision",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const decision: ApprovalDecision = req.body;
      const username = (req as any).user.username;

      // Verificar se o usuário pode aprovar
      const canApprove = await approvalService.canUserApprove(
        decision.manual_id,
        username
      );
      if (!canApprove) {
        return res.status(403).json({
          success: false,
          message: "Usuário não tem permissão para aprovar este manual",
        });
      }

      // Registrar decisão
      await approvalService.approveManual({
        ...decision,
        approver_username: username,
      });

      // Obter resumo atualizado
      const summary = await approvalService.getApprovalSummary(
        decision.manual_id,
        decision.version_seq
      );

      res.json({
        success: true,
        message: `Manual ${
          decision.decision === "approved" ? "aprovado" : "rejeitado"
        } com sucesso`,
        data: summary,
      });
    } catch (error) {
      console.error("Erro ao registrar decisão:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

// 👥 LISTAR APROVADORES DE UM MANUAL
router.get(
  "/approvers/:manualId/:versionSeq",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { manualId, versionSeq } = req.params;
      const approvers = await approvalService.getManualApprovers(
        manualId,
        parseInt(versionSeq)
      );

      res.json({
        success: true,
        data: approvers,
        count: approvers.length,
      });
    } catch (error) {
      console.error("Erro ao buscar aprovadores:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

// 📝 CRIAR/ATUALIZAR REGRAS DE APROVAÇÃO
router.post("/rules", authenticateUser, async (req: Request, res: Response) => {
  try {
    const rule: ManualApprovalRule = req.body;

    // Verificar se é admin (implementar lógica específica)
    if ((req as any).user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Apenas administradores podem criar regras de aprovação",
      });
    }

    await approvalService.createApprovalRule(rule);

    res.json({
      success: true,
      message: "Regra de aprovação criada/atualizada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar regra:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// 🔍 OBTER REGRAS DE APROVAÇÃO
router.get(
  "/rules/:manualId",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { manualId } = req.params;
      const rule = await approvalService.getApprovalRules(manualId);

      res.json({
        success: true,
        data: rule,
      });
    } catch (error) {
      console.error("Erro ao buscar regra:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

// 📈 ESTATÍSTICAS DE APROVAÇÃO
router.get("/stats", authenticateUser, async (req: Request, res: Response) => {
  try {
    const stats = await approvalService.getApprovalStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// 🔄 VERIFICAR STATUS DE APROVAÇÃO
router.get(
  "/status/:manualId/:versionSeq",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { manualId, versionSeq } = req.params;
      const status = await approvalService.checkApprovalStatus(
        manualId,
        parseInt(versionSeq)
      );

      res.json({
        success: true,
        data: { status },
      });
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

// 🗑️ REMOVER APROVAÇÃO (apenas admin)
router.delete(
  "/approval/:manualId/:versionSeq/:username",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { manualId, versionSeq, username } = req.params;

      // Verificar se é admin
      if ((req as any).user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Apenas administradores podem remover aprovações",
        });
      }

      await approvalService.removeApproval(
        manualId,
        parseInt(versionSeq),
        username
      );

      res.json({
        success: true,
        message: "Todas as decisões do usuário removidas com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover aprovação:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

// 🗑️ REMOVER DECISÃO ESPECÍFICA (apenas admin)
router.delete(
  "/approval/:manualId/:versionSeq/:username/decision/:decisionSeq",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { manualId, versionSeq, username, decisionSeq } = req.params;

      // Verificar se é admin
      if ((req as any).user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Apenas administradores podem remover aprovações",
        });
      }

      await approvalService.removeApproval(
        manualId,
        parseInt(versionSeq),
        username,
        parseInt(decisionSeq)
      );

      res.json({
        success: true,
        message: "Decisão específica removida com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover aprovação:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

export default router;
