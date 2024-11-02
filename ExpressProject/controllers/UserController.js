const express = require('express');
const User = require('../models/User');
const { logger } = require('../utils/logger');

exports.logout = async (req, res) => {
    req.user.token = null;
    const ret = await req.user.save();
    if(!ret) {
        logger.error(`[WEB] /api/v1/user/logout Failed to logout`);
        res.status(500).json({ message: 'Server error' })
    }
    res.status(200).json({ message: 'User logged out successfully' });
}
