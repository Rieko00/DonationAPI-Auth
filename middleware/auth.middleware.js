const jwt = require("jsonwebtoken");
const db = require("../models");
const { User } = db;

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRATION;

// Generate JWT Token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware untuk autentikasi JWT
const authenticateToken = async (req, res, next) => {
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
        message: "Token tidak valid atau telah kedaluwarsa",
      });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      nama_lengkap: user.nama_lengkap,
      telp: user.telp,
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error dalam verifikasi token",
      error: error.message,
    });
  }
};

// Middleware untuk autorisasi berdasarkan role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User belum terautentikasi",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki izin untuk mengakses resource ini",
      });
    }

    next();
  };
};

// Middleware untuk validasi update profile
const validateUpdateProfile = (req, res, next) => {
  const allowedFields = ["nama_lengkap", "telp", "email"];
  const updateFields = Object.keys(req.body);

  // Cek apakah ada field yang tidak diizinkan
  const invalidFields = updateFields.filter((field) => !allowedFields.includes(field));

  if (invalidFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Field tidak diizinkan: ${invalidFields.join(", ")}`,
    });
  }

  // Validasi email format jika ada
  if (req.body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({
        success: false,
        message: "Format email tidak valid",
      });
    }
  }

  // Validasi telp jika ada
  if (req.body.telp) {
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(req.body.telp)) {
      return res.status(400).json({
        success: false,
        message: "Format nomor telepon tidak valid",
      });
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  validateUpdateProfile,
  generateToken,
  verifyToken,
  authorizeRoles,
  JWT_SECRET,
  JWT_EXPIRES_IN,
};
