const Joi = require("joi");

// Schema validasi untuk registrasi user
const registerSchema = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }).max(100).required().messages({
    "string.empty": "Email harus diisi",
    "string.email": "Format email tidak valid",
    "string.max": "Email maksimal 100 karakter",
    "any.required": "Email harus diisi",
  }),
  password: Joi.string().min(6).max(255).required().messages({
    "string.empty": "Password harus diisi",
    "string.min": "Password minimal 6 karakter",
    "string.max": "Password maksimal 255 karakter",
    "any.required": "Password harus diisi",
  }),
  nama_lengkap: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Nama lengkap harus diisi",
    "string.min": "Nama lengkap minimal 2 karakter",
    "string.max": "Nama lengkap maksimal 100 karakter",
    "any.required": "Nama lengkap harus diisi",
  }),
  telp: Joi.string()
    .pattern(/^[0-9+\-\s]+$/)
    .min(10)
    .max(15)
    .required()
    .messages({
      "string.empty": "Nomor telepon harus diisi",
      "string.pattern.base": "Format nomor telepon tidak valid",
      "string.min": "Nomor telepon minimal 10 digit",
      "string.max": "Nomor telepon maksimal 15 digit",
      "any.required": "Nomor telepon harus diisi",
    }),
  role: Joi.string().valid("user", "volunteer", "admin").default("user").messages({
    "any.only": "Role harus berupa user, volunteer, atau admin",
  }),
});

// Schema validasi untuk login
const loginSchema = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    "string.empty": "Email harus diisi",
    "string.email": "Format email tidak valid",
    "any.required": "Email harus diisi",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password harus diisi",
    "any.required": "Password harus diisi",
  }),
});

// Schema validasi untuk forgot password
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    "string.empty": "Email harus diisi",
    "string.email": "Format email tidak valid",
    "any.required": "Email harus diisi",
  }),
});

// Schema validasi untuk verify forgot password
const verifyForgotPasswordSchema = Joi.object({
  password: Joi.string()
    .min(6)
    .max(100)
    .pattern(/^(?=.*[!@#$%^&*(),.?":{}|<>]).*$/)
    .required()
    .messages({
      "string.empty": "Password harus diisi",
      "string.min": "Password minimal 6 karakter",
      "string.max": "Password maksimal 255 karakter",
      "string.pattern.base": "Password harus mengandung minimal 1 simbol",
      "any.required": "Password harus diisi",
    }),
});

const verifyChangePasswordSchema = Joi.object({
  old_password: Joi.string().min(6).max(255).required().messages({
    "string.empty": "Password lama harus diisi",
    "string.min": "Password lama minimal 6 karakter",
    "string.max": "Password lama maksimal 255 karakter",
    "any.required": "Password lama harus diisi",
  }),
  new_password: Joi.string().min(6).max(255).required().messages({
    "string.empty": "Password baru harus diisi",
    "string.min": "Password baru minimal 6 karakter",
    "string.max": "Password baru maksimal 255 karakter",
    "any.required": "Password baru harus diisi",
  }),
});

// Schema validasi untuk riwayat token
const riwayatTokenSchema = Joi.object({
  id_user: Joi.number().integer().positive().required().messages({
    "number.base": "ID user harus berupa angka",
    "number.integer": "ID user harus berupa bilangan bulat",
    "number.positive": "ID user harus berupa angka positif",
    "any.required": "ID user harus diisi",
  }),
  aktivitas: Joi.string().max(100).required().messages({
    "string.empty": "Aktivitas harus diisi",
    "string.max": "Aktivitas maksimal 100 karakter",
    "any.required": "Aktivitas harus diisi",
  }),
  token: Joi.string().required().messages({
    "string.empty": "Token harus diisi",
    "any.required": "Token harus diisi",
  }),
});

// Schema validasi untuk update user (optional fields)
const updateUserSchema = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }).max(100).messages({
    "string.email": "Format email tidak valid",
    "string.max": "Email maksimal 100 karakter",
  }),
  password: Joi.string().min(6).max(255).messages({
    "string.min": "Password minimal 6 karakter",
    "string.max": "Password maksimal 255 karakter",
  }),
  nama_lengkap: Joi.string().min(2).max(100).messages({
    "string.min": "Nama lengkap minimal 2 karakter",
    "string.max": "Nama lengkap maksimal 100 karakter",
  }),
  telp: Joi.string()
    .pattern(/^[0-9+\-\s]+$/)
    .min(10)
    .max(15)
    .messages({
      "string.pattern.base": "Format nomor telepon tidak valid",
      "string.min": "Nomor telepon minimal 10 digit",
      "string.max": "Nomor telepon maksimal 15 digit",
    }),
  role: Joi.string().valid("user", "volunteer", "admin").messages({
    "any.only": "Role harus berupa user, volunteer, atau admin",
  }),
})
  .min(1)
  .messages({
    "object.min": "Minimal satu field harus diisi untuk update",
  });

const validateUpdateProfileScema = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }).max(100).messages({
    "string.empty": "Email harus diisi",
    "string.email": "Format email tidak valid",
    "string.max": "Email maksimal 100 karakter",
    "any.required": "Email harus diisi",
  }),
  nama_lengkap: Joi.string().min(2).max(100).messages({
    "string.empty": "Nama lengkap harus diisi",
    "string.min": "Nama lengkap minimal 2 karakter",
    "string.max": "Nama lengkap maksimal 100 karakter",
    "any.required": "Nama lengkap harus diisi",
  }),
  telp: Joi.string()
    .pattern(/^[0-9+\-\s]+$/)
    .min(10)
    .max(15)
    .messages({
      "string.empty": "Nomor telepon harus diisi",
      "string.pattern.base": "Format nomor telepon tidak valid",
      "string.min": "Nomor telepon minimal 10 digit",
      "string.max": "Nomor telepon maksimal 15 digit",
      "any.required": "Nomor telepon harus diisi",
    }),
})
  .or("email", "nama_lengkap", "telp") // <-- Key addition here
  .messages({
    "object.missing": "Minimal harus ada satu data yang diubah (email, nama lengkap, atau telepon)",
  });

// Middleware untuk validasi
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Menampilkan semua error sekaligus
      allowUnknown: false, // Tidak mengizinkan field yang tidak didefinisikan
      stripUnknown: true, // Menghapus field yang tidak didefinisikan
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: "Data input tidak valid",
        errors: errors,
      });
    }

    // Mengganti req.body dengan value yang sudah divalidasi
    req.body = value;
    next();
  };
};

// Middleware untuk validasi query parameter
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: "Parameter query tidak valid",
        errors: errors,
      });
    }

    req.query = value;
    next();
  };
};

// Middleware untuk validasi parameter URL
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: "Parameter URL tidak valid",
        errors: errors,
      });
    }

    req.params = value;
    next();
  };
};

// Schema untuk validasi ID parameter
const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "ID harus berupa angka",
    "number.integer": "ID harus berupa bilangan bulat",
    "number.positive": "ID harus berupa angka positif",
    "any.required": "ID harus diisi",
  }),
});

// Schema untuk validasi code query parameter (untuk verify forgot password)
const codeQuerySchema = Joi.object({
  code: Joi.string().required().messages({
    "string.empty": "Code harus diisi",
    "any.required": "Code harus diisi",
  }),
});

module.exports = {
  // Schema exports
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyForgotPasswordSchema,
  riwayatTokenSchema,
  updateUserSchema,
  idParamSchema,
  codeQuerySchema,
  verifyChangePasswordSchema,
  validateUpdateProfileScema,

  // Middleware exports
  validate,
  validateQuery,
  validateParams,

  // Pre-configured middleware
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateForgotPassword: validate(forgotPasswordSchema),
  validateVerifyForgotPassword: validate(verifyForgotPasswordSchema),
  validateRiwayatToken: validate(riwayatTokenSchema),
  validateUpdateUser: validate(updateUserSchema),
  validateIdParam: validateParams(idParamSchema),
  validateCodeQuery: validateQuery(codeQuerySchema),
  validateVerifyChangePassword: validate(verifyChangePasswordSchema),
  validateUpdateProfile: validate(validateUpdateProfileScema),
};
