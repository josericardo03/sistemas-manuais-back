import app from "./src/app";

const PORT: number = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🔐 Rotas de autenticação: /api/auth`);
  console.log(`📁 Rota de teste: /test`);
});
