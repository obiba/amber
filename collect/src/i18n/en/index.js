// This is just an example,
// so you can safely delete all default props below

export default {
  login: {
    title: 'Sign in to start your session',
    submit: 'Sign in',
    forgot_password: 'Forgot password?',
    register: 'Sign up',
    validate: 'Validate',
    token: '6-digits token',
    totp: 'Scan this QR code with a multifactor authentication app (Microsoft authenticator is recommended), and then enter the temporary token.',
    totp_secret: 'Or copy this secret code to be manually added to the authenticator app.',
    secret_copied: 'Authenticator secret code copied.',
    email_otp: 'Or send the temporary token to your email address.',
    send_email_token: 'Send token',
    failed: 'Incorrect email/password combination.',
    failed_token: 'Incorrect token.',
    continue_with: 'Or continue with'
  },
  register: {
    title: 'Register new membership',
    submit: 'Sign up',
    login: 'Sign in',
    success: 'Registration complete! Please check your email to confirm your registration.',
    google_policy: 'This site is protected by reCAPTCHA and the Google <a class="text-white" href="https://policies.google.com/privacy">Privacy Policy</a> and <a class="text-white" href="https://policies.google.com/terms">Terms of Service</a> apply.'
  },
  forgot_password: {
    title: 'Reset password',
    hint: 'Enter account\'s email to reset password.',
    submit: 'Reset',
    login: 'Sign in'
  },
  reset: {
    title: 'Reset password',
    submit: 'Reset',
    bad_link: 'Not a valid password reset link. Please check your email for the password reset link and try again.',
    failure: 'Unable to reset password. Please contact support.',
    success: 'Password successfully changed.'
  },
  verify: {
    title: 'Verify email',
    login: 'Sign in',
    bad_link: 'Not a valid email verification link. Please check your email for the verification link and try again.',
    failure: 'Unable to verify email. Please contact support.',
    success: 'Thanks, your email address is verified.',
    pending: 'Verifying account... please wait...'
  },
  locales: {
    en: 'English',
    fr: 'français'
  },
  main: {
    brand: 'Amber Collect',
    brand_caption: 'Case reporting system',
    logout: 'Sign out',
    lock: 'Lock',
    refresh: 'Refresh',
    refresh_hint: 'Refresh forms',
    info: 'Info',
    info_hint: 'App information',
    source_code: 'Source code',
    contributors: 'Contributors',
    upgrade: 'Upgrade',
    upgrade_available: 'New app version available',
    dashboard: 'Dashboard',
    case_reports: 'Case Reports',
    case_reports_in_progress: 'Case Reports in Progress',
    no_case_reports_in_progress: 'No case reports in progress',
    in_progress: 'In Progress',
    case_report_forms: 'Case Report Forms',
    forms: 'Forms',
    no_case_report_forms: 'No form could be found for reporting cases.',
    essential_links: 'Essential links',
    docs: 'Docs',
    powered_by: 'Powered by',
    show_all_case_reports: 'Show all case reports'
  },
  loading: {
    title: 'Loading',
    caption: 'Please wait...'
  },
  lock: {
    code_placeholder: 'Enter unlock code',
    new_code_placeholder: 'Enter new unlock code',
    repeat_code_placeholder: 'Repeat new unlock code',
    not_matching_codes: 'Unlock codes do not match.',
    incorrect_unclock: 'Unlock code is incorrect.'
  },
  error: {
    account_already_exists: 'This account already exists. Try resetting your password or contact support.',
    create_account_invalid: 'The account information are not valid.',
    create_account: 'There was an error while creating your account. If this issue persists, contact support.',
    update_account: 'There was an error while updating your profile. If this persists, contact support.',
    get_case_report_forms: 'Error when getting case report forms.',
    save_case_report: 'Saving case report failed.',
    save_case_report_error: 'Save error, the case report will be put on hold until the connection is reestablished.',
    network_error: 'Connection error, you are offline.',
    reauthenticate: 'Session expired, please sign-in again.'
  },
  success: {
    create_account: 'Account successfully created. Please check your email to verify your account.',
    update_account: 'Account successfully updated.',
    send_reset_password: 'Password reset sent.',
    reset_password: 'Password reset successful.',
    update_password: 'Password update successful.',
    send_verify_email: 'Email verification sent. Verify new email to update your email address.',
    resend_verify_email: 'Email verification resent.',
    save_case_report: 'Case report saved.'
  },
  record: {
    state: {
      in_progress: 'In progress',
      completed: 'Completed',
      saved: 'Saved'
    },
    delete_record_confirm: 'Please confirm the deletion of the record, all collected data will be lost:',
    delete_saved_record_confirm: 'Please confirm the deletion of the record, all collected data were saved and will not be affected:',
    case_report_form_not_found: 'The case report form that was used to collect these data cannot be found.'
  },
  validations: {
    required: 'Value is required',
    minLength: 'The minimum length required is {min}',
    maxLength: 'The maximum length allowed is {max}',
    email: 'Value is not a valid email address',
    strongPassword: 'Password must contain at least one of each: lower case letter, upper case letter, digit, special character.'
  },
  license: {
    cc_by_40: '[Creative Commons BY 4.0](https://creativecommons.org/licenses/by/4.0/)',
    cc_by_sa_40: '[Creative Commons BY SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)',
    cc_by_nc_40: '[Creative Commons BY NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)',
    cc_by_nc_sa_40: '[Creative Commons BY NC SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)',
    cc_by_nd_40: '[Creative Commons BY ND 4.0](https://creativecommons.org/licenses/by-nd/4.0/)',
    cc_by_nc_nd_40: '[Creative Commons BY NC ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)',
    cc_cc0_10: '[Creative Commons CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)',
    mit: 'MIT license'
  },
  id: 'ID',
  case_report_form: 'Case Report Form',
  form: 'Form',
  revision: 'Revision',
  data: 'Data',
  case_report: 'Case Report',
  email: 'Email',
  email_hint: 'Verifiable email address.',
  password: 'Password',
  password_hint: 'Create a password. 8 characters minimum with lower and upper case, digit and special character.',
  firstname: 'First Name',
  lastname: 'Last Name',
  preferred_language: 'Preferred Language',
  required: 'Required',
  cancel: 'Cancel',
  delete: 'Delete',
  start: 'Start',
  resume: 'Resume',
  view: 'View',
  save: 'Save',
  action: 'Action',
  state: 'State',
  started_at: 'Started: {0}',
  updated_ago: 'Updated {0}',
  close: 'Close',
  go_to: 'Go to...',
  pause: 'Pause',
  previous: 'Previous',
  next: 'Next',
  validate_save: 'Validate and save',
  validation_errors: 'Validation errors: {errors}',
  single_page: 'Single page',
  multi_steps: 'Multiple steps',
  required_field: 'Field is required',
  go_home: 'Go Home',
  nothing_here: 'Oops. Nothing here...',
  github: 'GitHub',
  google: 'Google'
}
