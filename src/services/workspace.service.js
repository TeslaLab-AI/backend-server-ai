import fs from "fs/promises";
import path from "path";

export const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  "venv",
  "__pycache__"
]);

const isIgnored = (name) => IGNORE_DIRS.has(name);

const sortEntries = (a, b) => {
  if (a.type !== b.type) {
    return a.type === "folder" ? -1 : 1;
  }

  return a.name.localeCompare(b.name);
};

const toRelativePath = (repoRoot, targetPath) =>
  path.relative(repoRoot, targetPath).split(path.sep).join("/");

const ensureInsideRoot = (repoRoot, targetPath) => {
  const resolvedRoot = path.resolve(repoRoot);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

export const buildTree = async (repoRoot) => {
  const normalizedRoot = path.resolve(repoRoot);

  const walk = async (currentPath) => {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    const children = [];

    for (const entry of entries) {
      if (isIgnored(entry.name)) {
        continue;
      }

      const fullPath = path.join(currentPath, entry.name);
      const relativePath = toRelativePath(normalizedRoot, fullPath);

      if (entry.isDirectory()) {
        children.push({
          name: entry.name,
          path: relativePath,
          type: "folder",
          children: await walk(fullPath)
        });
      } else if (entry.isFile()) {
        const stat = await fs.stat(fullPath);
        children.push({
          name: entry.name,
          path: relativePath,
          type: "file",
          size: stat.size,
          extension: path.extname(entry.name).replace(/^\./, "")
        });
      }
    }

    return children.sort(sortEntries);
  };

  return {
    root: ".",
    tree: await walk(normalizedRoot)
  };
};

export const readFileContent = async (repoRoot, filePath) => {
  const targetPath = path.resolve(repoRoot, filePath);

  if (!ensureInsideRoot(repoRoot, targetPath)) {
    throw new Error("Invalid file path");
  }

  const content = await fs.readFile(targetPath, "utf-8");
  return content;
};

export const writeFileContent = async (repoRoot, filePath, content) => {
  const targetPath = path.resolve(repoRoot, filePath);

  if (!ensureInsideRoot(repoRoot, targetPath)) {
    throw new Error("Invalid file path");
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, "utf-8");
};

export const createFolder = async (repoRoot, folderPath) => {
  const targetPath = path.resolve(repoRoot, folderPath);
  if (!ensureInsideRoot(repoRoot, targetPath)) {
    throw new Error("Invalid folder path");
  }
  await fs.mkdir(targetPath, { recursive: true });
};

export const createFile = async (repoRoot, filePath, content = "") => {
  const targetPath = path.resolve(repoRoot, filePath);
  if (!ensureInsideRoot(repoRoot, targetPath)) {
    throw new Error("Invalid file path");
  }
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, "utf-8");
};

export const deletePath = async (repoRoot, targetPath) => {
  const resolvedTarget = path.resolve(repoRoot, targetPath);
  if (!ensureInsideRoot(repoRoot, resolvedTarget)) {
    throw new Error("Invalid path");
  }
  await fs.rm(resolvedTarget, { recursive: true, force: true });
};

export const renamePath = async (repoRoot, oldPath, newPath) => {
  const oldTarget = path.resolve(repoRoot, oldPath);
  const newTarget = path.resolve(repoRoot, newPath);

  if (!ensureInsideRoot(repoRoot, oldTarget) || !ensureInsideRoot(repoRoot, newTarget)) {
    throw new Error("Invalid path");
  }

  await fs.mkdir(path.dirname(newTarget), { recursive: true });
  await fs.rename(oldTarget, newTarget);
};
