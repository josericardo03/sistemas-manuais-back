import express from "express";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import authRoutes from "./routes/auth";
import approvalRoutes from "./routes/approval";
import manualRoutes from "./routes/manuals"; // Adicionado para rotas de manuais
import notificationRoutes from "./routes/notifications"; // Adicionado para rotas de notificações
import os from "os";

// Importação do multer usando require para evitar problemas de tipagem
const multer = require("multer");

const app = express();
const PORT: number = 3000;
const JWT_SECRET: string = "supersegredo123";

// Função para obter o IP da rede local
function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const netInterface of interfaces[name] || []) {
      // Pula interfaces internas e IPv6
      if (netInterface.family === "IPv4" && !netInterface.internal) {
        return netInterface.address;
      }
    }
  }
  return "localhost";
}

const LOCAL_IP = getLocalIP();
console.log(`🌐 Servidor rodando em: http://${LOCAL_IP}:${PORT}`);

// Middleware para parsing de JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de upload
const uploadDir: string = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

// Rotas de autenticação
app.use("/api/auth", authRoutes);

// Rotas de aprovação
app.use("/api/approval", approvalRoutes);

// Rotas de manuais
app.use("/api/manuals", manualRoutes);

// Rotas de notificações
app.use("/api/notifications", notificationRoutes);

// Rota principal com formulário de upload e botão de teste
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sistema de Manuais - OnlyOffice</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            h1 {
                text-align: center;
                margin-bottom: 40px;
                font-size: 2.5em;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            }
            .section {
                margin-bottom: 40px;
                padding: 30px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 15px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .section h2 {
                margin-top: 0;
                color: #ffd700;
                font-size: 1.8em;
            }
            .upload-form {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .file-input {
                padding: 15px;
                border: 2px dashed rgba(255, 255, 255, 0.3);
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.05);
                color: white;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .file-input:hover {
                border-color: #ffd700;
                background: rgba(255, 255, 255, 0.1);
            }
            .btn {
                padding: 15px 30px;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .btn-primary {
                background: linear-gradient(45deg, #4CAF50, #45a049);
                color: white;
            }
            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
            }
            .btn-test {
                background: linear-gradient(45deg, #ff6b6b, #ee5a52);
                color: white;
                font-size: 18px;
                padding: 20px 40px;
            }
            .btn-test:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
            }
            .description {
                text-align: center;
                margin-bottom: 30px;
                font-size: 1.1em;
                line-height: 1.6;
                opacity: 0.9;
            }
            .network-info {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .network-info h3 {
                color: #ffd700;
                margin-bottom: 15px;
            }
            .ip-address {
                background: rgba(0, 0, 0, 0.3);
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 1.1em;
                margin: 10px 0;
            }
            .features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            .feature {
                text-align: center;
                padding: 20px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .feature h3 {
                color: #ffd700;
                margin-bottom: 10px;
            }
            .auth-test {
                margin-bottom: 20px;
            }
            .auth-form {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-bottom: 20px;
            }
            .auth-result {
                background: rgba(0, 0, 0, 0.3);
                padding: 15px;
                border-radius: 10px;
                margin: 15px 0;
                font-family: monospace;
                white-space: pre-wrap;
                max-height: 200px;
                overflow-y: auto;
                display: none;
            }
            .auth-links {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                justify-content: center;
            }
            .auth-links .btn {
                font-size: 14px;
                padding: 10px 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📚 Sistema de Manuais</h1>
            <p class="description">
                Sistema completo para gerenciamento e edição de documentos usando OnlyOffice
            </p>
            
            <div class="network-info">
                <h3>🌐 Informações da Rede</h3>
                <p>Para acessar de outros computadores da rede, use:</p>
                <div class="ip-address">http://${LOCAL_IP}:${PORT}</div>
                <p style="font-size: 0.9em; opacity: 0.8;">
                    Certifique-se de que o OnlyOffice esteja rodando em: http://${LOCAL_IP}:8080
                </p>
            </div>
            
            <div class="section">
                <h2>🚀 Teste Rápido</h2>
                <p>Clique no botão abaixo para abrir instantaneamente um exemplo no OnlyOffice:</p>
                <div style="text-align: center;">
                    <button class="btn btn-test" onclick="window.open('/test-example', '_blank')">
                        🧪 TESTAR ONLYOFFICE
                    </button>
                </div>
                <p style="text-align: center; margin-top: 15px; opacity: 0.8;">
                    Abre em uma nova aba com um documento de exemplo
                </p>
            </div>

            <div class="section">
                <h2>📤 Upload de Documentos</h2>
                <form action="/upload" method="post" enctype="multipart/form-data" class="upload-form">
                    <input type="file" name="file" accept=".docx" required class="file-input" />
                    <button type="submit" class="btn btn-primary">📤 Enviar Documento</button>
                </form>
            </div>

            <div class="section">
                <h2>🔐 Teste de Autenticação</h2>
                <div class="auth-test">
                    <div class="auth-form">
                        <input type="text" id="username" placeholder="Usuário LDAP" class="file-input" />
                        <input type="password" id="password" placeholder="Senha" class="file-input" />
                        <button onclick="testAuth()" class="btn btn-primary">🔐 Testar Login</button>
                    </div>
                    <div id="auth-result" class="auth-result"></div>
                </div>
                <div class="auth-links">
                    <a href="/api/auth/users" target="_blank" class="btn btn-primary" style="margin: 5px;">👥 Listar Usuários</a>
                    <a href="/api/auth/groups" target="_blank" class="btn btn-primary" style="margin: 5px;">🏷️ Listar Grupos</a>
                    <a href="/test" target="_blank" class="btn btn-primary" style="margin: 5px;">🧪 Status da API</a>
                </div>
            </div>

                               <div class="section">
                       <h2>📚 Gerenciar Manuais</h2>
                       <p>Visualize e edite seus manuais diretamente no OnlyOffice:</p>
                       <div class="auth-links">
                           <a href="/api/manuals" target="_blank" class="btn btn-primary" style="margin: 5px;">📋 Listar Manuais</a>
                           <a href="/api/manuals/with-approval-status" target="_blank" class="btn btn-primary" style="margin: 5px;">📊 Manuais com Status</a>
                           <a href="/api/approval/requests" target="_blank" class="btn btn-primary" style="margin: 5px;">⏳ Solicitações de Aprovação</a>
                       </div>
                       <p style="text-align: center; margin-top: 15px; opacity: 0.8;">
                           Use o token de autenticação para acessar as rotas protegidas
                       </p>
                       <p style="text-align: center; margin-top: 15px; opacity: 0.8;">
                           <strong>💡 Dica:</strong> Use a rota PDF para visualização e comentários, DOCX para edição
                       </p>
                   </div>

                   <div class="section">
                       <h2>🔔 Sistema de Notificações</h2>
                       <p>Gerencie suas notificações e acompanhe atualizações:</p>
                       <div class="auth-links">
                           <a href="/api/notifications" target="_blank" class="btn btn-primary" style="margin: 5px;">📋 Minhas Notificações</a>
                           <a href="/api/notifications/unread" target="_blank" class="btn btn-primary" style="margin: 5px;">🔍 Não Lidas</a>
                           <a href="/api/notifications/count" target="_blank" class="btn btn-primary" style="margin: 5px;">📊 Contador</a>
                       </div>
                       <p style="text-align: center; margin-top: 15px; opacity: 0.8;">
                           Receba notificações automáticas sobre aprovações e atualizações
                       </p>
                   </div>

            <div class="features">
                <div class="feature">
                    <h3>🔐 Autenticação LDAP</h3>
                    <p>Integração com sistema de autenticação corporativo</p>
                </div>
                <div class="feature">
                    <h3>📝 Edição Colaborativa</h3>
                    <p>Múltiplos usuários podem editar simultaneamente</p>
                </div>
                <div class="feature">
                    <h3>💾 Salvamento Automático</h3>
                    <p>Seus documentos são salvos automaticamente</p>
                </div>
                <div class="feature">
                    <h3>🌐 Interface Moderna</h3>
                    <p>Interface responsiva e intuitiva</p>
                </div>
            </div>
        </div>

        <script>
            async function testAuth() {
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const resultDiv = document.getElementById('auth-result');
                
                if (!username || !password) {
                    resultDiv.style.display = 'block';
                    resultDiv.innerHTML = '❌ Por favor, preencha usuário e senha';
                    return;
                }
                
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = '🔄 Testando autenticação...';
                
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, password })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        resultDiv.innerHTML = '✅ Login bem-sucedido!\\n\\n👤 Usuário: ' + data.user.username + '\\n📧 Email: ' + (data.user.email || 'N/A') + '\\n🔑 Token: ' + data.token.substring(0, 50) + '...\\n\\n💡 Use este token para acessar rotas protegidas';
                    } else {
                        resultDiv.innerHTML = '❌ Falha no login:\\n\\n' + data.message;
                    }
                } catch (error) {
                    resultDiv.innerHTML = '🚨 Erro na requisição:\\n\\n' + error.message;
                }
            }
        </script>
    </body>
    </html>`);
});

// Rota de teste para verificar se está funcionando
app.get("/test", (req, res) => {
  res.json({ message: "App funcionando!", ip: LOCAL_IP, port: PORT });
});

// Configuração do multer para upload
const storage = multer.diskStorage({
  destination: (
    _: any,
    __: any,
    cb: (error: Error | null, destination: string) => void
  ) => cb(null, uploadDir),
  filename: (
    _: any,
    file: any,
    cb: (error: Error | null, filename: string) => void
  ) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// Rota de upload de arquivos
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("Nenhum arquivo enviado");
  }

  const urlPath: string = `/uploads/${path.basename(req.file.path)}`;
  const title: string = req.file.originalname;
  res.redirect(
    `/edit?fileUrl=${encodeURIComponent(urlPath)}&title=${encodeURIComponent(
      title
    )}`
  );
});

// Rota do editor OnlyOffice
app.get("/edit", (req, res) => {
  const title: string = String(req.query.title || "Documento.docx");
  const fileUrl: string = `http://${LOCAL_IP}:${PORT}${req.query.fileUrl}`;
  const callbackUrl: string = `http://${LOCAL_IP}:${PORT}/callback`;

  // Identificação do usuário para coedição (pode vir via query ou sua autenticação)
  const userId: string = String(req.query.userId || req.ip || "guest");
  const userName: string = String(req.query.userName || "Convidado");

  // Chave estável por documento para permitir coedição
  const documentKey: string = crypto
    .createHash("sha256")
    .update(fileUrl)
    .digest("hex")
    .slice(0, 32);

  // 1) MONTE O PAYLOAD
  const payload: any = {
    document: {
      fileType: "docx",
      key: documentKey,
      title,
      url: fileUrl,
    },
    documentType: "word",
    editorConfig: {
      lang: "pt-BR",
      callbackUrl,
      user: {
        id: userId,
        name: userName,
      },
      coEditing: {
        mode: "fast",
        change: true,
      },
    },
    exp: Math.floor(Date.now() / 1000) + 300,
  };

  // 2) GERE O TOKEN
  const token: string = jwt.sign(payload, JWT_SECRET, { algorithm: "HS256" });

  // 3) ENVIE PARA O FRONT **SEM MUDAR NADA** DO PAYLOAD
  res.send(`<!doctype html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <script src="http://${LOCAL_IP}:8080/web-apps/apps/api/documents/api.js"></script>
      <style>
        html,body{height:100%;margin:0}
        /* ocupa 100% da janela */
        #onlyoffice-editor{position:fixed; inset:0;}
      </style>
    </head>
    <body>
      <div id="onlyoffice-editor"></div>
      <script>
        const config = ${JSON.stringify(payload)};
        config.token = ${JSON.stringify(token)};
        new DocsAPI.DocEditor("onlyoffice-editor", config);
      </script>
    </body>
    </html>`);
});

// Rota para exemplo instantâneo do OnlyOffice
app.get("/test-example", (req, res) => {
  const title: string = "Documento de Exemplo.docx";
  // Usa um dos arquivos existentes na pasta uploads
  const fileUrl: string = `http://${LOCAL_IP}:${PORT}/uploads/1755004375622-DocTeste (1) (1).docx`;
  const callbackUrl: string = `http://${LOCAL_IP}:${PORT}/callback`;

  // Identificação do usuário para coedição
  const userId: string = "test-user";
  const userName: string = "Usuário de Teste";

  // Chave estável por documento para permitir coedição
  const documentKey: string = crypto
    .createHash("sha256")
    .update("example-document")
    .digest("hex")
    .slice(0, 32);

  // Payload para o OnlyOffice
  const payload: any = {
    document: {
      fileType: "docx",
      key: documentKey,
      title,
      url: fileUrl,
    },
    documentType: "word",
    editorConfig: {
      lang: "pt-BR",
      callbackUrl,
      user: {
        id: userId,
        name: userName,
      },
      coEditing: {
        mode: "fast",
        change: true,
      },
    },
    exp: Math.floor(Date.now() / 1000) + 300,
  };

  // Gera o token JWT
  const token: string = jwt.sign(payload, JWT_SECRET, { algorithm: "HS256" });

  // Envia para o front
  res.send(`<!doctype html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>OnlyOffice - Exemplo de Teste</title>
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
      <div class="loading">Carregando OnlyOffice...</div>
      <div id="onlyoffice-editor"></div>
      <script>
        // Aguarda o carregamento da API do OnlyOffice
        if (typeof DocsAPI !== 'undefined') {
          const config = ${JSON.stringify(payload)};
          config.token = ${JSON.stringify(token)};
          new DocsAPI.DocEditor("onlyoffice-editor", config);
          document.querySelector('.loading').style.display = 'none';
        } else {
          // Fallback se a API não carregar
          document.querySelector('.loading').innerHTML = 
            'Erro ao carregar OnlyOffice. Verifique se o servidor está rodando em: http://${LOCAL_IP}:8080';
        }
      </script>
    </body>
    </html>`);
});

// Callback que SEMPRE devolve 200 e salva quando status=2
app.post("/callback", (req, res) => {
  let body: string = "";
  req.on("data", (c: Buffer) => (body += c.toString()));
  req.on("end", async () => {
    try {
      const data: any = JSON.parse(body || "{}");
      console.log("ONLYOFFICE CALLBACK:", data); // veja o status aqui

      // 1) RESPONDA JÁ no formato que o OnlyOffice espera
      //    error: 0 = ok
      res.status(200).json({ error: 0 });

      // 2) Salve em background quando estiver pronto (status === 2)
      if (data.status === 2 && data.url) {
        // se seu Node < 18, instale node-fetch e use "const fetch = (...)=>(import('node-fetch').then(({default:f})=>f(...)))""
        const fetchResponse = await fetch(data.url);
        if (!fetchResponse.ok)
          throw new Error("Falha ao baixar salvo: " + fetchResponse.status);
        const buf: Buffer = Buffer.from(await fetchResponse.arrayBuffer());
        const name: string = data.filename || `saved-${Date.now()}.docx`;
        fs.writeFileSync(path.join(uploadDir, name), buf);
        console.log("Arquivo salvo:", name);
      }
    } catch (e: any) {
      console.error("Erro no callback:", e);
      // já respondemos 200; não quebre
    }
  });
});

export default app;
