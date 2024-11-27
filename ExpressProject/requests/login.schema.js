const { validationResult } = require('express-validator');
const { User } = require('../models');

const loginSchema = {
  email: {
    exists: {
      errorMessage: "`email` is required",
    },
    isEmail: {
      errorMessage: "`email` should be in email format"
    },
  },

  password: {
    exists: {
      errorMessage: "`password` is required",
    }
  }
}

module.exports = { loginSchema }
