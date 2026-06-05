import bcrypt from "bcrypt";
import prisma from "../config/prismaClient.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import passport from "passport";
import redis from "../config/redis.js";
import { sendOtpEmail } from "../services/mail.service.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check existing user
    const existingUser = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    const otp =
      Math.floor(
        100000 +
        Math.random() * 900000
      ).toString();

    await redis.set(

      `otp:${email}`,

      otp,

      "EX",

      300

    );

    await sendOtpEmail(
      email,
      otp
    );

    res.status(201).json({

      message:
        "User registered. OTP sent to email."

    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message
    });
  }
};

export const login = async (req, res) => {

  try {

    const { email, password } =
      req.body;

    // check user
    const user =
      await prisma.user.findUnique({

        where: {
          email
        }

      });

    if (!user) {

      return res.status(404).json({

        message:
          "User not found"

      });

    }

    if (!user.isVerified) {

  return res.status(400).json({

    message:
      "Please verify your email first"

  });

}

    // compare password
    const isMatch =
      await bcrypt.compare(

        password,
        user.password

      );

    if (!isMatch) {

      return res.status(400).json({

        message:
          "Invalid credentials"

      });

    }

    // generate token
    const token = jwt.sign(

      {
        id: user.id
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d"
      }

    );

    // save token in cookie
    res.cookie(

      "token",

      token,

      {

        httpOnly: true,

        secure: false,

        sameSite: "lax",

        maxAge:
          7 * 24 * 60 * 60 * 1000

      }

    );

    // remove password
    const { password: _, ...safeUser } =
      user;

    res.status(200).json({

      message:
        "Login successful",

      user: safeUser

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      error: error.message

    });

  }

};

export const getMe = async (req, res) => {
  try {

    const user = await prisma.user.findUnique({
      where: {
        id: req.userId
      }
    });

    res.status(200).json({
      user
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};



export const sendOtp =
  async (req, res) => {

    try {

      const { email } =
        req.body;

      const otp =
        Math.floor(
          100000 +
          Math.random() * 900000
        ).toString();

      await redis.set(

        `otp:${email}`,

        otp,

        "EX",

        300

      );

      await sendOtpEmail(
        email,
        otp
      );

      res.status(200).json({

        message:
          "OTP sent successfully"

      });

    } catch (error) {

      res.status(500).json({

        error:
          error.message

      });

    }

  };

export const verifyOtp =
  async (req, res) => {

    try {

      const {

        email,

        otp

      } = req.body;

      const storedOtp =
        await redis.get(
          `otp:${email}`
        );

      if (

        !storedOtp ||

        storedOtp !== otp

      ) {

        return res.status(400).json({

          message:
            "Invalid OTP"

        });

      }

      await prisma.user.update({

        where: {
          email
        },

        data: {
          isVerified: true
        }

      });

      await redis.del(
        `otp:${email}`
      );

      res.status(200).json({

        success: true,

        message:
          "OTP Verified"

      });

    } catch (error) {

      res.status(500).json({

        error:
          error.message

      });

    }

  };

  export const forgotPassword =
  async (req, res) => {

    try {

      const { email } =
        req.body;

      const user =
        await prisma.user.findUnique({

          where: {
            email
          }

        });

      if (!user) {

        return res.status(404).json({

          message:
            "User not found"

        });

      }

      const otp =
        Math.floor(
          100000 +
          Math.random() * 900000
        ).toString();

      await redis.set(

        `forgot:${email}`,

        otp,

        "EX",

        300

      );

      await sendOtpEmail(
        email,
        otp
      );

      res.status(200).json({

        message:
          "Password reset OTP sent"

      });

    } catch (error) {

      res.status(500).json({

        error:
          error.message

      });

    }

};

export const resetPassword =
  async (req, res) => {

    try {

      const {

        email,

        otp,

        newPassword

      } = req.body;

      const storedOtp =
        await redis.get(
          `forgot:${email}`
        );

      if (

        !storedOtp ||

        storedOtp !== otp

      ) {

        return res.status(400).json({

          message:
            "Invalid OTP"

        });

      }

      const hashedPassword =
        await bcrypt.hash(

          newPassword,

          10

        );

      await prisma.user.update({

        where: {
          email
        },

        data: {

          password:
            hashedPassword

        }

      });

      await redis.del(
        `forgot:${email}`
      );

      res.status(200).json({

        message:
          "Password reset successful"

      });

    } catch (error) {

      res.status(500).json({

        error:
          error.message

      });

    }

};