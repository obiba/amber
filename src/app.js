const path = require('path');
const favicon = require('serve-favicon');
const helmet = require('helmet');
const cors = require('cors');
const compress = require('compression');
const logger = require('./logger');

const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');
const casl = require('feathers-casl');

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');
const channels = require('./channels');

const authentication = require('./authentication');

const mongoose = require('./mongoose');

const app = express(feathers());

// Load app configuration
app.configure(configuration());
let authenticationConfig = app.get('authentication');
if (process.env.APP_NAME) {
  authenticationConfig.jwtOptions.issuer = process.env.APP_NAME;
}
if (process.env.APP_SECRET_KEY) {
  authenticationConfig.secret = process.env.APP_SECRET_KEY;
}
if (process.env.APP_URL) {
  authenticationConfig.jwtOptions.audience = process.env.APP_URL;
  app.set('api_url', process.env.APP_URL);
}
if (process.env.GITHUB_KEY && process.env.GITHUB_SECRET) {
  authenticationConfig.oauth.github = {
    key: process.env.GITHUB_KEY,
    secret: process.env.GITHUB_SECRET,
  };
}
if (process.env.GOOGLE_KEY && process.env.GOOGLE_SECRET) {
  authenticationConfig.oauth.google = {
    key: process.env.GOOGLE_KEY,
    secret: process.env.GOOGLE_SECRET,
    scope: ['email', 'profile', 'openid']
  };
}
app.set('authentication', authenticationConfig);

// Enable security, CORS
const whitelist = (process.env.CLIENT_URLS || app.get('client_urls') || '').split(' ').join('').split(',');
app.use(helmet({
  contentSecurityPolicy: false
}));
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.includes('*') || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));  

// Enable compression, favicon and body parsing
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')));

// Set up Plugins and providers
app.configure(express.rest());
// app.configure(socketio());

app.configure(mongoose);

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
app.configure(authentication);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);

// Authz
app.configure(casl());

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger }));

// Global hooks
app.hooks(appHooks);

module.exports = app;
