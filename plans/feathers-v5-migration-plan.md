# Feathers v4 to v5 Migration Plan - Amber EDC System

## Migration Overview

**Current State:** Feathers v4.5 with feathers-mongoose, feathers-casl v0.6.0, custom authentication strategies
**Target State:** Feathers v5 with @feathersjs/mongodb, feathers-casl v2.x, updated authentication
**Estimated Effort:** 2-4 weeks for a team of 2-3 developers
**Risk Level:** High - Major architectural changes required

## Phase 1: Preparation & Dependencies (3-5 days)

### 1.1 Create Migration Branch
- Create a dedicated `feat/feathers-v5-migration` branch
- Set up parallel testing environment with v4 and v5
- Document current functionality baseline

### 1.2 Update Core Dependencies
```json
{
  "@feathersjs/authentication": "^5.0.0",
  "@feathersjs/authentication-local": "^5.0.0",
  "@feathersjs/authentication-oauth": "^5.0.0",
  "@feathersjs/configuration": "^5.0.0",
  "@feathersjs/errors": "^5.0.0",
  "@feathersjs/express": "^5.0.0",
  "@feathersjs/feathers": "^5.0.0",
  "@feathersjs/transport-commons": "^5.0.0",
  "@feathersjs/mongodb": "^5.0.0",
  "feathers-casl": "^2.2.2",
  "@casl/ability": "^6.0.0"
}
```

**Note:** Remove `feathers-mongoose` and `mongodb-core` as they're replaced by `@feathersjs/mongodb`.

### 1.3 Update Import Statements
Update all files with new v5 import patterns:

```javascript
// src/app.js - Before
const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const casl = require('feathers-casl');

// src/app.js - After
const { feathers } = require('@feathersjs/feathers');
const express, { json, urlencoded, notFound, errorHandler } = require('@feathersjs/express');
const { feathersCasl } = require('feathers-casl');
```

## Phase 2: Database & Service Migration (5-7 days)

### 2.1 Migrate Database Adapter
**Replace feathers-mongoose with @feathersjs/mongodb:**

```javascript
// src/mongoose.js - Remove this file
// Create src/mongodb.js instead:
const { MongoDBAdapter } = require('@feathersjs/mongodb');

module.exports = function (app) {
  const connection = app.get('mongodb');
  app.set('mongodbClient', connection);
};
```

**Update service classes:**
```javascript
// Before - src/services/user/user.class.js
const { Service } = require('feathers-mongoose');

// After - src/services/user/user.class.js
const { MongoDBService } = require('@feathersjs/mongodb');

exports.User = class User extends MongoDBService {
  constructor(options, app) {
    super(options, app);
  }
};
```

**Update service registrations:**
```javascript
// src/services/user/user.service.js
const options = {
  paginate: app.get('paginate'),
  Model: app.get('mongodbClient').then(db => db.collection('users')),
  filters: { $nor: true },
  operators: ['$nor', '$and', '$regex']
};
```

### 2.2 Convert Whitelist to Filters/Operators
Update all services with `whitelist` options:

```javascript
// Before
whitelist: ['$nor', '$and', '$regex']

// After
filters: { $nor: true },
operators: ['$nor', '$and', '$regex']
```

### 2.3 Update Model Creation
Convert Mongoose models to MongoDB collections:

```javascript
// src/models/user.model.js - Before
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const user = new mongooseClient.Schema({...});
  return mongooseClient.model('User', user);
};

// src/models/user.model.js - After (if needed)
// MongoDB collections are now handled directly in service options
// Models can be simplified or removed if not needed
```

## Phase 3: Authentication Migration (3-4 days)

### 3.1 Update Authentication Imports
```javascript
// src/authentication.js - Update imports
const { AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');
const { expressOauth } = require('@feathersjs/authentication-oauth');
```

### 3.2 Migrate Custom Strategies
Update custom authentication strategies to extend v5 base classes:

```javascript
// src/utils/auth-strategies.js - Update base class imports
const { AuthenticationBaseStrategy } = require('@feathersjs/authentication/lib');
const { LocalStrategy } = require('@feathersjs/authentication-local');
```

### 3.3 Update Authentication Registration
```javascript
// src/authentication.js - Update service creation
const authentication = new AuthenticationService(app);
authentication.register('jwt', new JWTStrategy());
authentication.register('local', new ActiveLocalStrategy());
```

## Phase 4: Authorization Migration (2-3 days)

### 4.1 Upgrade feathers-casl to v2.x
**Major version upgrade with breaking changes:**

```javascript
// src/app.js - Update casl configuration
// Before
const casl = require('feathers-casl');
app.configure(casl());

// After
const { feathersCasl } = require('feathers-casl');
app.configure(feathersCasl());
```

### 4.2 Update CASL from v5 to v6
Update ability definitions to use CASL v6 syntax. The main changes involve ability builder methods.

### 4.3 Update Authorization Hooks
```javascript
// Update all authorize hook calls
// Before
authorize({ adapter: 'feathers-mongoose' })

// After
authorize({ adapter: 'mongodb' })
```

**Temporary Simplification Option:** If access controls are complex, consider temporarily disabling detailed authorization during migration and re-enable post-migration.

## Phase 5: Configuration & Middleware (2-3 days)

### 5.1 Update Express Configuration
```javascript
// src/app.js - Update middleware setup
app.use(json({limit: '25mb'}));
app.use(urlencoded({ limit: '25mb', extended: true }));

// Ensure rest() comes after json() and urlencoded()
app.configure(express.rest());
```

### 5.2 Update Configuration Handling
Remove automatic environment variable substitution and use explicit configuration:

```javascript
// config/custom-environment-variables.json (new file)
{
  "mongodb": "MONGODB_URL",
  "authentication.secret": "APP_SECRET_KEY"
}
```

### 5.3 Convert to Async Setup
```javascript
// src/app.js - Update setup calls
// Before
app.listen(3030);

// After
app.listen(3030).then((server) => {
  // Server started
});
```

## Phase 6: Testing & Validation (3-5 days)

### 6.1 Update Test Suite
- Update test imports to use new v5 patterns
- Fix authentication tests for new strategy APIs
- Update service tests for new database adapter
- Validate all CRUD operations work correctly

### 6.2 Validate Core Functionality
- User authentication and registration
- Service CRUD operations
- File uploads and exports
- Real-time functionality (if used)
- API key authentication
- OAuth flows

### 6.3 Performance Testing
- Database query performance with new adapter
- Memory usage with new service architecture
- Authentication performance

## Phase 7: Deployment & Rollback (2-3 days)

### 7.1 Environment Setup
- Update Docker configurations for new dependencies
- Update deployment scripts
- Configure environment variables for new config system

### 7.2 Rollback Plan
- Maintain v4 deployment capability during transition
- Database schema compatibility verification
- Feature flag system for gradual rollout

### 7.3 Documentation Updates
- Update README with new dependency requirements
- Update API documentation for any changed endpoints
- Update deployment guides

## Risk Mitigation

### High-Risk Areas:
1. **Database Migration:** MongoDB schema must remain compatible
2. **Custom Authentication:** All 5 custom strategies need careful migration
3. **Authorization:** feathers-casl v2.x has significant API changes
4. **Real-time Features:** Channel functionality may be affected

### Contingency Plans:
- **Database:** Test extensively with production-like data
- **Auth:** Maintain v4 authentication as backup during transition
- **AuthZ:** Temporarily simplify permissions if needed
- **Channels:** Disable real-time features during initial deployment

## Success Criteria

- All existing functionality works with Feathers v5
- MongoDB schema unchanged and compatible
- All authentication strategies preserved
- Test suite passes (updated for v5)
- Performance meets or exceeds v4 levels
- Deployment successful in staging environment

## Timeline Summary

- **Phase 1:** 3-5 days (Preparation)
- **Phase 2:** 5-7 days (Database & Services)
- **Phase 3:** 3-4 days (Authentication)
- **Phase 4:** 2-3 days (Authorization)
- **Phase 5:** 2-3 days (Configuration)
- **Phase 6:** 3-5 days (Testing)
- **Phase 7:** 2-3 days (Deployment)

**Total: 20-30 days** depending on team size, complexity of custom code, and testing thoroughness.

## Key Considerations

- **MongoDB Schema:** Must remain unchanged as requested
- **Authentication Strategies:** All 5 custom strategies (Anonymous, ActiveLocal, ApiKey, Participant, WalkInParticipant) must be preserved
- **Access Controls:** Can be temporarily simplified during migration if it reduces complexity
- **Backward Compatibility:** Plan includes rollback options and gradual migration approach