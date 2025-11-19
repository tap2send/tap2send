const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables - set these in your .env file
const META_APP_ID = process.env.META_APP_ID || 'YOUR_META_APP_ID';
const META_APP_SECRET = process.env.META_APP_SECRET || 'YOUR_META_APP_SECRET';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/connect.html';

/**
 * Exchange authorization code for long-lived access token
 * This endpoint handles the complete OAuth flow:
 * 1. Exchange code for short-lived token
 * 2. Exchange short-lived token for long-lived token (60 days)
 */
app.post('/api/exchange-token', async (req, res) => {
    try {
        const { code } = req.body;

        // Validate input
        if (!code) {
            return res.status(400).json({
                error: 'Authorization code is required'
            });
        }

        console.log('Exchanging authorization code for access token...');

        // Step 1: Exchange authorization code for short-lived access token
        const shortLivedTokenResponse = await axios.get(
            `https://graph.facebook.com/v19.0/oauth/access_token`,
            {
                params: {
                    client_id: META_APP_ID,
                    client_secret: META_APP_SECRET,
                    redirect_uri: REDIRECT_URI,
                    code: code
                }
            }
        );

        const shortLivedToken = shortLivedTokenResponse.data.access_token;
        
        if (!shortLivedToken) {
            throw new Error('Failed to obtain short-lived access token');
        }

        console.log('Short-lived token obtained successfully');

        // Step 2: Exchange short-lived token for long-lived token (60 days)
        const longLivedTokenResponse = await axios.get(
            `https://graph.facebook.com/v19.0/oauth/access_token`,
            {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: META_APP_ID,
                    client_secret: META_APP_SECRET,
                    fb_exchange_token: shortLivedToken
                }
            }
        );

        const longLivedToken = longLivedTokenResponse.data.access_token;
        const expiresIn = longLivedTokenResponse.data.expires_in;

        if (!longLivedToken) {
            throw new Error('Failed to obtain long-lived access token');
        }

        console.log('Long-lived token obtained successfully. Expires in:', expiresIn, 'seconds');

        // Return the long-lived token to the client
        res.json({
            access_token: longLivedToken,
            token_type: 'Bearer',
            expires_in: expiresIn,
            message: 'Successfully obtained long-lived access token (60 days)'
        });

    } catch (error) {
        console.error('Token exchange error:', error.response?.data || error.message);

        // Handle specific error cases
        if (error.response?.data?.error) {
            const fbError = error.response.data.error;
            return res.status(400).json({
                error: `Facebook API Error: ${fbError.message} (Code: ${fbError.code})`
            });
        }

        res.status(500).json({
            error: 'Internal server error during token exchange',
            details: error.message
        });
    }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Token exchange server is running',
        timestamp: new Date().toISOString()
    });
});

/**
 * Get app configuration (for frontend)
 */
app.get('/api/config', (req, res) => {
    res.json({
        appId: META_APP_ID,
        redirectUri: REDIRECT_URI
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Token exchange server running on port ${PORT}`);
    console.log(`📱 Meta App ID: ${META_APP_ID}`);
    console.log(`🔗 Redirect URI: ${REDIRECT_URI}`);
    console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
