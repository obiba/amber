// This is just an example,
// so you can safely delete all default props below

export default {
  login: {
    title: 'Identifiez vous pour commencer une session',
    submit: 'Connexion',
    forgot_password: 'Mot de passe oublié ?',
    register: 'Enregistrement',
    validate: 'Valider',
    token: 'Jeton à 6 chiffres',
    totp: 'Scanner ce code QR avec une app d\'authentification multifacteur (Microsoft authenticator est recommandée), puis entrer le jeton temporaire indiqué.',
    totp_secret: 'Ou copier ce code secret à ajouter manuellement à l\'application d\'authentification multifacteur.',
    email_otp: 'Ou envoyer le jeton temporaire à votre adresse courriel.',
    send_email_token: 'Envoyer le jeton',
    secret_copied: 'Code secret copié.',
    failed: 'Combinaison courriel/mot de passe incorrecte.',
    failed_token: 'Jeton incorrect.',
    continue_with: 'Ou continuer avec'
  },
  register: {
    title: 'Créer un compte',
    submit: 'S\'enregister',
    login: 'Connexion',
    success: 'Enregistrement effectué ! Veuillez vérifier votre corriel pour confirmer l\'enregistrement.',
    google_policy: 'Ce site est protégé par reCAPTCHA et <a class="text-white" href="https://policies.google.com/privacy">la politique de confidentialité</a> et <a class="text-white" href="https://policies.google.com/terms">les conditions d\'utilisation</a> de Google s\'appliquent.'
  },
  forgot_password: {
    title: 'Réinitialiser le mot de passe',
    hint: 'Entrer le courriel du compte pour réinitialiser le mot de passe.',
    submit: 'Réinitialiser',
    login: 'Connexion'
  },
  reset: {
    title: 'Réinitialisation du mot de passe',
    submit: 'Réinitialiser',
    bad_link: 'Ce lien de réinitialisation n\'est pas valide. Veuillez vérifier votre courriel et essayer de nouveau.',
    failure: 'Le changement de mot a échoué. Veuillez contacter le support.',
    success: 'Mot de passe changé avec succés.'
  },
  verify: {
    title: 'Vérification du courriel',
    login: 'Connexion',
    bad_link: 'Ce lien de vérification n\'est pas valide. Veuillez vérifier ce lien et essayer de nouveau.',
    failure: 'La vérification du courriel a échoué. Veuillez contacter le support.',
    success: 'Merci, votre adresse courriel est vérifiée.',
    pending: 'Vérification en cours... merci de patienter...'
  },
  locales: {
    en: 'English',
    fr: 'français'
  },
  main: {
    brand: 'Amber Collect',
    brand_caption: 'Système de rapport de cas',
    logout: 'Déconnexion',
    lock: 'Verrouiller',
    refresh: 'Rafraîchir',
    refresh_hint: 'Rafraîchir les formulaires',
    info: 'Info',
    info_hint: 'A propos de l\'app',
    source_code: 'Code source',
    contributors: 'Contributeurs',
    upgrade: 'Mise à jour',
    upgrade_available: 'Nouvelle version de l\'app disponible',
    dashboard: 'Tableau de bord',
    case_reports: 'Rapports de cas',
    case_reports_in_progress: 'Rapports de cas en cours',
    no_case_reports_in_progress: 'Aucun rapport de cas en cours',
    in_progress: 'En cours',
    case_report_forms: 'Formulaires de rapport de cas',
    forms: 'Formulaires',
    no_case_report_forms: 'Aucun formulaire n\'a été trouvé.',
    essential_links: 'Liens utiles',
    docs: 'Docs',
    chat: 'Chat',
    powered_by: 'Propulsé par',
    show_all_case_reports: 'Voir tous les rapports de cas'
  },
  loading: {
    title: 'Chargement',
    caption: 'Veuillez patienter...'
  },
  lock: {
    code_placeholder: 'Code de déverrouillage',
    new_code_placeholder: 'Nouveau code de déverrouillage',
    repeat_code_placeholder: 'Répéter le code de déverrouillage',
    not_matching_codes: 'Les codes de déverrouillage ne correspondent pas.',
    incorrect_unclock: 'Le code de déverrouillage est incorrect.'
  },
  error: {
    account_already_exists: 'Ce compte existe déjà. Essayez de réinitialiser votre mot de passe ou contactez le support.',
    create_account_invalid: 'Les informations du compte ne sont pas valides.',
    create_account: 'Erreur à la creation du compte. Si ce problème persiste, contacter le support.',
    update_account: 'Erreur à la mise à jour du compte. Si ce problème persiste, contacter le support.',
    get_case_report_forms: 'Erreur à la récupération des formulaires de rapport de cas.',
    save_case_report: 'La sauvegarde du rapport de cas a échoué.',
    save_case_report_error: 'La sauvegarde du rapport de cas a échoué. Une nouvelle tentative sera effectuée au rétablissement de la connexion.',
    network_error: 'Erreur de connection, vous êtes hors ligne.',
    reauthenticate: 'Session expirée, veuillez vous identifier de nouveau.'
  },
  success: {
    create_account: 'Compte créé avec succès. Un courriel de vérification d\'adresse a été envoyé.',
    update_account: 'Compte mise à jour avec succès.',
    send_reset_password: 'Demande de réinitialisation de mot de passe envoyée.',
    reset_password: 'Mot de passe réinitialisé avec succès.',
    update_password: 'Mot de passe mis à jour avec succès.',
    send_verify_email: 'Courriel de vérification pour la nouvelle adresse envoyé.',
    resend_verify_email: 'Courriel de vérification envoyé.',
    save_case_report: 'Rapport de cas sauvegardé.'
  },
  record: {
    state: {
      in_progress: 'En cours',
      completed: 'Complété',
      saved: 'Sauvegardé'
    },
    delete_record_confirm: 'Veuillez confirmer la suppression de cet enregistrement, toutes les données collectées seront perdues:',
    delete_saved_record_confirm: 'Veuillez confirmer la suppression de cet enregistrement, toutes les données collectées ont été sauvegardées et ne seront pas affectées:',
    case_report_form_not_found: 'Le formulaire de rapport de cas ayant été utilisé pour collecter ces données est manquant.'
  },
  validations: {
    required: 'Une valeur est requise',
    minLength: 'Ce champ doit faire au moins {min} charactères',
    maxLength: 'Ce champ peut faire au maximum {max} charactères',
    email: 'Adresse courriel non valide',
    strongPassword: 'Le mot de passe de passe doit avoir au moins un caractère pour chaque type : minuscule, majuscule, chiffre, caractère spécial.'
  },
  license: {
    cc_by_40: '[Creative Commons BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fr)',
    cc_by_sa_40: '[Creative Commons BY SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr)',
    cc_by_nc_40: '[Creative Commons BY NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.fr)',
    cc_by_nc_sa_40: '[Creative Commons BY NC SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr)',
    cc_by_nd_40: '[Creative Commons BY ND 4.0](https://creativecommons.org/licenses/by-nd/4.0/deed.fr)',
    cc_by_nc_nd_40: '[Creative Commons BY NC ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.fr)',
    cc_cc0_10: '[Creative Commons CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.fr)',
    mit: 'Licence MIT'
  },
  id: 'ID',
  case_report_form: 'Formulaire de rapport de cas',
  form: 'Formulaire',
  revision: 'Version',
  data: 'Données',
  case_report: 'Rapport de cas',
  email: 'Courriel',
  email_hint: 'Adresse courriel vérifiable.',
  password: 'Mot de passe',
  password_hint: 'Créer un mot de passe de 8 caractères au minimum avec majuscule et minuscule, chiffre et caractère spécial.',
  firstname: 'Prénom',
  lastname: 'Nom de famille',
  preferred_language: 'Langue préférée',
  required: 'Requis',
  cancel: 'Annuler',
  delete: 'Supprimer',
  start: 'Commencer',
  resume: 'Reprendre',
  view: 'Voir',
  save: 'Sauvegarder',
  action: 'Action',
  state: 'État',
  started_at: 'Démarré: {0}',
  updated_ago: 'Mis à jour {0}',
  close: 'Fermer',
  go_to: 'Aller à...',
  pause: 'Pause',
  previous: 'Précédent',
  next: 'Suivant',
  validate_save: 'Valider et sauvegarder',
  validation_errors: 'Erreurs de validation: {errors}',
  single_page: 'Une seule page',
  multi_steps: 'Étapes multiples',
  required_field: 'Le champ est requis',
  go_home: 'Retour à l\'accueil',
  nothing_here: 'Il n\'y a rien ici...',
  github: 'GitHub',
  google: 'Google'
}
