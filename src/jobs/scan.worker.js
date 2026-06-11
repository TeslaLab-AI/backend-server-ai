import { Worker } from "bullmq";
import fs from "fs/promises";
import path from "path";
import prisma from "../config/prismaClient.js";

import connection from "../config/redis.js";

import { cloneRepository } from "../services/git.service.js";
import { scanRepository } from "../services/scanner.service.js";

const worker = new Worker(

  "repo-scan",

  async (job) => {
    const { repoUrl, repositoryId } = job.data;
    let repoPath;
    let scanRecord;

    try {
      scanRecord = await prisma.scan.create({
        data: {
          repositoryId,
          status: "SCANNING"
        }
      });

      await prisma.repository.update({
        where: { id: repositoryId },
        data: { status: "SCANNING" }
      });

      const cleanUrl = repoUrl.replace(/\.git$/i, "");
      const repoName = cleanUrl.split("/").pop();
      repoPath = path.join("repos", `${repoName}-${Date.now()}`);

      await cloneRepository(repoUrl, repoPath);
      const scanResult = await scanRepository(repoPath);

      const resultPayload = {
        repository: {
          repoUrl,
          language: scanResult.language,
          framework: scanResult.framework
        },
        dependencies: scanResult.packages,
        metadata: {
          totalPackages: scanResult.totalPackages
        }
      };

      await prisma.scan.update({
        where: { id: scanRecord.id },
        data: {
          status: "COMPLETED",
          result: resultPayload
        }
      });

      await prisma.repository.update({
        where: { id: repositoryId },
        data: {
          language: scanResult.language,
          framework: scanResult.framework,
          dependencies: resultPayload.dependencies,
          status: "COMPLETED"
        }
      });
    } catch (error) {
      console.error("repo-scan worker error:", error);

      if (scanRecord) {
        await prisma.scan.update({
          where: { id: scanRecord.id },
          data: {
            status: "FAILED",
            result: { error: error.message }
          }
        });
      }

      if (repositoryId) {
        await prisma.repository.update({
          where: { id: repositoryId },
          data: { status: "FAILED" }
        });
      }
    } finally {
      if (repoPath) {
        try {
          await fs.rm(repoPath, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error("repo-scan cleanup failed:", cleanupError);
        }
      }
    }

  },

  {
    connection
  }

);

export default worker;