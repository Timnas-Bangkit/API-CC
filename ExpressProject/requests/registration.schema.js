const { validationResult } = require('express-validator');
const { User } = require('../models');

const regitrationSchema = {
  username: {
    exists: {
      errorMessage: "`username` is required",
    }
  },

  email: {
    exists: {
      errorMessage: "`email` is required",
    },
    isEmail: {
      errorMessage: "`email` should be in email format"
    },
    custom: {
      options: async (value) => {
        await User.findOne({
          where: {
            email: value
          }
        }).then((user) => {
          if(user){
            return Promise.reject("`email` already registered");
          }
        })
      }
    }
  },

  password: {
    exists: {
      errorMessage: "`password` is required"
    },
    isLength: {
      options: {
        min: 6,
      },
      errorMessage: "`password` should be greater than 6",
    }
  }
}

module.exports = { regitrationSchema }
