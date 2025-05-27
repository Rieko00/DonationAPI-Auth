const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { validateRegister, validateLogin, validateForgotPassword, validateVerifyForgotPassword, validateRiwayatToken, validateCodeQuery } = require("../middleware/validation.middleware");

// Auth routes
router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.post("/verify-token", authController.verifyToken);
router.post("/forgot-password", validateForgotPassword, authController.forgotPassword);
router.patch("/forgot-password/verify", validateCodeQuery, validateVerifyForgotPassword, authController.verifyForgotPassword);

// Token routes
router.post("/riwayat-token", validateRiwayatToken, authController.createRiwayatToken);

module.exports = router;
