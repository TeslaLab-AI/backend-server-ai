import prisma from "../config/prismaClient.js";

import { getRepoDetails }
  from "../services/github.service.js";

import { scanPackageJson }
  from "../services/scanner.service.js";

import {
  analyzeDependencies,
  calculateHealthScore
}
  from "../services/ai.service.js";

import scanQueue
  from "../queues/scan.queue.js";

import { cloneRepository }
  from "../services/git.service.js";

// CONNECT REPOSITORY
export const connectRepo =
  async (req, res) => {

    try {

      const { repoUrl } =
        req.body;

      // fetch github repo
      const repoData =
        await getRepoDetails(
          repoUrl
        );

      // detect framework
      let framework =
        "Unknown";

      const language =
        repoData.language;

      if (
        language ===
        "JavaScript"
      ) {
        framework =
          "Node.js";
      }

      if (
        repoUrl.includes(
          "react"
        )
      ) {
        framework =
          "React";
      }

      if (
        repoUrl.includes(
          "next"
        )
      ) {
        framework =
          "Next.js";
      }

      // save repo
      const repository =
        await prisma.repository.create({
          data: {
            repoUrl,
            framework,
            status: "PENDING",
            userId:
              req.userId
          }
        });

      res.status(201).json({

        message:
          "Repository connected",

        repository,

        github: {

          stars:
            repoData.stargazers_count,

          language:
            repoData.language,

          description:
            repoData.description

        }

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error:
          error.message
      });

    }

  };

// GET USER REPOSITORIES
export const getUserRepos =
  async (req, res) => {

    try {

      const repositories =
        await prisma.repository.findMany({
          where: {
            userId:
              req.userId
          }
        });

      res.status(200).json({
        repositories
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error:
          error.message
      });

    }

  };

// DELETE REPOSITORY
export const deleteRepo =
  async (req, res) => {

    try {

      const { id } =
        req.params;

      const repository =
        await prisma.repository.findUnique({
          where: {
            id:
              Number(id)
          }
        });

      if (!repository) {

        return res.status(404).json({

          message:
            "Repository not found"

        });

      }

      if (
        repository.userId !==
        req.userId
      ) {

        return res.status(403).json({

          message:
            "Unauthorized"

        });

      }

      await prisma.repository.delete({
        where: {
          id:
            Number(id)
        }
      });

      res.status(200).json({

        message:
          "Repository deleted successfully"

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error:
          error.message
      });

    }

  };

// SIMPLE SCAN
export const scanRepo =
  async (req, res) => {

    try {

      const { repoUrl } =
        req.body;

      // clean url
      const cleanUrl =
        repoUrl.replace(
          ".git",
          ""
        );

      // repo name
      const parts =
        cleanUrl.split("/");

      const repoName =
        parts[
        parts.length - 1
        ];

      // clone repo
      const repoPath =
        await cloneRepository(
          repoUrl,
          repoName
        );

      // scan package.json
      const result =
        await scanPackageJson(
          repoPath
        );

      res.status(200).json({

        message:
          "Repository scanned",

        result

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error:
          error.message
      });

    }

  };


// AI SCAN
export const aiScanRepo =
  async (req, res) => {

    try {

      const { repoUrl } =
        req.body;

     await prisma.repository.updateMany({

  where: {
    repoUrl
  },

  data: {
    status: "SCANNING"
  }

});
      console.log(
        "Repo URL:",
        repoUrl
      );

      // clean url
      const cleanUrl =
        repoUrl.replace(
          ".git",
          ""
        );

      // repo name
      const parts =
        cleanUrl.split("/");

      const repoName =
        parts[
        parts.length - 1
        ];

      console.log(
        "Repo Name:",
        repoName
      );

      // clone repo
      const repoPath =
        await cloneRepository(
          repoUrl,
          repoName
        );

      console.log(
        "Repo Path:",
        repoPath
      );

      // scan package.json
      const result =
        await scanPackageJson(
          repoPath
        );

      // find repository
      const repository =
        await prisma.repository.findFirst({

          where: {

            repoUrl,

            userId: req.userId

          }

        });

      // save scan result
     
let scanRecord = null;

if (repository) {

  scanRecord =
    await prisma.scan.create({

      data: {

        repositoryId:
          repository.id,

        status:
          "SCANNING"

      }

    });

}

      // AI analysis
    // AI analysis
const aiResult =
  await analyzeDependencies(
    result
  );

const healthScore =
  calculateHealthScore(
    result
  );

if (scanRecord) {

  await prisma.scan.update({

    where: {

      id:
        scanRecord.id

    },

    data: {

      status:
        "COMPLETED",

      result

    }

  });

}

await prisma.repository.updateMany({

  where: {
    repoUrl
  },

  data: {
    status: "COMPLETED"
  }

});

res.status(200).json({

  message:
    "AI analysis complete",

  scanResult:
    result,

  aiSuggestions:
    aiResult,

  healthScore

});

    } catch (error) {

      console.log(error);

      res.status(500).json({

        error:
          error.message

      });

    }

  };
// QUEUE SCAN
export const queueRepoScan =
  async (req, res) => {

    try {

      const { repoUrl } =
        req.body;

      await scanQueue.add(

        "scan-job",

        {
          repoUrl
        }

      );

      res.status(200).json({

        message:
          "Repository scan added to queue"

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error:
          error.message
      });

    }

  };

export const getRepositoryById =
  async (req, res) => {

    try {

      const repository =
        await prisma.repository.findUnique({
          where: {
            id:
              Number(
                req.params.id
              )
          }
        });

      res.status(200).json({
        repository
      });

    } catch (error) {

      res.status(500).json({
        error:
          error.message
      });

    }

  };

export const getRepositoryScans =
  async (req, res) => {

    try {

      const { id } =
        req.params;

      const scans =
        await prisma.scan.findMany({

          where: {

            repositoryId:
              Number(id)

          },

          orderBy: {

            createdAt:
              "desc"

          }

        });

      res.status(200).json({

        scans

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        error:
          error.message

      });

    }

  };

  export const getRepositoryStatus =
  async (req, res) => {

    try {

      const repository =
        await prisma.repository.findFirst({

          where: {

            id:
              Number(req.params.id),

            userId:
              req.userId

          }

        });

      if (!repository) {

        return res.status(404).json({

          message:
            "Repository not found"

        });

      }

      res.status(200).json({

        status:
          repository.status

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        error:
          error.message

      });

    }

  };