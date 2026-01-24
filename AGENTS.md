# AGENTS.md - Amber EDC Development Guidelines

Guidelines for AI coding agents working on Amber, an Electronic Data Capture system built with Feathers.js v4.5.

## Technology Stack

- **Runtime**: Node.js >=16.14.0 | **Database**: MongoDB + Mongoose
- **Framework**: Feathers.js v4.5 | **Auth**: JWT + CASL | **Validation**: Joi
- **Testing**: Mocha | **Linting**: ESLint

## Build, Lint, and Test Commands

```bash
npm test                    # Run linting + all tests
npm run lint                # ESLint only (src/ and test/)
npm run mocha               # All tests only
npm run dev                 # Development server with nodemon
npm start                   # Production server
```

### Running Single Tests

```bash
# Single test file
npm run mocha test/services/user.test.js

# Pattern matching
npm run mocha test/services/*.test.js

# Grep filter
npm run mocha -- --grep "authentication"
```

## Code Style Guidelines

### Formatting (ESLint enforced)

- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Always required
- **Line endings**: Unix (LF)

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files/directories | kebab-case | `interview-design.service.js` |
| Variables/functions | camelCase | `getUserById` |
| Classes | PascalCase | `InterviewService` |
| Constants | UPPER_CASE | `MAX_RETRIES` |
| Database fields | camelCase | `createdAt` |

### Import Order

```javascript
// 1. Node.js built-ins
// 2. External packages
const Joi = require('@hapi/joi');
const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;

// 3. Internal modules (relative imports)
const makeAbilities = require('../../hooks/make-abilities');
const { hashPassword } = require('../../utils/password-hasher');
```

## Service Architecture

Each service has four files in `src/services/service-name/`:

```
service-name.service.js    # Service registration
service-name.class.js      # Service class implementation
service-name.hooks.js      # Before/after/error hooks
service-name.abilities.js  # CASL abilities definitions
```

### Hooks Structure Pattern

```javascript
module.exports = {
  before: {
    all: [],
    find: [authenticate('jwt'), makeAbilities(defineAbilitiesFor), authorize({ adapter: 'feathers-mongoose' })],
    get: [authenticate('jwt'), makeAbilities(defineAbilitiesFor), authorize({ adapter: 'feathers-mongoose' })],
    create: [/* validation, authorization */],
    update: [/* validation, authorization */],
    patch: [/* validation, authorization */],
    remove: [authenticate('jwt'), makeAbilities(defineAbilitiesFor), authorize({ adapter: 'feathers-mongoose' })]
  },
  after: {
    all: [/* data protection */],
    find: [authorize({ adapter: 'feathers-mongoose' })],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },
  error: { all: [] }
};
```

## Validation with Joi

```javascript
const Joi = require('@hapi/joi');
const validate = require('@feathers-plus/validate-joi');

const schema = Joi.object().keys({
  email: Joi.string().email({ minDomainSegments: 2 }).required(),
  firstname: Joi.string().trim().min(2).max(30).required(),
  password: Joi.string().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,64}$/).required()
});

// In hooks: validate.mongoose(schema, { convert: true, abortEarly: false })
```

## Authorization with CASL

```javascript
const { AbilityBuilder, createAliasResolver, makeAbilityFromRules } = require('feathers-casl');

const resolveAction = createAliasResolver({
  update: 'patch',
  read: ['get', 'find'],
  delete: 'remove'
});

const defineRulesFor = (user) => {
  const { can, cannot, rules } = new AbilityBuilder();
  if (user.role === 'administrator') {
    can('manage', 'all');
    cannot('delete', 'user', { _id: user._id });
  } else {
    can('read', 'user', { _id: user._id });
    can('update', 'user', { _id: user._id });
  }
  return rules;
};

module.exports = { defineAbilitiesFor: (user) => makeAbilityFromRules(defineRulesFor(user), { resolveAction }) };
```

## Error Handling

```javascript
const { BadRequest, NotFound, Forbidden } = require('@feathersjs/errors');

// Use Feathers errors for API responses
throw new BadRequest('Invalid input data');
throw new NotFound('Resource not found');
throw new Forbidden('Insufficient permissions');

// Async hooks with try-catch
const myHook = async context => {
  try {
    await someAsyncOperation(context);
    return context;
  } catch (error) {
    throw new BadRequest('Operation failed', { error: error.message });
  }
};
```

## Testing Patterns

```javascript
const assert = require('assert');
const app = require('../../src/app');

describe('\'service-name\' service', () => {
  it('registered the service', () => {
    const service = app.service('service-name');
    assert.ok(service, 'Registered the service');
  });

  it('creates a valid record', async () => {
    const data = { /* test data */ };
    const result = await app.service('service-name').create(data);
    assert.ok(result._id);
  });
});
```

## Key Environment Variables

- `MONGODB_URL` - Database connection string
- `APP_SECRET_KEY` - Encryption key
- `JWT_SECRET` - JWT signing secret
- `ENCRYPT_DATA` - Enable participant data encryption
- `LOG_LEVEL` - Logging verbosity

## Security Checklist

- Use `protect` hook to hide sensitive fields (password, tokens)
- Always validate input with Joi schemas
- Require JWT authentication for protected endpoints
- Use CASL abilities for fine-grained permissions
- Encrypt sensitive data when `ENCRYPT_DATA=true`

## Common Hook Utilities

```javascript
const { discard, iff, isProvider, preventChanges } = require('feathers-hooks-common');
const { protect } = require('@feathersjs/authentication-local').hooks;

// Conditional hooks
iff(isProvider('external'), preventChanges(true, 'sensitiveField'))

// Protect sensitive data in responses
protect('password', 'verifyToken', 'totp2faSecret')
```

**Always run `npm test` before committing changes.**
