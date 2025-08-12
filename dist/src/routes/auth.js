"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ldap_auth_1 = require("../ldap-auth");
const config_1 = require("../config");
const router = (0, express_1.Router)();
const authService = new ldap_auth_1.LDAPAuthService(config_1.config.ldap);
// Rota de login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuário e senha são obrigatórios'
            });
        }
        console.log(`🔐 Tentativa de login: ${username}`);
        const userData = await authService.authenticateUser(username, password);
        if (!userData) {
            console.log(`❌ Login falhou para: ${username}`);
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }
        const token = authService.generateToken(userData);
        console.log(`✅ Login bem-sucedido para: ${username}`);
        res.json({
            success: true,
            user: userData,
            token: token,
            message: 'Login realizado com sucesso!'
        });
    }
    catch (error) {
        console.error('🚨 Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});
// Rota protegida de exemplo
router.get('/protected', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token não fornecido'
        });
    }
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, config_1.config.jwt.secret);
        res.json({
            success: true,
            message: 'Rota protegida acessada!',
            user: decoded
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map