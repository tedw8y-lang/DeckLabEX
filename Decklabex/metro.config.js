const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure for Replit environment - Metro doesn't use server.host, handled by Expo CLI

module.exports = config;