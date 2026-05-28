import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = process.env.PORT || "3000";
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const command = path.join(rootDir, "node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next");
const child = spawn(command, ["start", "-H", "0.0.0.0", "-p", port], {
  shell: process.platform === "win32",
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
