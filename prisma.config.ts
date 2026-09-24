import { definePrismaConfig } from "prisma/config";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
import "dotenv/config";

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.ts",
    output: "./src/prisma/generated",
    db: {
      connection: process.env.DATABASE_URL,
    },
  }),
});
