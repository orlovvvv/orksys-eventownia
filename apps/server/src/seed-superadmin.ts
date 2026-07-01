import { createAuth } from "@orksys-eventownia/auth";
import { createDb } from "@orksys-eventownia/db";
import { user } from "@orksys-eventownia/db/schema/auth";
import { env } from "@orksys-eventownia/env/server";
import { eq } from "drizzle-orm";

let seedPromise: Promise<void> | null = null;

export function ensureSuperAdmin() {
  seedPromise ??= seedSuperAdmin().catch((error) => {
    seedPromise = null;
    console.error("Failed to ensure superadmin", error);
  });

  return seedPromise;
}

async function seedSuperAdmin() {
  const email = env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = env.SUPERADMIN_PASSWORD;
  const name = env.SUPERADMIN_NAME?.trim() || "Super Admin";

  if (!email || !password) {
    console.warn("Skipping superadmin seed because SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD is missing.");
    return;
  }

  const db = createDb();
  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
    columns: { id: true },
  });

  if (existing) return;

  const auth = createAuth();
  await auth.api.createUser({
    body: {
      email,
      password,
      name,
      role: "admin",
    },
  });

  await db
    .update(user)
    .set({
      emailVerified: true,
      role: "admin",
      banned: false,
      banReason: null,
      banExpires: null,
      updatedAt: new Date(),
    })
    .where(eq(user.email, email));
}
