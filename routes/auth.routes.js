const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const profileController = require("../controllers/profile.controller");
const { validateRegister, validateLogin, validateForgotPassword, validateVerifyForgotPassword, validateRiwayatToken, validateCodeQuery } = require("../middleware/validation.middleware");
const { authenticateToken, validateUpdateProfile } = require("../middleware/auth.middleware");

// Auth routes
router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.get("/verify-token", authController.verifyToken);
router.post("/reset-password", validateForgotPassword, authController.forgotPassword);
router.patch("/reset-password/verify/:token", validateVerifyForgotPassword, authController.verifyForgotPassword);
router.patch("/profile/update", authenticateToken, validateUpdateProfile, profileController.updateProfile);

// Token routes
router.post("/riwayat-token", validateRiwayatToken, authController.createRiwayatToken);

module.exports = router;
