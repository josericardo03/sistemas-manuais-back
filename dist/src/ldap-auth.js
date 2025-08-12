"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LDAPAuthService = void 0;
const ldapjs_1 = __importDefault(require("ldapjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class LDAPAuthService {
    constructor(config) {
        this.config = config;
        this.jwtSecret = process.env.JWT_SECRET || "sua-chave-secreta";
    }
    async authenticateUser(username, password) {
        return new Promise((resolve, reject) => {
            const client = ldapjs_1.default.createClient({
                url: this.config.url,
                timeout: 5000,
                connectTimeout: 5000,
            });
            const userDN = `${username}@${this.config.domain}`;
            client.bind(userDN, password, (bindErr) => {
                if (bindErr) {
                    client.unbind();
                    resolve(null);
                    return;
                }
                const searchOptions = {
                    scope: "sub",
                    filter: `(sAMAccountName=${username})`,
                    attributes: ["cn", "memberOf", "mail", "displayName"],
                };
                client.search(this.config.baseDN, searchOptions, (searchErr, res) => {
                    if (searchErr) {
                        client.unbind();
                        reject(searchErr);
                        return;
                    }
                    let userData = null;
                    res.on("searchEntry", (entry) => {
                        const attrs = entry.attributes;
                        userData = {
                            username: username,
                            nome: attrs.find((attr) => attr.type === "cn")?.values?.[0] ||
                                username,
                            grupos: this.formatGroups(attrs.find((attr) => attr.type === "memberOf")
                                ?.values || []),
                            email: attrs.find((attr) => attr.type === "mail")?.values?.[0] || null,
                        };
                    });
                    res.on("end", () => {
                        client.unbind();
                        resolve(userData);
                    });
                    res.on("error", (err) => {
                        client.unbind();
                        reject(err);
                    });
                });
            });
        });
    }
    formatGroups(memberOf) {
        return memberOf.map((group) => {
            const match = group.match(/^CN=([^,]+)/);
            return match ? match[1] : group;
        });
    }
    generateToken(userData) {
        return jsonwebtoken_1.default.sign({
            userId: userData.username,
            username: userData.username,
            nome: userData.nome,
            grupos: userData.grupos,
            email: userData.email,
        }, this.jwtSecret, { expiresIn: "8h" });
    }
}
exports.LDAPAuthService = LDAPAuthService;
//# sourceMappingURL=ldap-auth.js.map