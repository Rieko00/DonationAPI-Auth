const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../models");
const { User, RiwayatToken } = db;
const { generateToken } = require("../middleware/auth.middleware");

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

      // Generate token
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

      // Generate unique code untuk reset password
      const resetCode = crypto.randomBytes(32).toString("hex");

      // Simpan code ke riwayat token (bisa juga buat tabel terpisah)
      await RiwayatToken.create({
        id_user: user.id,
        aktivitas: `Forgot Password - Reset Code: ${resetCode}`,
        token: resetCode,
      });

      // TODO: Kirim email dengan reset code
      // Untuk sementara hanya return response

      return res.status(200).json({
        success: true,
        message: "Request ubah password berhasil, silahkan cek email anda",
        data: {
          email: user.email,
          // Untuk development, tampilkan code
          // Hapus ini di production
          resetCode: resetCode,
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
      const { code } = req.query;
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
            [db.Sequelize.Op.like]: "Forgot Password - Reset Code:%",
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
      const oneHour = 60 * 60 * 1000; // 1 jam dalam milliseconds

      if (codeAge > oneHour) {
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

      // Hapus atau mark sebagai used
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

  // Update user profile (protected route)
  static async updateProfile(req, res) {
    try {
      const updateData = req.body;
      const userId = req.user.id;

      // Jika ada perubahan email, cek uniqueness
      if (updateData.email) {
        const existingUser = await User.findOne({
          where: {
            email: updateData.email,
            id: { [db.Sequelize.Op.ne]: userId },
          },
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Email sudah digunakan oleh user lain",
          });
        }
      }

      await User.update(updateData, {
        where: { id: userId },
        individualHooks: true,
      });

      const updatedUser = await User.findByPk(userId);

      return res.status(200).json({
        success: true,
        message: "Profil berhasil diperbarui",
        data: updatedUser,
      });
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const errors = error.errors.map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: "Data update tidak valid",
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

  // Logout (protected route)
  static async logout(req, res) {
    try {
      // Simpan riwayat logout
      await RiwayatToken.create({
        id_user: req.user.id,
        aktivitas: "Logout - Token Invalidated",
        token: req.headers.authorization?.split(" ")[1] || "unknown",
      });

      return res.status(200).json({
        success: true,
        message: "Berhasil logout",
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
