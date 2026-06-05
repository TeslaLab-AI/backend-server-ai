import fs from "fs/promises";
import { detectFramework }
from "./frameworkDetector.service.js";

export const scanPackageJson =
  async (repoPath) => {

    try {

      const packageJsonPath =
        `${repoPath}/package.json`;

      const data =
        await fs.readFile(
          packageJsonPath,
          "utf-8"
        );

      const packageJson =
        JSON.parse(data);

      const dependencies = {

        ...(packageJson.dependencies || {}),

        ...(packageJson.devDependencies || {})

      };

      // Framework Detect
      const framework =
        detectFramework(
          dependencies
        );

      return {

        framework,

        totalPackages:
          Object.keys(
            dependencies
          ).length,

        packages:
          dependencies

      };

    } catch (error) {

      console.log(error);

      throw new Error(
        "Package scan failed"
      );

    }

};