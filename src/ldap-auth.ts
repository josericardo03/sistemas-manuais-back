import ldap from "ldapjs";
import jwt from "jsonwebtoken";

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

export class LDAPAuthService {
  private config: LDAPConfig;
  private jwtSecret: string;

  constructor(config: LDAPConfig) {
    this.config = config;
    this.jwtSecret = process.env.JWT_SECRET || "sua-chave-secreta";
  }

  async authenticateUser(
    username: string,
    password: string
  ): Promise<UserData | null> {
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({
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
          scope: "sub" as const,
          filter: `(sAMAccountName=${username})`,
          attributes: ["cn", "memberOf", "mail", "displayName"],
        };

        client.search(this.config.baseDN, searchOptions, (searchErr, res) => {
          if (searchErr) {
            client.unbind();
            reject(searchErr);
            return;
          }

          let userData: UserData | null = null;

          res.on("searchEntry", (entry) => {
            const attrs = entry.attributes;
            userData = {
              username: username,
              nome:
                attrs.find((attr) => attr.type === "cn")?.values?.[0] ||
                username,
              grupos: this.formatGroups(
                (attrs.find((attr) => attr.type === "memberOf")
                  ?.values as string[]) || []
              ),
              email:
                attrs.find((attr) => attr.type === "mail")?.values?.[0] || null,
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

  private formatGroups(memberOf: string[]): string[] {
    return memberOf.map((group) => {
      const match = group.match(/^CN=([^,]+)/);
      return match ? match[1] : group;
    });
  }

  generateToken(userData: UserData): string {
    return jwt.sign(
      {
        userId: userData.username,
        username: userData.username,
        nome: userData.nome,
        grupos: userData.grupos,
        email: userData.email,
      },
      this.jwtSecret,
      { expiresIn: "8h" }
    );
  }
}
