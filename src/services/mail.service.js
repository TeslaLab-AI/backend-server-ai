import nodemailer from "nodemailer";

const transporter =
  nodemailer.createTransport({

    service: "gmail",

    auth: {

      user:
        process.env.EMAIL_USER,

      pass:
        process.env.EMAIL_PASS

    }

  });

export const sendOtpEmail =
  async (email, otp) => {

    await transporter.sendMail({

      from:
        process.env.EMAIL_USER,

      to:
        email,

      subject:
        "OTP Verification",

      html: `

        <h2>Your OTP</h2>

        <h1>${otp}</h1>

        <p>Valid for 5 minutes</p>

      `

    });

};