"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    ldap: {
        url: process.env.LDAP_URL || "ldap://192.168.10.10:389",
        baseDN: process.env.LDAP_BASE_DN || "dc=desenvolvemt,dc=local",
        domain: process.env.LDAP_DOMAIN || "desenvolvemt.local",
    },
    jwt: {
        secret: process.env.JWT_SECRET || "secret",
    },
};
//# sourceMappingURL=config.js.map