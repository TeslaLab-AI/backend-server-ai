import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";

import prisma from "./prismaClient.js";

passport.use(

  new GitHubStrategy(

    {

      clientID:
        process.env.GITHUB_CLIENT_ID,

      clientSecret:
        process.env.GITHUB_CLIENT_SECRET,

      callbackURL:
        "http://localhost:3000/api/auth/github/callback"

    },

    async (
      accessToken,
      refreshToken,
      profile,
      done
    ) => {
     
console.log("Access Token:", accessToken);

      try {

        let user =
          await prisma.user.findUnique({

            where: {

              githubId:
                String(profile.id)

            }

          });

       if (!user) {

  user =
    await prisma.user.create({

      data: {

        githubId:
          String(profile.id),

        githubToken:
          accessToken,

        name:
          profile.username ||
          "GitHub User"

      }

    });

    console.log(
  "User After Update:",
  user
);

} else {

  user =
    await prisma.user.update({

      where: {

        id:
          user.id

      },

      data: {

        githubToken:
          accessToken

      }

    });

}

        return done(
          null,
          user
        );

      } catch (error) {

        return done(
          error,
          null
        );

      }

    }

  )

);

export default passport;