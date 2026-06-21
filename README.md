# amber

> Electronic Data Capture system

## About

Amber is an Electronic Data Capture system with a REST API, an administration interface [Amber Studio](https://github.com/obiba/amber-studio) and a user interface [Amber Collect](https://github.com/obiba/amber-collect).

Functionalities:

* data collection
  * data collection using online questionnaires
  * multiple data types: text, numeric, logical, image, video, file etc.
  * questionnaire builder
  * extensible question types
  * questionnaires grouped by study
  * questions with skip conditions
  * questionnaires with pages
  * self-reported data collection
* participants
  * walk-in patients
* users
  * user roles: administrator, manager, interviewer, guest
  * user/group permissions
  * user signup
  * user management
* multi-lang
* documentation
* themes

Technical features:

* scalable
* offline-first design, with auto sync
* multiple clients: web, mobile, desktop, script
* auth with local credentials or OpenID Connect (OIDC)
* docker
* mailer
* configurable

## Getting Started (developers)

This project uses [Feathers](http://feathersjs.com). An open source web framework for building modern real-time applications.

1. Make sure you have [NodeJS](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
2. Install your dependencies

    ```
    cd path/to/amber
    npm install
    ```

3. Start your app

    ```
    npm start
    # or
    rmp run dev
    ```

## Environment Variables

Amber uses [dotenv](https://github.com/motdotla/dotenv) for environment variables discovery from a `.env` file. 

* `CLUSTER_COUNT`, node cluster count, defaults to all available CPU cores
* `APP_NAME`, JWT issuer
* `APP_SECRET_KEY`, encryption key
* `APP_SECRET_IV`, secret string for the encryption's initial vector,
* `APP_URL`, JWT audience
* `APP_API_KEYS`, the allowed API keys (comma separated values) for triggering backround tasks execution,
* `CLIENT_URLS`, comma separated client urls, for the CORS policy
* `AMBER_STUDIO_URL`, Amber Studio app url, to be included in the notification emails
* `AMBER_COLLECT_URL`, Amber Collect app url, to be included in the notification emails
* `AMBER_VISIT_URL`, Amber Visit app url, to be included in the notification emails
* `MONGODB_URL`, the MongoDB connection string
* `ENCRYPT_DATA`, whether the patient/participant data should be encrypted in the database
* `OTP_TIMEOUT`, is the number of minutes during which the onetime password (OTP) sent by email is valid. Default is 5; when set to 0, the email-based onetime password is deactivated. This does not apply to the time-based onetime password (TOTP) procedure, which can be activated per user.
* `RECAPTCHA_SECRET_KEY`, the [reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3) secret key.
* `SIGNUP_WHITELIST`, the list of email domains that are allowed to signup. Use '*' for wild card. Default is all.
* `SIGNUP_BLACKLIST`, the list of email domains that are NOT allowed to signup. Use '*' for wild card. Default is none.
* `GMAIL`, the Gmail user name for the notification service
* `GMAIL_PASSWORD`, the Gmail user password for the notification service
* `BREVO_API_KEY` (legacy: `SENDINBLUE_API_KEY`), the [Brevo (former Sendinblue)](https://www.brevo.com/) API key for the notification service
* `SMTP_HOST`, the SMTP server host
* `SMTP_PORT`, the SMTP server port (defaults to 587 if is secure is false or 465 if true) 
* `SMTP_NAME`, the SMTP server name
* `SMTP_SECURE`, whether the SMTP connection should use SSL (default is true)
* `SMTP_REQUIRE_TLS`, whether the SMTP connection should use TLS (when secure is false)
* `SMTP_LOGGER`, enable SMTP logging
* `SMTP_DEBUG`, enable SMTP debug by sending log events
* `SMTP_USER`, the SMTP server user
* `SMTP_PASSWORD`, the SMTP server user's password
* `FROM_EMAIL`, the automated sender email address,
* `GITHUB_KEY`, OAuth key for Github
* `GITHUB_SECRET`, OAuth secret for Github
* `GOOGLE_KEY`, OAuth key for Google
* `GOOGLE_SECRET`, OAuth secret for Google
* `OIDC_NAME`, OpenID Connect provider name
* `OIDC_ISSUER_URL`, OpenID Connect issuer URL (used for OIDC discovery and UserInfo endpoint resolution, e.g. `https://your-idp/realms/myrealm`)
* `OIDC_KEY`, OpenID Connect client ID
* `OIDC_SECRET`, OpenID Connect client secret
* `OIDC_SCOPE`, OpenID Connect scope as comma or space separated names (e.g. openid email profile), defaults to issuer's supported scopes or ['openid', 'email', 'profile']
* `OIDC_NONCE`, OpenID Connect nonce usage, either true or 1, default is false
* `ADMINISTRATOR_EMAIL`, user seeding when there is no administrator in the database
* `ADMINISTRATOR_PWD`, user seeding when there is no administrator in the database
* `LOG_LEVEL`, logger level (`error`, `warn`, `info`, `verbose`, `debug`, `silly`, etc. (see [winstonjs](https://github.com/winstonjs/winston))), default is `info`
* `LOG_FILE`, file logger path
* `LOG_FILE_LEVEL`, file logger level when `LOG_FILE` is specified, default is `LOG_LEVEL`
* `NODE_ENV`, name of the config file to be merged with the default one (e.g. `production`)

## Configuration

The configuration is defined in `config/default.json` and can be overridden by environment-specific files (e.g. `config/production.json`) controlled by the `NODE_ENV` environment variable. Most values can also be overridden via environment variables (see [Environment Variables](#environment-variables) section).

### Server

| Key | Default | Description |
|-----|---------|-------------|
| `host` | `localhost` | Server bind address |
| `port` | `3030` | Server port |
| `public` | `../public/` | Path to the static files directory |

### Pagination

| Key | Default | Description |
|-----|---------|-------------|
| `paginate.default` | `10` | Default number of items per page |
| `paginate.max` | `10000` | Maximum number of items per page |

### Data Encryption

| Key | Default | Description |
|-----|---------|-------------|
| `encrypt_data` | `false` | Whether participant/patient data is encrypted at rest in the database |
| `encrypt_iv` | *(generated)* | Secret string used to derive the encryption initial vector — **must be changed in production** |

### Authentication

| Key | Default | Description |
|-----|---------|-------------|
| `authentication.entity` | `user` | Name of the entity (database collection) storing authenticated users |
| `authentication.service` | `user` | Feathers service used to look up authenticated users |
| `authentication.secret` | *(generated)* | Secret used to sign JWTs — **must be changed in production** |
| `authentication.authStrategies` | `["jwt","local","participant","campaign","apiKey"]` | List of enabled authentication strategies |
| `authentication.totp2faRequired` | `true` | Whether time-based OTP (TOTP) two-factor authentication is enforced for users |
| `authentication.otpTimeout` | `5` | Validity period in minutes of the email-based OTP; set to `0` to disable email OTP |
| `authentication.activityTimeout` | `5d` | Duration of inactivity after which a session expires |

#### JWT Options

| Key | Default | Description |
|-----|---------|-------------|
| `authentication.jwtOptions.header.typ` | `access` | JWT header `typ` claim |
| `authentication.jwtOptions.audience` | `https://example.com` | JWT `aud` claim — should be set to the application URL in production |
| `authentication.jwtOptions.issuer` | `amber` | JWT `iss` claim |
| `authentication.jwtOptions.algorithm` | `HS256` | JWT signing algorithm |
| `authentication.jwtOptions.expiresIn` | `60d` | JWT expiration duration |

#### Local Strategy

| Key | Default | Description |
|-----|---------|-------------|
| `authentication.local.usernameField` | `email` | Field used as username in the local auth strategy |
| `authentication.local.passwordField` | `password` | Field used as password in the local auth strategy |

#### Participant / Campaign Strategy

| Key | Default | Description |
|-----|---------|-------------|
| `authentication.participant.service` | `participant` | Feathers service used to look up participants |
| `authentication.participant.hashSize` | `10` | bcrypt hash rounds for participant passwords |
| `authentication.participant.passwordLength` | `8` | Length of the auto-generated participant access code |
| `authentication.campaign.service` | `participant` | Feathers service used for campaign-based participant auth |
| `authentication.campaign.hashSize` | `10` | bcrypt hash rounds for campaign passwords |
| `authentication.campaign.passwordLength` | `8` | Length of the auto-generated campaign access code |

#### API Key Strategy

| Key | Default | Description |
|-----|---------|-------------|
| `authentication.apiKey.allowedKeys` | `["CHANGEME"]` | List of valid API keys for background task triggers — **must be changed in production** |
| `authentication.apiKey.header` | `x-access-token` | HTTP header name used to carry the API key |

#### OAuth / OIDC

OAuth providers are configured as named sub-objects under `authentication.oauth`. The provider name becomes part of the OAuth callback URL (e.g. `/oauth/github/callback`). Provider names starting with `_` are ignored (useful for commented-out examples).

The strategy used for each provider is selected automatically:
- A provider named `github` uses the GitHub strategy.
- A provider named `google` uses the Google strategy.
- Any provider whose config contains `issuer_url` uses the generic OIDC strategy (OpenID Connect discovery).
- Any other provider name uses the base OAuth2 strategy.

Role mapping from OAuth/OIDC profiles: if the profile contains a `groups` or `roles` array, the values `{app_name}-administrator`, `{app_name}-manager`, and `{app_name}-interviewer` are mapped to the corresponding Amber roles. All other authenticated users receive the `guest` role.

**Common settings**

| Key | Default | Description |
|-----|---------|-------------|
| `authentication.oauth.origins` | `[]` | Allowed OAuth redirect origins |
| `authentication.oauth.redirect` | `/` | URL to redirect to after a successful OAuth login |

**GitHub provider** (`authentication.oauth.github`)

| Key | Description |
|-----|-------------|
| `key` | GitHub OAuth App client ID |
| `secret` | GitHub OAuth App client secret |

**Google provider** (`authentication.oauth.google`)

| Key | Description |
|-----|-------------|
| `key` | Google OAuth client ID |
| `secret` | Google OAuth client secret |

**Generic OIDC provider** (`authentication.oauth.<name>`) — detected by the presence of `issuer_url`

| Key | Description |
|-----|-------------|
| `key` | OIDC client ID |
| `secret` | OIDC client secret |
| `issuer_url` | OIDC issuer URL used for discovery (e.g. `https://your-idp/realms/myrealm`); also used to resolve the UserInfo endpoint |
| `authorize_url` | *(optional)* Override for the authorization endpoint |
| `access_url` | *(optional)* Override for the token endpoint |
| `scope` | *(optional)* Array of OIDC scopes (e.g. `["openid","email","profile"]`); defaults to the issuer's supported scopes or `["openid","email","profile"]` |
| `nonce` | *(optional)* Whether to include a nonce in the authorization request (`true`/`false`, default `false`) |

### Signup

| Key | Default | Description |
|-----|---------|-------------|
| `signup.whitelist` | `["*"]` | Email domains allowed to self-register; `"*"` means all domains |
| `signup.blacklist` | `["example.com","example.org"]` | Email domains explicitly blocked from self-registering |

### Database

| Key | Default | Description |
|-----|---------|-------------|
| `mongodb` | `mongodb://localhost:27017/amber` | MongoDB connection string |

### SMTP / Mailer

| Key | Default | Description |
|-----|---------|-------------|
| `smtp.host` | *(required)* | SMTP server hostname |
| `smtp.name` | *(optional)* | SMTP server name (used in EHLO) |
| `smtp.secure` | `true` | Use SSL for the SMTP connection |
| `smtp.require_tls` | `false` | Require STARTTLS when `secure` is false |
| `smtp.logger` | `false` | Enable SMTP transport logging |
| `smtp.debug` | `false` | Enable verbose SMTP debug output |
| `from_email` | `no-reply@example.org` | Sender address for all automated emails |

### Email Templates

Notification emails are defined under `email_templates`, keyed by event name, with per-language (`en`, `fr`) `subject` and `html` entries. Template placeholders use `{variable}` syntax.

| Key | Description |
|-----|-------------|
| `email_templates.otp` | Sent to a user when an email-based OTP is issued |
| `email_templates.notifySignup` | Sent to administrators when a new user signs up |
| `email_templates.resendVerifySignup` | Sent to a user with a new email verification link |
| `email_templates.verifySignup` | Confirmation sent to a user after their email is verified |
| `email_templates.sendResetPwd` | Sent to a user with a password-reset link |
| `email_templates.resetPwd` | Confirmation sent to a user after a successful password reset |
| `email_templates.passwordChange` | Notification sent to a user after their password changes |
| `email_templates.infoParticipantsAboutToInit` | Sent to interviewers before participant accounts are activated |
| `email_templates.initParticipants` | Sent to interviewers when new participant accounts are activated |
| `email_templates.infoParticipantsAboutToExpire` | Sent to interviewers when participant accounts are close to expiring |
| `email_templates.remindParticipants` | Periodic reminder sent to interviewers about incomplete interviews |
| `email_templates.summaryParticipants` | Summary of participant progress for a campaign |
| `email_templates.interviewCompleted` | Sent to interviewers when a participant completes an interview |

### Tasks

| Key | Default | Description |
|-----|---------|-------------|
| `tasks.delimiter` | `;` | Column delimiter used in CSV task files |
| `tasks.extension` | `.csv` | File extension expected for task files |

### Application URLs

| Key | Default | Description |
|-----|---------|-------------|
| `client_urls` | `*` | Comma-separated list of allowed client origins for CORS; `*` allows all |
| `amber_studio_url` | `http://localhost:3080` | URL of the Amber Studio admin interface, used in notification email links |
| `amber_collect_url` | `http://localhost:3090` | URL of the Amber Collect data-collection interface |
| `amber_visit_url` | `http://localhost:3070` | URL of the Amber Visit interviewer interface |
| `api_url` | `http://localhost:3030/` | Public URL of the Amber API |

### Miscellaneous

| Key | Default | Description |
|-----|---------|-------------|
| `recaptcha_secret_key` | *(empty)* | [reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3) secret key; leave empty to disable CAPTCHA validation |
| `export.entity_type` | `Participant` | Entity type label used in data exports |
| `export.identifier_variable` | `id` | Variable name used as the participant identifier in exports |

## Testing

Simply run `npm test` and all your tests in the `test/` directory will be run.

## Scaffolding

Feathers has a powerful command line interface. Here are a few things it can do:

```
$ npm install -g @feathersjs/cli          # Install Feathers CLI

$ feathers generate service               # Generate a new Service
$ feathers generate hook                  # Generate a new Hook
$ feathers help                           # Show all commands
```

## Help

For more information on all the things you can do with Feathers visit [docs.feathersjs.com](http://docs.feathersjs.com).
