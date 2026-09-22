const { execFile } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const exec = promisify(execFile);

function git(dir, args) {
  return exec("git", ["-C", dir, ...args], { maxBuffer: 32 * 1024 * 1024, timeout: 120000 });
}

class Site {
  constructor({ dir, repo, repoUrl, token }) {
    this.dir = dir;
    this.repo = repo;
    this.repoUrl = repoUrl;
    this.token = token;
  }

  get remote() {
    if (this.token) {
      return `https://x-access-token:${this.token}@github.com/${this.repo}.git`;
    }
    return this.repoUrl || `https://github.com/${this.repo}.git`;
  }

  async ensure() {
    if (!this.dir) return false;
    if (!fs.existsSync(path.join(this.dir, "config.js"))) {
      fs.mkdirSync(this.dir, { recursive: true });
      await exec("git", ["clone", "--depth", "1", this.remote, this.dir], {
        maxBuffer: 32 * 1024 * 1024,
        timeout: 180000,
      });
    }
    return true;
  }

  async pull() {
    await git(this.dir, ["remote", "set-url", "origin", this.remote]);
    await git(this.dir, ["pull", "--ff-only"]);
  }

  readClub() {
    const file = path.join(this.dir, "config.js");
    if (!fs.existsSync(file)) return null;
    const text = fs.readFileSync(file, "utf8");
    const ctx = {};
    vm.runInNewContext(
      text + ";this.__out={CLUB,HORARIOS,CUOTA,NORMAS,NORMA_FINAL,CHAT_REGLAS,CHAT_FALLBACK,SUPABASE};",
      ctx
    );
    return ctx.__out || null;
  }

  replaceHorarios(horarios) {
    const file = path.join(this.dir, "config.js");
    const text = fs.readFileSync(file, "utf8");
    const re = /const HORARIOS = \[[\s\S]*?\];/;
    if (!re.test(text)) return false;
    const gen = "const HORARIOS = " + JSON.stringify(horarios, null, 2) + ";";
    fs.writeFileSync(file, text.replace(re, gen));
    return true;
  }

  async push(message) {
    const status = await git(this.dir, ["status", "--porcelain", "config.js"]);
    if (!status.stdout.trim()) return { changed: false, output: "No hay cambios que publicar." };
    await git(this.dir, ["add", "config.js"]);
    const commit = await git(this.dir, [
      "-c", "user.name=AndoSuave Bot",
      "-c", "user.email=bot@andosuave-fc.local",
      "commit", "-m", message,
    ]);
    await git(this.dir, ["push", "origin", "HEAD:main"]);
    return { changed: true, output: commit.stderr || commit.stdout };
  }
}

module.exports = { Site };