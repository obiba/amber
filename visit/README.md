# Amber Visit

[Amber](https://github.com/obiba/amber) is the Electronic Data Capture server. Amber Visit is a web interface for collecting the data with interviews:

- interview with interdependent steps
- campaign investigators and support interviewers
- self-administered or assisted interviews

## Install the dependencies

```bash
yarn
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
yarn quasar dev
```

### Lint the files

```bash
yarn lint
```

### Format the files

```bash
yarn format
```

### Build the app for production

```bash
yarn quasar build
```

Environment variable for building the app in production:

- `AMBER_URL`, the url of the Amber server, exposing a REST API used by Amber Visit (make sure CORS policy is set correctly on the server)
- `RECAPTCHA_SITE_KEY`, the [reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3) site key for the Registration page. If not specified, user self-registration is disabled.
- `PATH_PREFIX`, the public path of your app. By default, it uses the root: `/`. Use it when your public path is something else, like "https://www.example.org/some_path" where the path prefix is `/some_path`.

### Customize the configuration

- Modify the `settings.json` file for theming, configure build and overriding translations.

See also [Configuring quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js).

## License

[MIT](https://mit-license.org/)
