const { validationResult } = require('express-validator');
const { User } = require('../models');

const postSchema = {
  title: {
    exists: {
      errorMessage: "`title` is required",
    },
    isString: {
      errorMessage: "`title` is in string format",
    }
  },

  description: {
    exists: {
      errorMessage: "`description` is required",
    },
    isString: {
      errorMessage: "`description` is in string format",
    }
  },

  image: {
    custom: {
      options: (value, {req}) => {
        const image = req.file;
        if(image){
          if(!(image.mimetype === 'image/png' || image.mimetype === 'image/jpeg')){
            throw new Error("`image` format should be image/png or image/jpeg");
          }
          if(image.buffer.length > 5 * 1024 * 1024){
            throw new Error("`image` size must be lower than 5MB");
          }
        }
        return true;
      }
    },
  },

  summary: {
    isString: {
      errorMessage: "`summary` is in string format",
    },
    default: 'no summary!',
  },

  detail: {
    isString: {
      errorMessage: "`detail` is in string format",
    },
    default: 'no detail!',
  },

  neededRole: {
    isArray: {
      errorMessage: "`neededRole` is in Array format",
    },
    default: [],
  },

}

const postSchemaUpdate = Object.fromEntries(
  Object.entries(postSchema).map(([field, rules]) => [
    field,
    {
      optional: true,
      exists: undefined, 
      ...rules,
    },
  ])
);
postSchemaUpdate.image.optional = undefined; // idk custom will not work when optional is true

module.exports = {postSchema, postSchemaUpdate}
