// One-time project setup: Python venv + deps, client deps, and .env files.
// Usage: npm run setup
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverDir = path.join(root, "server");
const clientDir = path.join(root, "client");
const win = process.platform === "win32";

function run(cmd, args, cwd) {
  console.log(`\n> ${cmd} ${args.join(" ")}   (in ${path.relative(root, cwd) || "."})`);
  const res = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: win });
  if (res.status !== 0) {
    console.error(`\n[setup] "${cmd}" failed with exit code ${res.status}`);
    process.exit(res.status ?? 1);
  }
}

function copyIfMissing(from, to) {
  if (existsSync(to)) {
    console.log(`[setup] ${path.relative(root, to)} already exists — leaving it alone`);
    return;
  }
  copyFileSync(from, to);
  console.log(`[setup] created ${path.relative(root, to)} from example — edit it before running`);
}

// 1. Python venv + requirements
const venvPython = win
  ? path.join(serverDir, ".venv", "Scripts", "python.exe")
  : path.join(serverDir, ".venv", "bin", "python");
if (!existsSync(venvPython)) {
  run(win ? "python" : "python3", ["-m", "venv", ".venv"], serverDir);
}
run(venvPython, ["-m", "pip", "install", "-r", "requirements.txt"], serverDir);

// 2. Client deps
run("npm", ["install"], clientDir);

// 3. Env files
copyIfMissing(path.join(serverDir, ".env.example"), path.join(serverDir, ".env"));
copyIfMissing(path.join(clientDir, ".env.local.example"), path.join(clientDir, ".env.local"));

console.log(`
[setup] done.
  1. Edit server/.env  (DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY)
  2. npm run dev       → API on :8000, UI on :3000
`);
