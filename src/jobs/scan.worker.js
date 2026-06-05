import { Worker } from "bullmq";
import prisma from "../config/prismaClient.js";

import connection from "../config/redis.js";

import { cloneRepository }
  from "../services/git.service.js";

import { scanPackageJson }
  from "../services/scanner.service.js";

const worker = new Worker(

  "repo-scan",

  async (job) => {

    try {

      const { repoUrl } =
        job.data;

        const repository =
  await prisma.repository.findFirst({

    where: {
      repoUrl
    }

  });

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

      await prisma.repository.updateMany({

        where: {
          repoUrl
        },

        data: {
          status: "SCANNING"
        }

      });

      // repo name extract
      const repoName =
        repoUrl
          .split("/")
          .pop()
          .replace(".git", "");

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

      console.log(
        "Scan Result:",
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

    } catch (error) {

      console.log(error);

    }

  },

  {
    connection
  }

);

export default worker;