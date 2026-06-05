import prisma from "../config/prismaClient.js";

export const getDashboardStats =
  async (req, res) => {

    try {

      const totalRepos =
        await prisma.repository.count({
          where: {
            userId: req.userId
          }
        });

        const totalScans =
  await prisma.scan.count({

    where: {

      repository: {

        userId: req.userId

      }

    }

  });

  const completedScans =
  await prisma.scan.count({

    where: {

      status: "COMPLETED",

      repository: {

        userId: req.userId

      }

    }

  });

const pendingScans =
  await prisma.scan.count({

    where: {

      status: "SCANNING",

      repository: {

        userId: req.userId

      }

    }

  });

  const latestScan =
  await prisma.scan.findFirst({

    where: {

      repository: {

        userId: req.userId

      }

    },

    orderBy: {

      createdAt: "desc"

    }

  });

      const recentRepos =
        await prisma.repository.findMany({

          where: {
            userId: req.userId
          },

          orderBy: {
            id: "desc"
          },

          take: 5

        });

     res.status(200).json({

  totalRepos,

  totalScans,

   completedScans,

    pendingScans,

  latestScan,

  recentRepos

});

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error: error.message
      });

    }

};