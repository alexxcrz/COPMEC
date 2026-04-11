import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { validateEnv } from "./config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

validateEnv();

const { app } = await import("./app.js");

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, () => {
  console.log(`COPMEC API listening on port ${PORT}`);
});
