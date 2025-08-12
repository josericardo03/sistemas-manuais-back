"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./src/app"));
const PORT = 3000;
app_1.default.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🔐 Rotas de autenticação: /api/auth`);
    console.log(`📁 Rota de teste: /test`);
});
//# sourceMappingURL=server.js.map