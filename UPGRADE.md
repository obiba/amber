# Upgrade

## Upgrading to 3.0.0

### Interview step actions cleanup

The interview step actions now record the step state changes only: `init` when the step is first saved, `pause` when the step is paused, `complete` when the step is completed (and `reopen`, `invalid`). Before, every intermediate save of a step was recorded as `pause`, `init` was never recorded and a completed step could be recorded as `complete` more than once.

The actions recorded before can be cleaned with the script [api/scripts/cleanup-interview-actions.js](api/scripts/cleanup-interview-actions.js), to be run once the new version of the API and of Amber Visit are deployed. For each interview step, it:

* keeps only the last `pause` of each series of consecutive `pause` (a real pause in the middle of a series cannot be told from an intermediate save),
* removes the `complete` that follow a `complete`,
* adds the `init` action, with the time of the first action.

The steps whose actions start with `init` are left as is, so the script can be run more than once. Only the actions are modified, they are not encrypted.

Requirement: [mongosh](https://www.mongodb.com/docs/mongodb-shell/), with the same MongoDB URL as the API's `MONGODB_URL`.

1. Backup the interviews:

   ```bash
   mongodump --uri "mongodb://localhost:27017/amber" --collection interviews --out ./backup-interviews
   ```

2. Dry run, to report the changes without applying them:

   ```bash
   cd api
   DRY_RUN=true mongosh "mongodb://localhost:27017/amber" scripts/cleanup-interview-actions.js
   ```

3. Run the cleanup:

   ```bash
   mongosh "mongodb://localhost:27017/amber" scripts/cleanup-interview-actions.js
   ```

   It reports, for instance: `55 interviews cleaned, 242 actions removed (init added)`.

With authentication, the URL is like `mongodb://USER:PWD@HOST:27017/amber?authSource=admin`.

When MongoDB runs in a Docker container (named `mongo` here), the script can be copied and run in it:

```bash
docker cp api/scripts/cleanup-interview-actions.js mongo:/tmp/
docker exec -e DRY_RUN=true mongo mongosh "mongodb://USER:PWD@localhost:27017/amber?authSource=admin" /tmp/cleanup-interview-actions.js
```

Remove `-e DRY_RUN=true` to apply the changes.

To restore the backup:

```bash
mongorestore --uri "mongodb://localhost:27017/amber" --drop ./backup-interviews
```
