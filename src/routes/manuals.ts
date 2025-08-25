import { Router, Request, Response } from "express";
import { ManualService } from "../services/manual-service";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import os from "os";

const router = Router();
const manualService = new ManualService();

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

// 📋 LISTAR TODOS OS MANUAIS
router.get("/", authenticateUser, async (req: Request, res: Response) => {
  try {
    const manuals = await manualService.getAllManuals();

    res.json({
      success: true,
      data: manuals,
      count: manuals.length,
    });
  } catch (error) {
    console.error("Erro ao buscar manuais:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// 📊 LISTAR MANUAIS COM STATUS DE APROVAÇÃO
router.get(
  "/with-approval-status",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const manuals = await manualService.getManualsWithApprovalStatus();

      res.json({
        success: true,
        data: manuals,
        count: manuals.length,
      });
    } catch (error) {
      console.error("Erro ao buscar manuais com status:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

// 🔍 BUSCAR MANUAL POR ID
router.get(
  "/:manualId",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { manualId } = req.params;
      const manual = await manualService.getManualById(manualId);

      if (!manual) {
        return res.status(404).json({
          success: false,
          message: "Manual não encontrado",
        });
      }

      res.json({
        success: true,
        data: manual,
      });
    } catch (error) {
      console.error("Erro ao buscar manual:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

// 📄 ABRIR MANUAL NO ONLYOFFICE
router.get(
  "/:manualId/open",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { manualId } = req.params;
      const { version = "latest" } = req.query;

      // Buscar manual
      const manual = await manualService.getManualById(manualId);
      if (!manual) {
        return res.status(404).json({
          success: false,
          message: "Manual não encontrado",
        });
      }

      // Determinar versão
      const versionSeq =
        version === "latest"
          ? manual.latest_version_seq
          : parseInt(version as string);

      // Buscar versão específica
      const manualVersion = await manualService.getManualVersion(
        manualId,
        versionSeq
      );
      if (!manualVersion) {
        return res.status(404).json({
          success: false,
          message: "Versão do manual não encontrada",
        });
      }

      // Gerar chave única para o documento
      const documentKey = crypto.randomBytes(32).toString("hex");

      // Obter IP local para rede
      const LOCAL_IP = getLocalIP();

      // Configurar OnlyOffice
      const title = `${manual.title} - v${versionSeq}`;
      const fileUrl = `http://${LOCAL_IP}:3000/api/manuals/${manualId}/download/${versionSeq}`;
      const callbackUrl = `http://${LOCAL_IP}:3000/api/manuals/callback`;

      // Payload para OnlyOffice
      const payload = {
        document: {
          fileType: manualVersion.format || "docx",
          key: documentKey,
          title: title,
          url: fileUrl,
        },
        documentType: "word",
        editorConfig: {
          callbackUrl: callbackUrl,
          user: {
            id: (req as any).user.username,
            name: (req as any).user.nome || (req as any).user.username,
          },
          mode: "edit",
        },
      };

      // Gerar token JWT para OnlyOffice
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "supersegredo123",
        { expiresIn: "1h" }
      );

      // Renderizar página do OnlyOffice
      res.send(`<!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>OnlyOffice - ${title}</title>
        <script src="http://${LOCAL_IP}:8080/web-apps/apps/api/documents/api.js"></script>
        <style>
          html,body{height:100%;margin:0}
          #onlyoffice-editor{position:fixed; inset:0;}
          .loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: Arial, sans-serif;
            font-size: 18px;
            color: #333;
            z-index: 1000;
          }
        </style>
      </head>
      <body>
        <div class="loading">Carregando ${title} no OnlyOffice...</div>
        <div id="onlyoffice-editor"></div>
        <script>
          if (typeof DocsAPI !== 'undefined') {
            const config = ${JSON.stringify(payload)};
            config.token = ${JSON.stringify(token)};
            new DocsAPI.DocEditor("onlyoffice-editor", config);
            document.querySelector('.loading').style.display = 'none';
          } else {
            document.querySelector('.loading').innerHTML =
              'Erro ao carregar OnlyOffice. Verifique se o servidor está rodando em: http://${LOCAL_IP}:8080';
          }
        </script>
      </body>
      </html>`);
    } catch (error) {
      console.error("Erro ao abrir manual:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

// 📥 DOWNLOAD DO ARQUIVO DO MANUAL
router.get(
  "/:manualId/download/:versionSeq",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { manualId, versionSeq } = req.params;

      // Buscar versão do manual
      const manualVersion = await manualService.getManualVersion(
        manualId,
        parseInt(versionSeq)
      );
      if (!manualVersion) {
        return res.status(404).json({
          success: false,
          message: "Versão do manual não encontrada",
        });
      }

      // Configurar headers para download
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="manual-${manualId}-v${versionSeq}.${
          manualVersion.format || "docx"
        }"`
      );
      res.setHeader("Content-Length", manualVersion.size_bytes);

      // Enviar dados do arquivo
      res.send(manualVersion.file_data);
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

// 🔄 CALLBACK DO ONLYOFFICE
router.post("/callback", async (req: Request, res: Response) => {
  try {
    console.log("📞 Callback do OnlyOffice recebido:", req.body);

    // Aqui você pode implementar lógica para salvar mudanças
    // Por enquanto, apenas logamos o callback

    res.json({ error: 0 });
  } catch (error) {
    console.error("Erro no callback:", error);
    res.status(500).json({ error: 1 });
  }
});

// Função para obter IP local
function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const netInterface of interfaces[name] || []) {
      if (netInterface.family === "IPv4" && !netInterface.internal) {
        return netInterface.address;
      }
    }
  }
  return "localhost";
}

export default router;
