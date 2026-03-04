import { Router } from "express";
import multer from "multer";
import { verifyJWT, requireAdmin, requireUser } from "../middlewares/auth.middleware.js";
import {
  generateAnimeTshirt,
  getMyDesigns,
  getMyDesignById,
  updateMyDesignOptions,
  adminGetAllDesigns,
  adminModerateDesign,
  adminGetPrintableDesign,
  adminDeleteUnpaidDesign,
} from "../controllers/design.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only JPG, PNG, and WEBP files are allowed."));
  },
});

router.post("/anime", verifyJWT, requireUser, upload.single("image"), generateAnimeTshirt);
router.get("/my", verifyJWT, requireUser, getMyDesigns);
router.get("/my/:id", verifyJWT, requireUser, getMyDesignById);
router.patch("/my/:id/options", verifyJWT, requireUser, updateMyDesignOptions);

router.get("/admin/all", verifyJWT, requireAdmin, adminGetAllDesigns);
router.patch("/admin/:id/moderate", verifyJWT, requireAdmin, adminModerateDesign);
router.get("/admin/:id/print", verifyJWT, requireAdmin, adminGetPrintableDesign);
router.delete("/admin/:id", verifyJWT, requireAdmin, adminDeleteUnpaidDesign);

export default router;
