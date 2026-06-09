export const sendOtpEmail = async (email, otp) => {
  try {

    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",

        headers: {
          "accept": "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json"
        },

        body: JSON.stringify({

          sender: {
            name: "TeslaLab AI",
            email: "teslalabai390@gmail.com"
          },

          to: [
            {
              email: email
            }
          ],

          subject: "OTP Verification",

          htmlContent: `
            <h2>Your OTP Verification Code</h2>
            <h1>${otp}</h1>
            <p>This OTP is valid for 5 minutes.</p>
          `
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    console.log("Email Sent Successfully:", data);

  } catch (error) {

    console.log("Brevo API Error:", error.message);

    throw error;
  }
};