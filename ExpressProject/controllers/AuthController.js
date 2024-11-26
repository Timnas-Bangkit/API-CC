const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const { logger } = require('../utils/logger');
const { generateToken } = require('../utils/jwt'); 

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ where: { email: email } });
        if (existingUser) {
            logger.info(`[WEB] /register email already registered: ${email}`);
            return res.status(409).json({ message: 'Email already registered' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await User.create({ username: username, email: email, password: hashedPassword });
        const profile = await UserProfile.create({ name: username });

      newUser.setUser_profile(profile);
        logger.info(`[WEB] /register user registered: ${username} ${email}`);
        res.status(200).json({ error: false, message: 'User registered successfully' });
    } catch (error) {
        logger.error(`[WEB] /register bouncing an error: ${error}`);
        res.status(500).json({ error: false, message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            logger.warn(`[WEB] /login Failed login attempt for email: ${email}`);
            return res.status(400).json({ error: true, message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn(`[WEB] /login Failed login attempt for email: ${email}`);
            return res.status(400).json({ error: true, message: 'Invalid credentials' });
        }
        const token = generateToken({ username: user.username, email: user.email });
        user.token = token;
        const ret = await user.save();
        if (!ret) throw new Error('Failed to save token');
        logger.info(`[WEB] /login user logged in for email: ${user.email}`)
        res.status(200).json({ error: false, message: 'Login success', data: {
          id: user.id,
          username: user.username,
          email: user.email,
          token: user.token
        } });
    } catch (error) {
        logger.error(`[WEB] /login bouncing an error: ${error}`);
        res.status(500).json({ error: true, message: 'Server error' });
    }
};
