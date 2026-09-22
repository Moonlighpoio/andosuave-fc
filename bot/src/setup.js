require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function main() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(path.join(__dirname, "..", ".env.example"), envPath);
    console.log("Se creó .env a partir de .env.example. Llénalo antes de iniciar.");
  } else {
    console.log(".env ya existe.");
  }

  const dataDir = process.env.DATA_DIR || "data";
  fs.mkdirSync(path.join(__dirname, "..", dataDir), { recursive: true });
  console.log("Carpeta de datos lista: " + dataDir);

  console.log("\nPróximos pasos:");
  console.log("1. Edita .env: pon ADMIN_NUMBERS y (opcional) GROUP_ID, PAIRING_NUMBER, GITHUB_TOKEN.");
  console.log("2. Ejecuta: npm start");
  console.log("3. Con el número externo, escanea el QR (o usa el pairing code).");
  console.log("4. En el grupo del club escribe !ayuda para ver los comandos.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});