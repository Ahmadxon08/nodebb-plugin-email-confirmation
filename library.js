const nodemailer = require('nodemailer');
const winston = require.main.require('winston');
const nconf = require.main.require('nconf');
const user = require.main.require('./src/user');
const db = require.main.require('./src/database');
const meta = require.main.require('./src/meta');
const emailer = require.main.require('./src/emailer');
const async = require('async');
const jwt = require('jsonwebtoken');
const plugin = {};

plugin.sendConfirmationEmail = function (data) {
    const { uid, email } = data.user;
    
    async.waterfall([
        function (next) {
            user.getUserFields(uid, ['email', 'username'], next);
        },
        function (userData, next) {
            const token = createToken(uid, email);
            const payload = {
                uid,
                token,
                email: userData.email,
                username: userData.username
            };
            emailer.send('email-confirmation', userData.email, meta.config['email:from'], payload, next);
        }
    ], function (err) {
        if (err) {
            winston.error('[plugin/email-confirmation] Could not send confirmation email', err);
        }
    });
};

plugin.addEmailConfirmationToken = function (emailData, next) {
    if (emailData.template === 'email-confirmation') {
        emailData.token = createToken(emailData.uid, emailData.email);
    }
    next(null, emailData);
};

function createToken(uid, email) {
    const payload = { uid, email };
    const secret = process.env.SECRET_KEY
    const options = { expiresIn: '1h' };

    return jwt.sign(payload, secret, options);
}

module.exports = plugin;
