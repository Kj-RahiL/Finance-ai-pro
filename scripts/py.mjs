// Run a Python module inside server/ using the project venv (Windows or Unix).
// Usage: node scripts/py.mjs <module> [args...]   e.g. node scripts/py.mjs uvicorn app.main:app --reload
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverDir = path.join(root, "server");

const venvPython =
  process.platform === "win32"
    ? path.join(serverDir, ".venv", "Scripts", "python.exe")
    : path.join(serverDir, ".venv", "bin", "python");

let python = venvPython;
if (!existsSync(venvPython)) {
  console.warn("[py] server/.venv not found — run `npm run setup` first. Falling back to system python.");
  python = process.platform === "win32" ? "python" : "python3";
}

const [module, ...args] = process.argv.slice(2);
if (!module) {
  console.error("Usage: node scripts/py.mjs <module> [args...]");
  process.exit(2);
}

const child = spawn(python, ["-m", module, ...args], { cwd: serverDir, stdio: "inherit" });
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
