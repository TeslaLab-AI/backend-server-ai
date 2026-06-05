import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "./config/passport.js";

import authRoutes from "./routes/auth.routes.js";
import repoRoutes from "./routes/repo.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import "./jobs/scan.worker.js";
import paymentRoutes from "./routes/payment.routes.js";

dotenv.config();

const app = express();

app.use(cors({

  origin:[
    "http://localhost:5173",
    "https://teslalab-ai.vercel.app" ,
  ],

  credentials: true

}));
app.use(express.json());
app.use(cookieParser());

app.use(

  session({

    secret: "github-secret",

    resave: false,

    saveUninitialized: false

  })

);

app.use(
  passport.initialize()
);

app.use(
  passport.session()
);

app.use("/api/auth", authRoutes);
app.use("/api/repos", repoRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payment",paymentRoutes);

app.get("/", (req, res) => {
  res.send("AI Agent Server Running 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

