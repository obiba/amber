# Amber

Electronic Data Capture system.

| Folder | Description | Docker image |
|---|---|---|
| [api](api) | Amber server (REST API) | `obiba/amber` |
| [studio](studio) | Amber Studio, for managing studies and forms | `obiba/amber-studio` |
| [collect](collect) | Amber Collect, data collection (PWA) | `obiba/amber-collect` |
| [visit](visit) | Amber Visit, interview data collection | `obiba/amber-visit` |

## Versioning

All apps share the same version:

```sh
make version          # show versions
make bump v=2.2.0     # or v=patch|minor|major
make tag              # commit and tag, then: git push --follow-tags
```

Publishing a GitHub release builds and pushes all Docker images.

## Local development

`docker-compose.yml` builds all apps from this repo and runs them with MongoDB:

```sh
make up      # docker compose up -d --build
make logs
make down
```

| App | URL |
|---|---|
| api | http://localhost:3030 |
| studio | http://localhost:3080 |
| collect | http://localhost:3090 |
| visit | http://localhost:3070 |
| mongo | localhost:27017 (set `MONGO_PORT` to change) |

Administrator: `admin@example.org` / `Password123!`. Override any variable in a `.env` file at the repo root.
