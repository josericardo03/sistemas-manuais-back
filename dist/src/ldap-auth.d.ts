interface LDAPConfig {
    url: string;
    baseDN: string;
    domain: string;
}
interface UserData {
    username: string;
    nome: string;
    grupos: string[];
    email: string | null;
}
export declare class LDAPAuthService {
    private config;
    private jwtSecret;
    constructor(config: LDAPConfig);
    authenticateUser(username: string, password: string): Promise<UserData | null>;
    private formatGroups;
    generateToken(userData: UserData): string;
}
export {};
//# sourceMappingURL=ldap-auth.d.ts.map