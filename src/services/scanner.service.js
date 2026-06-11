import fs from "fs/promises";
import path from "path";

const parsePomDependencies = (pomContent) => {
  const packages = {};
  const dependencyBlocks = pomContent.match(/<dependency>[\s\S]*?<\/dependency>/gi) || [];

  dependencyBlocks.forEach((block) => {
    const artifactMatch = block.match(/<artifactId>([^<]+)<\/artifactId>/i);
    const versionMatch = block.match(/<version>([^<]+)<\/version>/i);

    if (artifactMatch) {
      packages[artifactMatch[1]] = versionMatch ? versionMatch[1] : "latest";
    }
  });

  return packages;
};

const parseGradleDependencies = (gradleContent) => {
  const packages = {};
  const lines = gradleContent.split("\n");

  lines.forEach((line) => {
    const normalized = line.trim();
    const dependencyMatch = normalized.match(/(?:implementation|compile|api|runtimeOnly|testImplementation)\s+['"]([^'"]+)['"]/i);

    if (dependencyMatch) {
      const [group, artifact, version] = dependencyMatch[1].split(":");
      const name = artifact || group;
      packages[name] = version || "latest";
    }
  });

  return packages;
};

export const scanRepository = async (repoPath) => {
  try {
    const files = await fs.readdir(repoPath);

    let language = "Unknown";
    let framework = "Unknown";
    let packages = {};
    let totalPackages = 0;

    if (files.includes("package.json")) {
      const packageJsonPath = path.join(repoPath, "package.json");
      const data = await fs.readFile(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(data);
      const dependencies = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {}),
      };

      packages = dependencies;
      totalPackages = Object.keys(dependencies).length;
      language = files.includes("tsconfig.json") ? "TypeScript" : "JavaScript";

      if (dependencies.next) {
        framework = "Next.js";
      } else if (dependencies.react) {
        framework = "React";
      } else if (dependencies.express) {
        framework = "Express";
      } else if (dependencies["@nestjs/core"]) {
        framework = "NestJS";
      } else if (dependencies["@angular/core"]) {
        framework = "Angular";
      } else if (dependencies.vue) {
        framework = "Vue";
      } else if (dependencies.fastify) {
        framework = "Fastify";
      } else {
        framework = "Node.js";
      }
    } else if (files.includes("requirements.txt")) {
      const requirementsContent = await fs.readFile(path.join(repoPath, "requirements.txt"), "utf-8");
      const requirements = requirementsContent.toLowerCase();
      language = "Python";

      if (requirements.includes("django")) {
        framework = "Django";
      } else if (requirements.includes("flask")) {
        framework = "Flask";
      } else if (requirements.includes("fastapi")) {
        framework = "FastAPI";
      } else {
        framework = "Python";
      }

      requirementsContent.split("\n").forEach((line) => {
        const pkg = line.trim();
        if (pkg && !pkg.startsWith("#")) {
          packages[pkg] = "latest";
        }
      });

      totalPackages = Object.keys(packages).length;
    } else if (files.includes("pom.xml")) {
      const pomContent = await fs.readFile(path.join(repoPath, "pom.xml"), "utf-8");
      language = "Java";
      framework = pomContent.includes("spring-boot") ? "Spring Boot" : "Java";
      packages = parsePomDependencies(pomContent);
      totalPackages = Object.keys(packages).length;
    } else if (files.includes("build.gradle")) {
      const gradleContent = await fs.readFile(path.join(repoPath, "build.gradle"), "utf-8");
      language = "Java";
      framework = gradleContent.includes("spring-boot") ? "Spring Boot" : "Java";
      packages = parseGradleDependencies(gradleContent);
      totalPackages = Object.keys(packages).length;
    }

    return {
      language,
      framework,
      totalPackages,
      packages,
    };
  } catch (error) {
    console.error("scanRepository error:", error);
    throw new Error("Repository scan failed");
  }
};

export const scanPackageJson = scanRepository;