import nodemailer from "nodemailer";

const transporter =
  nodemailer.createTransport({

    host: "smtp.gmail.com",

    port: 587,

    secure: false,

    auth: {

      user:
        process.env.EMAIL_USER,

      pass:
        process.env.EMAIL_PASS

    }

  });

export const sendOtpEmail =
  async (email, otp) => {

    try {

      const info =
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

      console.log(
        "Email Sent:",
        info.response
      );

    } catch (error) {

      console.log(
        "Email Error:",
        error
      );

      throw error;

    }

};