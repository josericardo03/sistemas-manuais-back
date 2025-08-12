import express from "express";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth";

// Importação do multer usando require para evitar problemas de tipagem
const multer = require("multer");

const app = express();
const PORT: number = 3000;
const JWT_SECRET: string = "supersegredo123";

// Middleware para parsing de JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de upload
const uploadDir: string = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

// Rotas de autenticação
app.use("/api/auth", authRoutes);

// Rota principal com formulário de upload
app.get("/", (req, res) => {
  res.send(`<form action="/upload" method="post" enctype="multipart/form-data">
    <input type="file" name="file" accept=".docx" required />
    <button type="submit">Enviar</button>
  </form>`);
});

// Rota de teste para verificar se está funcionando
app.get("/test", (req, res) => {
  res.json({ message: "App funcionando!" });
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
  const fileUrl: string = `http://host.docker.internal:${PORT}${req.query.fileUrl}`;
  const callbackUrl: string = `http://host.docker.internal:${PORT}/callback`;

  // 1) MONTE O PAYLOAD
  const payload: any = {
    document: {
      fileType: "docx",
      key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      url: fileUrl,
    },
    documentType: "word",
    editorConfig: {
      lang: "pt-BR",
      callbackUrl,
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
      <script src="http://localhost:8080/web-apps/apps/api/documents/api.js"></script>
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
