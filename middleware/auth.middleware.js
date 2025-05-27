const jwt = require("jsonwebtoken");
const db = require("../models");
const { User } = db;

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

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
    // Lazy load model untuk menghindari circular dependency
    const { User } = require("../models");

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

    // Simpan informasi user ke request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      nama_lengkap: user.nama_lengkap,
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

// Middleware untuk optional authentication (tidak wajib login)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findByPk(decoded.id);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            nama_lengkap: user.nama_lengkap,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Jika ada error, tetap lanjutkan tanpa user info
    next();
  }
};

// Middleware untuk refresh token
const refreshTokenMiddleware = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token diperlukan",
      });
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Refresh token tidak valid",
      });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error dalam verifikasi refresh token",
      error: error.message,
    });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  authorizeRoles,
  optionalAuth,
  refreshTokenMiddleware,
  JWT_SECRET,
  JWT_EXPIRES_IN,
};
