const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../models");
const { User, RiwayatToken } = db;
const { generateToken, verifyToken } = require("../middleware/auth.middleware");

class profileController {
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

  static async updatePassword(req, res) {
    try {
      const { old_password, new_password } = req.body;
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      const isMatch = await bcrypt.compare(old_password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Kata sandi lama tidak cocok",
        });
      }

      await User.update(
        { password: new_password },
        {
          where: { id: userId },
          individualHooks: true,
        }
      );

      return res.status(200).json({
        success: true,
        message: "Kata sandi berhasil diperbarui",
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

module.exports = profileController;
