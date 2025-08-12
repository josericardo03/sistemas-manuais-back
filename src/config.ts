export const config = {
  ldap: {
    url: process.env.LDAP_URL || "ldap://192.168.10.10:389",
    baseDN: process.env.LDAP_BASE_DN || "dc=desenvolvemt,dc=local",
    domain: process.env.LDAP_DOMAIN || "desenvolvemt.local",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "secret",
  },
  database: {
    host: process.env.DB_HOST || "192.168.10.17",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "manuais",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "12345678",
  },
};
