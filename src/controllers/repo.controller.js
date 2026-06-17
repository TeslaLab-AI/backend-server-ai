import path from "path";
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

import {
  buildTree,
  createFile,
  createFolder,
  deletePath,
  readFileContent,
  renamePath,
  writeFileContent
} from "../services/workspace.service.js";

// CONNECT REPOSITORY
export const connectRepo =
  async (req, res) => {
    try {
      const { repoUrl } = req.body;

      if (!repoUrl || typeof repoUrl !== "string") {
        return res.status(400).json({
          error: "repoUrl is required"
        });
      }

      const normalizedRepoUrl = repoUrl.replace(/\.git$/i, "");

      const repoData = await getRepoDetails(normalizedRepoUrl);

      const existingRepository = await prisma.repository.findFirst({
        where: {
          repoUrl: normalizedRepoUrl,
          userId: req.userId
        }
      });

      if (existingRepository) {
        return res.status(409).json({
          message: "Repository already connected",
          repositoryId: existingRepository.id,
          status: existingRepository.status
        });
      }

      const repository = await prisma.repository.create({
        data: {
          repoUrl: normalizedRepoUrl,
          status: "SCANNING",
          userId: req.userId
        }
      });

      const repoName = normalizedRepoUrl.split("/").pop();
      const repoPath = await cloneRepository(normalizedRepoUrl, repoName);

      await prisma.repository.update({
        where: { id: repository.id },
        data: {
          status: "READY"
        }
      });

      await scanQueue.add("repo-scan", {
        repoUrl: normalizedRepoUrl,
        repositoryId: repository.id
      });

      res.status(201).json({
        message: "Repository connected. Workspace ready.",
        repositoryId: repository.id,
        status: "READY",
        repoPath
      });
    } catch (error) {
      console.error("connectRepo error:", error);
      res.status(500).json({
        error: error.message
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
        await prisma.repository.findFirst({
          where: {
            id:
              Number(
                req.params.id
              ),
            userId:
              req.userId
          }
        });

      if (!repository) {
        return res.status(404).json({
          message: "Repository not found"
        });
      }

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

      const repository = await prisma.repository.findFirst({
        where: {
          id: Number(id),
          userId: req.userId
        }
      });

      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }

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

export const getRepoTree = async (req, res) => {
  try {
    const repo = await prisma.repository.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId
      }
    });

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    const repoPath = path.resolve("repos", repo.repoUrl.split("/").pop());
    const tree = await buildTree(repoPath);

    return res.status(200).json({ tree });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const readRepoFile = async (req, res) => {
  try {
    const repo = await prisma.repository.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId
      }
    });

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    const { path: filePath } = req.query;
    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ message: "file path is required" });
    }

    const repoPath = path.resolve("repos", repo.repoUrl.split("/").pop());
    const content = await readFileContent(repoPath, filePath);

    return res.status(200).json({ filePath, content });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const saveRepoFile = async (req, res) => {
  try {
    const repo = await prisma.repository.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId
      }
    });

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    const { path: filePath, content } = req.body;
    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ message: "file path is required" });
    }

    const repoPath = path.resolve("repos", repo.repoUrl.split("/").pop());
    await writeFileContent(repoPath, filePath, content || "");

    return res.status(200).json({ message: "File saved", filePath });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const createRepoFile = async (req, res) => {
  try {
    const repo = await prisma.repository.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId
      }
    });

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    const { path: filePath } = req.body;
    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ message: "file path is required" });
    }

    const repoPath = path.resolve("repos", repo.repoUrl.split("/").pop());
    await createFile(repoPath, filePath);

    return res.status(200).json({ message: "File created", filePath });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const createRepoFolder = async (req, res) => {
  try {
    const repo = await prisma.repository.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId
      }
    });

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    const { path: folderPath } = req.body;
    if (!folderPath || typeof folderPath !== "string") {
      return res.status(400).json({ message: "folder path is required" });
    }

    const repoPath = path.resolve("repos", repo.repoUrl.split("/").pop());
    await createFolder(repoPath, folderPath);

    return res.status(200).json({ message: "Folder created", folderPath });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteRepoFile = async (req, res) => {
  try {
    const repo = await prisma.repository.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId
      }
    });

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    const { path: filePath } = req.query;
    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ message: "file path is required" });
    }

    const repoPath = path.resolve("repos", repo.repoUrl.split("/").pop());
    await deletePath(repoPath, filePath);

    return res.status(200).json({ message: "File deleted", filePath });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteRepoFolder = async (req, res) => {
  try {
    const repo = await prisma.repository.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId
      }
    });

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    const { path: folderPath } = req.query;
    if (!folderPath || typeof folderPath !== "string") {
      return res.status(400).json({ message: "folder path is required" });
    }

    const repoPath = path.resolve("repos", repo.repoUrl.split("/").pop());
    await deletePath(repoPath, folderPath);

    return res.status(200).json({ message: "Folder deleted", folderPath });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export const renameRepoPath = async (req, res) => {
  try {
    const repo = await prisma.repository.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId
      }
    });

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath) {
      return res.status(400).json({ message: "oldPath and newPath are required" });
    }

    const repoPath = path.resolve("repos", repo.repoUrl.split("/").pop());
    await renamePath(repoPath, oldPath, newPath);

    return res.status(200).json({ message: "Path renamed", oldPath, newPath });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};