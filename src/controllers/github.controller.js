import axios from "axios";
import prisma from "../config/prismaClient.js";

export const getGithubRepos =
  async (req, res) => {

    try {

      const user =
        await prisma.user.findUnique({

          where: {
            id: req.userId
          }

        });

      const response =
        await axios.get(

          "https://api.github.com/user/repos",

          {

            headers: {

              Authorization:
                `token ${user.githubToken}`

            }

          }

        );

      res.status(200).json({

        repos:
          response.data

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        error:
          error.message

      });

    }

};