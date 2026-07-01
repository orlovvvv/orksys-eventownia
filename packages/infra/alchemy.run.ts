import alchemy from "alchemy";
import { Worker } from "alchemy/cloudflare";
import { D1Database } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/server/.env" });

const isDev = process.argv.includes("--dev");
const devDefaults = {
  CORS_ORIGIN: "http://localhost:3001",
  BETTER_AUTH_SECRET: "local-dev-secret-minimum-32-characters",
  BETTER_AUTH_URL: "http://localhost:3000",
  SUPERADMIN_EMAIL: "admin@dmuchance.lomza.pl",
  SUPERADMIN_NAME: "Super Admin",
} as const;

function envBinding(name: keyof typeof devDefaults) {
  if (isDev) {
    return process.env[name] ?? devDefaults[name];
  }

  return alchemy.env[name]!;
}

function secretBinding(name: "BETTER_AUTH_SECRET" | "SUPERADMIN_PASSWORD") {
  if (isDev) {
    if (name === "SUPERADMIN_PASSWORD") {
      return process.env[name] ?? "local-superadmin-password";
    }

    return process.env[name] ?? devDefaults[name];
  }

  return alchemy.secret.env[name]!;
}

const app = await alchemy("orksys-eventownia", {
  password: process.env.ALCHEMY_PASSWORD ?? (isDev ? "local-dev-password" : undefined),
});

const db = await D1Database("database", {
  migrationsDir: "../../packages/db/src/migrations",
});

export const server = await Worker("server", {
  cwd: "../../apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  bindings: {
    DB: db,
    CORS_ORIGIN: envBinding("CORS_ORIGIN"),
    BETTER_AUTH_SECRET: secretBinding("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: envBinding("BETTER_AUTH_URL"),
    SUPERADMIN_EMAIL: envBinding("SUPERADMIN_EMAIL"),
    SUPERADMIN_PASSWORD: secretBinding("SUPERADMIN_PASSWORD"),
    SUPERADMIN_NAME: envBinding("SUPERADMIN_NAME"),
  },
  dev: {
    port: 3000,
  },
});

console.log(`Server -> ${server.url}`);

await app.finalize();
