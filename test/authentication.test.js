const assert = require('assert');

// Disable OTP for testing
process.env.OTP_TIMEOUT = '0';

const app = require('../src/app');

describe('authentication', () => {
  // Wait for MongoDB connection before all tests
  before(async () => {
    await app.get('mongodbClient');
  });

  it('registered the authentication service', () => {
    assert.ok(app.service('authentication'));
  });
  
  describe('local strategy', () => {
    const userInfo = {
      email: 'admin@obiba.com',
      password: 'Password1#',
      firstname: 'Xx',
      lastname: 'Yy',
      language: 'en',
      role: 'administrator',
      with2fa: false
    };

    before(async () => {
      // Delete user if exists, then create fresh
      try {
        const users = await app.service('user').find({ query: { email: userInfo.email } });
        if (users.data && users.data.length > 0) {
          await app.service('user').remove(users.data[0]._id);
        }
      } catch {
        // Ignore errors during cleanup
      }
      
      // Create the test user
      await app.service('user').create(userInfo);
    });

    it('authenticates user and creates accessToken', async () => {
      const result = await app.service('authentication').create({
        strategy: 'local',
        email: userInfo.email,
        password: userInfo.password
      });
      
      assert.ok(result.accessToken, 'Created access token for user');
      assert.ok(result.user, 'Includes user in authentication data');
    });
  });
});
