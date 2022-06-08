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
  * questionnaires grouped by project/study
  * questionnaires flow (interview)
  * questions with conditions
  * questionnaires with pages
  * self-reported or interview-driven data collection
* participants
  * walk-in patients or registered participants
  * participants partitionning with invitation/reminder mailing
* users
  * user roles: admin, manager, interviewer, participant
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
* auth with local and openid connect credentials
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
* `CLIENT_URLS`, comma separated client urls, for the CORS policy
* `AMBER_STUDIO_URL`, Amber Studio app url, to be included in the notification emails
* `AMBER_COLLECT_URL`, Amber Collect app url, to be included in the notification emails
* `MONGODB_URL`, the MongoDB connection string
* `ENCRYPT_DATA`, whether the patient/participant data should be encrypted in the database
* `GMAIL`, the Gmail user name for the notification service
* `GMAIL_PASSWORD`, the Gmail user password for the notification service
* `SENDINBLUE_API_KEY`, the [Sendinblue](https://www.sendinblue.com/) API key for the notification service
* `FROM_EMAIL`, the automated sender email address,
* `GITHUB_KEY`, OAuth key for Github
* `GITHUB_SECRET`, OAuth secret for Github
* `GOOGLE_KEY`, OAuth key for Google
* `GOOGLE_SECRET`, OAuth secret for Google
* `ADMINISTRATOR_EMAIL`, user seeding when there is no administrator in the database
* `ADMINISTRATOR_PWD`, user seeding when there is no administrator in the database
* `LOG_LEVEL`, logger level (`error`, `warn`, `info`, `verbose`, `debug`, `silly`, etc. (see [winstonjs](https://github.com/winstonjs/winston))), default is `info`
* `LOG_FILE`, file logger path
* `LOG_FILE_LEVEL`, file logger level when `LOG_FILE` is specified, default is `LOG_LEVEL`
* `NODE_ENV`, name of the config file to be merged with the default one (e.g. `production`)

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
