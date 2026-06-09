import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({

  host: process.env.EMAIL_HOST,

  port: Number(process.env.EMAIL_PORT),

  secure: false,

  requireTLS: true,

  connectionTimeout: 30000,

  greetingTimeout: 30000,

  socketTimeout: 30000,

  auth: {

    user: process.env.EMAIL_USER,

    pass: process.env.EMAIL_PASS

  }

});

transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP Verify Error:", error);
  } else {
    console.log("SMTP Server is ready");
  }
});

export const sendOtpEmail = async (email, otp) => {

  try {

    const info = await transporter.sendMail({

      from: `"TeslaLab AI" <teslalabai390@gmail.com>`,

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

