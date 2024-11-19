const crypto = require('crypto');
const path = require('path');

const generateRandomFilename = (originalname) => {
    const randomString = crypto.randomBytes(16).toString('hex');
    const extname = path.extname(originalname);
    return `${randomString}${extname}`;
}

module.exports = {generateRandomFilename}
