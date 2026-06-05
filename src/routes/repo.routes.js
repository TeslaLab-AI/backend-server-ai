import express from "express";

import {
  connectRepo,
  getUserRepos,
  deleteRepo,
  scanRepo,
  aiScanRepo,
  queueRepoScan,
  getRepositoryById,
  getRepositoryScans,
  getRepositoryStatus
} from "../controllers/repo.controller.js";

import authMiddleware
from "../middleware/auth.middleware.js";
import premiumMiddleware
from "../middleware/premium.middleware.js";

const router = express.Router();

router.post(
  "/connect",
  authMiddleware,
  connectRepo
);

router.get(
  "/my-repos",
  authMiddleware,
  getUserRepos
);

router.delete(
  "/:id",
  authMiddleware,
  deleteRepo
);

router.get(
  "/scan",
  authMiddleware,
  scanRepo
);

router.post(
  "/ai-scan",
  authMiddleware,
    premiumMiddleware,
  aiScanRepo
);

router.post(
  "/queue-scan",
  // authMiddleware,
  queueRepoScan
);

router.get(
  "/:id",
  authMiddleware,
  getRepositoryById
);


router.get(
  "/:id/scans",
  authMiddleware,
  getRepositoryScans
);

router.get(
  "/:id/status",
  authMiddleware,
  getRepositoryStatus
);

export default router;