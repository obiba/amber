const { Service } = require('feathers-mongodb');

exports.Study = class Study extends Service {
  constructor(options, app) {
    super(options);
    
    app.get('mongoClient').then(db => {
      this.Model = db.collection('study');
    });
  }
};
