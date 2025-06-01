const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const profileController = require("../controllers/profile.controller");
const { validateRegister, validateLogin, validateForgotPassword, validateVerifyForgotPassword, validateRiwayatToken, validateCodeQuery } = require("../middleware/validation.middleware");
const { authenticateToken, validateUpdateProfile, authorizeRoles } = require("../middleware/auth.middleware");

// Auth routes
router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.get("/verify-token", authController.verifyToken);
router.post("/reset-password", validateForgotPassword, authController.forgotPassword);
router.patch("/forgot-password/submit/new-password/:token", validateVerifyForgotPassword, authController.verifyForgotPassword);
router.patch("/profile/update", authenticateToken, validateUpdateProfile, profileController.updateProfile);
// router.patch("/profile/update-password", authenticateToken, profileController.updatePassword);

// Token routes
router.get("/riwayat-token/:id_user", authenticateToken, authorizeRoles("admin"), authController.getRiwayatToken);

module.exports = router;
