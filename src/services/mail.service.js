import brevo from "@getbrevo/brevo";

const apiInstance = new brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

export const sendOtpEmail = async (email, otp) => {
  try {

    await apiInstance.sendTransacEmail({

      sender: {
        email: "teslalabai390@gmail.com",
        name: "TeslaLab AI"
      },

      to: [
        {
          email
        }
      ],

      subject: "OTP Verification",

      htmlContent: `
        <h2>Your OTP Verification Code</h2>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      `

    });

    console.log("Email Sent Successfully");

  } catch (error) {

    console.log(
      "Brevo API Error:",
      error.response?.body || error.message
    );

    throw error;
  }
};