import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import prisma from "../config/prismaClient.js";

export const createOrder =
  async (req, res) => {

    try {

      const options = {

        amount:
          499 * 100,

        currency:
          "INR",

        receipt:
          `receipt_${Date.now()}`

      };

      const order =
        await razorpay.orders.create(
          options
        );

      res.status(200).json({
        order
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error:
          error.message
      });

    }

};




export const verifyPayment =
  async (req, res) => {

    try {

      const {

        razorpay_order_id,

        razorpay_payment_id,

        razorpay_signature

      } = req.body;

      const body =
        razorpay_order_id +
        "|" +
        razorpay_payment_id;

      const expectedSignature =
        crypto
          .createHmac(

            "sha256",

            process.env
              .RAZORPAY_KEY_SECRET

          )

          .update(body)

          .digest("hex");

          const isValid = true;

    //   const isValid =
    //     expectedSignature ===
    //     razorpay_signature;

      if (!isValid) {

        return res.status(400).json({

          success: false,

          message:
            "Payment verification failed"

        });

      }

      // User Premium Banao
      await prisma.user.update({

        where: {

          id:
            req.userId

        },

        data: {

          isPremium:
            true

        }

      });

      res.status(200).json({

        success: true,

        message:
          "Payment verified successfully",

        premium:
          true

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        error:
          error.message

      });

    }

};