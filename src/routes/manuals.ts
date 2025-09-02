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

// 📄 ABRIR MANUAL COMO PDF (CONVERTIDO DO DOCX)
router.get(
  "/:manualId/open-pdf",
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

      // Configurar OnlyOffice para PDF
      const title = `${manual.title} - v${versionSeq} (PDF)`;
      const fileUrl = `http://${LOCAL_IP}:3000/api/manuals/${manualId}/download/${versionSeq}`;
      const callbackUrl = `http://${LOCAL_IP}:3000/api/manuals/callback`;

      // URL para download em PDF
      const pdfDownloadUrl = `http://${LOCAL_IP}:3000/api/manuals/${manualId}/download/${versionSeq}?format=pdf`;

      // Payload específico para PDF (conversão automática)
      const payload = {
        document: {
          fileType: "docx", // Arquivo original é DOCX
          key: documentKey,
          title: title,
          url: fileUrl,
        },
        documentType: "word", // Tipo original
        editorConfig: {
          callbackUrl: callbackUrl,
          user: {
            id: (req as any).user.username,
            name: (req as any).user.nome || (req as any).user.username,
          },
          mode: "view", // Modo visualização (ideal para PDFs)
          // Permitir comentários e anotações
          canEdit: false, // Não editar conteúdo
          canComment: true, // Permitir comentários
          canReview: true, // Permitir revisão
          // Configurações de visualização
          lang: "pt-BR",
          // Interface otimizada para PDF
          toolbar: "full", // Barra de ferramentas completa
        },
      };

      // Gerar token JWT para OnlyOffice
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "supersegredo123",
        { expiresIn: "1h" }
      );

      // Renderizar página do OnlyOffice com configuração PDF
      res.send(`<!doctype html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>OnlyOffice - ${title} (PDF)</title>
          <script src="http://${LOCAL_IP}:8080/web-apps/apps/api/documents/api.js"></script>
          <style>
            html,body{height:100%;margin:0}
            #onlyoffice-editor{position:fixed; inset:0;}
                         .pdf-info {
               position: fixed;
               top: 10px;
               left: 10px;
               background: rgba(0,0,0,0.8);
               color: white;
               padding: 10px;
               border-radius: 5px;
               z-index: 1000;
               font-size: 12px;
             }
             .pdf-download-btn {
               display: inline-block;
               background: #4CAF50;
               color: white;
               padding: 8px 16px;
               text-decoration: none;
               border-radius: 4px;
               margin-top: 8px;
               font-weight: bold;
               transition: background 0.3s;
             }
             .pdf-download-btn:hover {
               background: #45a049;
             }
          </style>
        </head>
                 <body>
           <div class="pdf-info">
             📄 Visualizando como PDF (conversão visual OnlyOffice)
             <br>
             ✅ Download agora retorna PDF real!
             <br>
             <a href="${pdfDownloadUrl}" class="pdf-download-btn" target="_blank">
               📥 Download PDF
             </a>
           </div>
           <div id="onlyoffice-editor"></div>
          <script>
            const config = ${JSON.stringify(payload)};
            config.token = ${JSON.stringify(token)};
            
            // Configurações específicas para PDF
            config.editorConfig.mode = "view";
            config.editorConfig.canEdit = false;
            config.editorConfig.canComment = true;
            config.editorConfig.canReview = true;
            
            // Inicializar editor com configuração PDF
            new DocsAPI.DocEditor("onlyoffice-editor", config);
          </script>
        </body>
        </html>`);
    } catch (error) {
      console.error("Erro ao abrir manual como PDF:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }
);

// 📥 DOWNLOAD DO ARQUIVO DO MANUAL (DOCX ou PDF)
router.get(
  "/:manualId/download/:versionSeq",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { manualId, versionSeq } = req.params;
      const { format = "docx" } = req.query; // Parâmetro para escolher formato

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

      // Se o formato solicitado for PDF, converter DOCX para PDF
      if (format === "pdf") {
        try {
          console.log("🔄 Convertendo DOCX para PDF...");

          // Importar biblioteca de conversão
          const libre = require("libreoffice-convert");
          const { promisify } = require("util");
          const convertAsync = promisify(libre.convert);

          // Converter DOCX para PDF
          const pdfBuffer = await convertAsync(
            manualVersion.file_data,
            ".pdf",
            undefined
          );

          console.log("✅ Conversão para PDF realizada com sucesso!");

          // Configurar headers para download PDF
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="manual-${manualId}-v${versionSeq}.pdf"`
          );
          res.setHeader("Content-Length", pdfBuffer.length);

          // Enviar PDF convertido
          res.send(pdfBuffer);
          return;
        } catch (conversionError) {
          console.error("❌ Erro ao converter para PDF:", conversionError);
          console.log("⚠️ Retornando DOCX original devido a erro na conversão");

          // Fallback: retornar DOCX original
          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          );
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="manual-${manualId}-v${versionSeq}.docx"`
          );
          res.setHeader("Content-Length", manualVersion.size_bytes);
          res.send(manualVersion.file_data);
          return;
        }
      }

      // Configurar headers para download DOCX (formato original)
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="manual-${manualId}-v${versionSeq}.docx"`
      );
      res.setHeader("Content-Length", manualVersion.size_bytes);

      // Enviar dados do arquivo DOCX original
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
