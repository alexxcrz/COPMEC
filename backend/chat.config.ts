import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/chat.prisma",
  datasource: {
    url: process.env["CHAT_DB_URL"] ?? "file:/var/data/chat.db",
  },
});
