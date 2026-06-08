import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

import {

  register,
  login,
  getMe,
  sendOtp,
  verifyOtp,
  forgotPassword,
resetPassword

} from "../controllers/auth.controller.js";

import { getGithubRepos }
from "../controllers/github.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";


const router = express.Router();


router.post(
  "/register",
  register
);

router.post(
  "/login",
  login
);

router.get(

  "/me",

  authMiddleware,

  getMe

);
router.get(

  "/github/repos",

  authMiddleware,

  getGithubRepos

);

router.post(
  "/send-otp",
  sendOtp
);

router.post(
  "/verify-otp",
  verifyOtp
);

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password",
  resetPassword
);

// GitHub Login
router.get(

  "/github",

  passport.authenticate(
    "github",
    {
      scope: ["user:email"]
    }
  )

);

// GitHub Callback


router.get(

  "/github/callback",

  passport.authenticate(
    "github",
    {
      session: false,
      failureRedirect: "/login"
    }
  ),

 

 async (req, res) => {

  console.log(
  "Callback User:",
  req.user
)

  const token = jwt.sign(

    {
      id: req.user.id
    },

    process.env.JWT_SECRET,

    {
      expiresIn: "7d"
    }

  );

  res.cookie(

    "token",

    token,

    {

      httpOnly: true,

      secure: true,

      sameSite: "none",

      maxAge:
        7 * 24 * 60 * 60 * 1000

    }

  );

 res.redirect(
  "https://authentication-czxg.vercel.app/dashboard"
);

}

);

export default router;