const path = require('path');
const favicon = require('serve-favicon');
const helmet = require('helmet');
const cors = require('cors');
const compress = require('compression');
const logger = require('./logger');
const { Issuer } = require('openid-client');

const { feathers } = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const { json, urlencoded, static: serveStatic, notFound, errorHandler, rest } = express;
const { feathersCasl } = require('feathers-casl');

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');
const channels = require('./channels');

const authentication = require('./authentication');

const mongodb = require('./mongodb');
const crypto = require('./crypto');

module.exports = (async () => {
  const app = express(feathers());

  // Load app configuration
  app.configure(configuration());

  // Encryption
  if (process.env.ENCRYPT_DATA &&
    (process.env.ENCRYPT_DATA === true || process.env.ENCRYPT_DATA === 'true' || process.env.ENCRYPT_DATA === 1 || process.env.ENCRYPT_DATA === '1')) {
    app.set('encrypt_data', true);
  }
  if (process.env.APP_SECRET_IV) {
    app.set('encrypt_iv', process.env.APP_SECRET_IV);
  }

  // Authentication
  let authenticationConfig = app.get('authentication');
  if (process.env.APP_NAME) {
    authenticationConfig.jwtOptions.issuer = process.env.APP_NAME;
  }
  if (process.env.APP_SECRET_KEY) {
    authenticationConfig.secret = process.env.APP_SECRET_KEY;
  }
  if (process.env.APP_API_KEYS && authenticationConfig.apiKey) {
    authenticationConfig.apiKey.allowedKeys = process.env.APP_API_KEYS.split(',').map(k => k.trim());
  }
  if (process.env.APP_URL) {
    authenticationConfig.jwtOptions.audience = process.env.APP_URL;
    app.set('api_url', process.env.APP_URL);
  }
  if (process.env.OAUTH_REDIRECT) {
    authenticationConfig.oauth.redirect = process.env.OAUTH_REDIRECT;
  }
  if (process.env.OAUTH_ORIGINS) {
    authenticationConfig.oauth.origins = process.env.OAUTH_ORIGINS.split(',').map(o => o.trim());
  }
  if (process.env.AMBER_STUDIO_URL && !authenticationConfig.oauth.origins.includes(process.env.AMBER_STUDIO_URL)) {
    authenticationConfig.oauth.origins.push(process.env.AMBER_STUDIO_URL);
  }
  if (process.env.AMBER_COLLECT_URL && !authenticationConfig.oauth.origins.includes(process.env.AMBER_COLLECT_URL)) {
    authenticationConfig.oauth.origins.push(process.env.AMBER_COLLECT_URL);
  }
  if (process.env.AMBER_VISIT_URL && !authenticationConfig.oauth.origins.includes(process.env.AMBER_VISIT_URL)) {
    authenticationConfig.oauth.origins.push(process.env.AMBER_VISIT_URL);
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
  if (process.env.OIDC_ISSUER_URL && process.env.OIDC_KEY && process.env.OIDC_SECRET) {
    // get authorize and token URLs from well-known endpoint
    const issuer = await Issuer.discover(process.env.OIDC_ISSUER_URL);
    const authorize_url = issuer.metadata.authorization_endpoint;
    const token_url = issuer.metadata.token_endpoint;
    const scope = (process.env.OIDC_SCOPE ? process.env.OIDC_SCOPE.split(',').map(s => s.trim()) : null) || issuer.metadata.scopes_supported || ['openid', 'email', 'profile'];
    const name = process.env.OIDC_NAME || 'oidc';
    const nonce = (process.env.OIDC_NONCE && (process.env.OIDC_NONCE === true || process.env.OIDC_NONCE === 'true' || process.env.OIDC_NONCE === 1 || process.env.OIDC_NONCE === '1')) || false;
    authenticationConfig.oauth[name] = {
      oauth: 2,
      key: process.env.OIDC_KEY,
      secret: process.env.OIDC_SECRET,
      issuer_url: process.env.OIDC_ISSUER_URL,
      authorize_url: authorize_url,
      access_url: token_url,
      scope: scope,
      nonce: nonce,
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
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  app.options('*', cors(corsOptions));
  app.use(cors(corsOptions));

  // Enable compression, favicon and body parsing
  app.use(compress());
  app.use(json({limit: '25mb'}));
  app.use(urlencoded({ limit: '25mb', extended: true }));
  // Resolve public path relative to app root
  const publicPath = path.resolve(__dirname, app.get('public'));
  app.use(favicon(path.join(publicPath, 'favicon.ico')));
  // Host the public folder
  app.use('/', serveStatic(publicPath));

  // Set up Plugins and providers
  app.configure(rest());

  app.configure(mongodb);
  app.configure(crypto);

  // Configure other middleware (see `middleware/index.js`)
  app.configure(middleware);
  app.configure(authentication);
  // Set up our services (see `services/index.js`)
  app.configure(services);
  // Set up event channels (see channels.js)
  app.configure(channels);

  // Authz
  app.configure(feathersCasl());

  // Configure a middleware for 404s and the error handler
  app.use(notFound());
  app.use(errorHandler({ logger }));

  // Global hooks
  app.hooks(appHooks);

  return app;
})();
