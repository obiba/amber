const NON_PROVIDER_KEYS = new Set(['redirect', 'origins', 'defaults']);

module.exports = function (app) {
  // Public endpoint that lists configured OAuth/OIDC providers.
  // Client login pages use this to decide which social login buttons to show.
  app.get('/auth/providers', (req, res) => {
    const oauth = app.get('authentication').oauth || {};
    const providers = Object.keys(oauth).filter(k => !NON_PROVIDER_KEYS.has(k) && !k.startsWith('_'));
    res.json({ providers });
  });
};
