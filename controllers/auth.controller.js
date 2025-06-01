const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../models");
const { User, RiwayatToken } = db;
const { generateToken, verifyToken, authorizeRoles } = require("../middleware/auth.middleware");
const sendEmail = require("../utils/sendEmail");

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { email, password, nama_lengkap, telp, role = "user" } = req.body;

      // Cek apakah email sudah terdaftar
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email sudah terdaftar",
        });
      }

      // Buat user baru
      const user = await User.create({
        email,
        password,
        nama_lengkap,
        telp,
        role,
      });

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // Simpan riwayat token
      await RiwayatToken.create({
        id_user: user.id,
        aktivitas: "Register - Create Token",
        token: token,
      });

      return res.status(201).json({
        success: true,
        message: "Akun berhasil dibuat",
        data: {
          id: user.id,
          email: user.email,
          nama_lengkap: user.nama_lengkap,
          telp: user.telp,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const errors = error.errors.map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: "Data registrasi akun tidak lengkap",
          errors: errors,
        });
      }

      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          message: "Email sudah terdaftar",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error internal server",
        error: error.message,
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Cari user berdasarkan email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Email atau password tidak sesuai",
        });
      }

      // Verifikasi password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Email atau password tidak sesuai",
        });
      }

      const checkToken = await RiwayatToken.findOne({
        where: { id_user: user.id },
        order: [["created_at", "DESC"]],
      });
      // Jika ada token sebelumnya pakai token yang sama
      if (checkToken) {
        // Cek apakah token masih valid (misalnya 1 jam)
        const decodedToken = verifyToken(checkToken.token);
        if (!decodedToken) {
          const newToken = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
          });

          // Simpan riwayat token
          await RiwayatToken.create({
            id_user: user.id,
            aktivitas: "Login - Create Token",
            token: newToken,
          });

          return res.status(200).json({
            success: true,
            message: "Berhasil Login",
            data: {
              id: user.id,
              email: user.email,
              nama_lengkap: user.nama_lengkap,
              telp: user.telp,
              role: user.role,
              token: newToken,
            },
          });
        }

        // Simpan riwayat token
        await RiwayatToken.create({
          id_user: user.id,
          aktivitas: "Login - Get Token",
          token: checkToken.token,
        });

        return res.status(200).json({
          success: true,
          message: "Berhasil Login",
          data: {
            id: user.id,
            email: user.email,
            nama_lengkap: user.nama_lengkap,
            telp: user.telp,
            role: user.role,
            token: checkToken.token, // Gunakan token yang sudah ada
          },
        });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      // Simpan riwayat token
      await RiwayatToken.create({
        id_user: user.id,
        aktivitas: "Login - Create Token",
        token: token,
      });
      return res.status(200).json({
        success: true,
        message: "Berhasil Login",
        data: {
          id: user.id,
          email: user.email,
          nama_lengkap: user.nama_lengkap,
          telp: user.telp,
          role: user.role,
          token: token,
        },
      });
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const errors = error.errors.map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: "Data login akun tidak lengkap",
          errors: errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error internal server",
        error: error.message,
      });
    }
  }

  // Forgot password
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      // Cari user berdasarkan email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Email tidak ditemukan",
        });
      }

      // Cek apakah ada riwayat token sebelumnya
      const existingToken = await RiwayatToken.findOne({
        where: {
          id_user: user.id,
          aktivitas: {
            [db.Sequelize.Op.like]: "Forgot Password - Reset Password Code",
          },
        },
        order: [["created_at", "DESC"]],
      });
      if (existingToken) {
        // Jika ada, cek apakah token masih valid (misalnya 15 menit)
        const codeAge = Date.now() - new Date(existingToken.created_at).getTime();
        const fifteenMinutes = 15 * 60 * 1000; // 15 menit
        if (codeAge < fifteenMinutes) {
          return res.status(400).json({
            success: false,
            message: "Anda sudah mengirim permintaan ubah password sebelumnya. Silakan tunggu 15 menit sebelum mencoba lagi.",
          });
        }
      }

      // Generate unique code untuk reset password
      const resetCode = crypto.randomBytes(32).toString("hex");

      // Simpan code ke riwayat token (bisa juga buat tabel terpisah)
      await RiwayatToken.create({
        id_user: user.id,
        aktivitas: `Forgot Password - Reset Password Code`,
        token: resetCode,
      });

      const resetLink = `${process.env.RESET_URL}/forgot-password/submit/new-password/${resetCode}`;
      // Kirim email dengan link reset password
      await sendEmail({
        to: user.email,
        subject: "Permintaan Ubah Password",
        text: `Anda telah meminta untuk mengubah password. Silakan klik link berikut untuk mengatur ulang password Anda:\n\n${resetLink}\n\n Link berlaku selama 15 menit.`,
      });

      return res.status(200).json({
        success: true,
        message: "Request ubah password berhasil, silahkan cek email anda",
        data: {
          email: user.email,
        },
      });
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const errors = error.errors.map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: "Data input tidak lengkap",
          errors: errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error internal server",
        error: error.message,
      });
    }
  }

  // Verify forgot password
  static async verifyForgotPassword(req, res) {
    try {
      const { token: code } = req.params;
      const { password } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: "Code verifikasi diperlukan",
        });
      }

      // Cari riwayat token berdasarkan code
      const tokenHistory = await RiwayatToken.findOne({
        where: {
          token: code,
          aktivitas: {
            [db.Sequelize.Op.like]: "Forgot Password - Reset Password Code",
          },
        },
        include: [
          {
            model: User,
            as: "user",
          },
        ],
        order: [["created_at", "DESC"]],
      });

      if (!tokenHistory) {
        return res.status(400).json({
          success: false,
          message: "Code verifikasi tidak valid atau sudah kadaluarsa",
        });
      }

      // Cek apakah code masih valid (misalnya 1 jam)
      const codeAge = Date.now() - new Date(tokenHistory.created_at).getTime();
      const fifteenMinutes = 15 * 60 * 1000; // 15 menit

      if (codeAge > fifteenMinutes) {
        return res.status(400).json({
          success: false,
          message: "Code verifikasi sudah kadaluarsa",
        });
      }

      // Update password user
      await User.update(
        { password: password },
        {
          where: { id: tokenHistory.id_user },
          individualHooks: true, // Untuk trigger beforeUpdate hook
        }
      );

      await RiwayatToken.update(
        { aktivitas: "Password Reset - Reset Passwoord Code Used" },
        {
          where: { id: tokenHistory.id },
          individualHooks: true,
        }
      );

      // Simpan riwayat token untuk reset password
      await RiwayatToken.create({
        id_user: tokenHistory.id_user,
        aktivitas: "Password Reset - Completed",
        token: `Used code: ${code}`,
      });

      return res.status(200).json({
        success: true,
        message: "Berhasil mengganti password",
        data: {
          email: tokenHistory.user.email,
        },
      });
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const errors = error.errors.map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: "Data input tidak lengkap",
          errors: errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error internal server",
        error: error.message,
      });
    }
  }

  // Create riwayat token (untuk admin atau sistem)
  static async createRiwayatToken(req, res) {
    try {
      const { id_user, aktivitas, token } = req.body;

      // Verifikasi user exists
      const user = await User.findByPk(id_user);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      const riwayat = await RiwayatToken.create({
        id_user,
        aktivitas,
        token,
      });

      return res.status(201).json({
        success: true,
        message: "Riwayat token berhasil dibuat",
        data: riwayat,
      });
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const errors = error.errors.map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: "Data input tidak lengkap",
          errors: errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error internal server",
        error: error.message,
      });
    }
  }

  // Get user profile (protected route)
  static async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: RiwayatToken,
            as: "riwayatTokens",
            limit: 10,
            order: [["created_at", "DESC"]],
          },
        ],
      });

      return res.status(200).json({
        success: true,
        message: "Data profil berhasil diambil",
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error internal server",
        error: error.message,
      });
    }
  }

  // Verify token method
  static async verifyToken(req, res) {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Token akses diperlukan",
        });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Token tidak valid atau sudah kadaluarsa",
        });
      }

      // Cek apakah user masih ada di database
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      await RiwayatToken.create({
        id_user: user.id,
        aktivitas: "Verify Token - Access",
        token: token,
      });

      return res.status(200).json({
        success: true,
        message: "Token valid",
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          nama_lengkap: user.nama_lengkap,
          telp: user.telp,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error dalam verifikasi token",
        error: error.message,
      });
    }
  }

  static async getRiwayatToken(req, res) {
    try {
      const { id_user } = req.params;

      if (!id_user) {
        const riwayatTokens = await RiwayatToken.findAll({
          order: [["created_at", "DESC"]],
        });
        return res.status(200).json({
          success: true,
          message: "Riwayat token berhasil diambil",
          data: riwayatTokens,
        });
      }

      const user = await User.findByPk(id_user);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      const riwayatTokens = await RiwayatToken.findAll({
        where: { id_user },
        order: [["created_at", "DESC"]],
      });

      return res.status(200).json({
        success: true,
        message: "Riwayat token berhasil diambil",
        data: riwayatTokens,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error internal server",
        error: error.message,
      });
    }
  }
}

module.exports = AuthController;
