import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({

  host: process.env.EMAIL_HOST,

  port: Number(process.env.EMAIL_PORT),

  secure: false,

  auth: {

    user: process.env.EMAIL_USER,

    pass: process.env.EMAIL_PASS

  }

});

export const sendOtpEmail = async (email, otp) => {

  try {

    const info = await transporter.sendMail({

      from: `"TeslaLab AI" <${process.env.EMAIL_USER}>`,

      to: email,

      subject: "OTP Verification",

      html: `

        <h2>Your OTP Verification Code</h2>

        <h1>${otp}</h1>

        <p>This OTP is valid for 5 minutes.</p>

      `

    });

    console.log(
      "Email Sent:",
      info.response
    );

  } catch (error) {

    console.log(
      "Email Error:",
      error.message
    );

    throw error;

  }

};