import prisma from "../config/prismaClient.js";

const premiumMiddleware =
  async (req, res, next) => {

    const user =
      await prisma.user.findUnique({

        where: {

          id:
            req.userId

        }

      });

    if (!user?.isPremium) {

      return res.status(403).json({

        message:
          "Premium subscription required"

      });

    }

    next();

};

export default premiumMiddleware;