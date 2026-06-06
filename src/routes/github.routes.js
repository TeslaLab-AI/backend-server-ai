import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/users/:username", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.github.com/users/${req.params.username}`
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

router.get("/users/:username/repos", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.github.com/users/${req.params.username}/repos`
    );

    res.json({
      repos: response.data
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

router.post("/verify-email", async (req, res) => {
  res.json({
    verified: true,
    note: "Email verification skipped"
  });
});

export default router;