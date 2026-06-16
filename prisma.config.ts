import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migrace (Prisma CLI) jedou přes DIRECT_URL = Neon bez pooleru.
// Runtime klient používá driver adapter (DATABASE_URL, pooled) v src/lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"],
  },
});
