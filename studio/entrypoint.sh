#!/bin/bash

# the goal of this script is to inject environment variables into the frontend
# by creating a javascript file that will be injected in the boot file
WWW_DIR=/usr/share/nginx/html
ENV_PATH="${WWW_DIR}/env.js"
# Create the file
echo -n "window.env = {" > "${ENV_PATH}"
COMMA=""
for envrow in $(printenv); do
  IFS='=' read -r key value <<< "${envrow}"
  case "${key}" in
    "AMBER_URL" | "RECAPTCHA_SITE_KEY" | "PATH_PREFIX")
      echo -n "${COMMA}" >> "${ENV_PATH}"
      echo -n "${key}: '${value}'" >> "${ENV_PATH}"
      COMMA=","
      ;;
    *)
      # ignore the key
      ;;
  esac
done
echo "};" >> "${ENV_PATH}"

# apply PATH_PREFIX to nginx template
PATH_PREFIX=${PATH_PREFIX:-/}
# make sure PATH_PREFIX ends with /
if [[ "${PATH_PREFIX}" != */ ]]; then
  PATH_PREFIX="${PATH_PREFIX}/"
fi
export PATH_PREFIX
envsubst '${PATH_PREFIX}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# remove the settings link of a previous run, otherwise cp would write through it
rm -f "${WWW_DIR}/settings.json"

# public files initialization
if [ -d /app/public ]; then
  cp -r /app/public/* /usr/share/nginx/html/
fi

# settings file is linked (not copied), so that its modifications apply without restart
for f in /app/settings.json /app/public/settings.json; do
  if [ -f "${f}" ]; then
    ln -sf "${f}" "${WWW_DIR}/settings.json"
    break
  fi
done

# execute the web server
exec nginx -g 'daemon off;'