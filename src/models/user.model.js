// user-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'user';
  const mongooseClient = app.get('mongooseClient');
  const schema = new mongooseClient.Schema({
  
    email: { type: String, unique: true, lowercase: true },
    password: { type: String },
    firstname: { type: String },
    lastname: { type: String },
    language: { type: String, default: 'en' },
    institution: { type: String },
    department: { type: String },
    title: { type: String },
    city: { type: String },
    permissions: { type: Array, default: [] },
    role: { type: String, default: 'guest' },
    phone: { type: String },
    passwordReset: { type: String },
    passwordResetToken: { type: String },
    lastLoggedIn: { type: Date },
    lastSeen: { type: Date },
    isVerified: { type: Boolean },
    verifyToken: { type: String },
    verifyShortToken: { type: String },
    verifyLongToken: { type: String },
    verifyExpires: { type: Date },
    verifyChanges: { type: Object },
    resetToken: { type: String },
    resetExpires: { type: Date },
    clientId: { type: String },
    
    googleId: { type: String },
    githubId: { type: String },
  
  }, {
    timestamps: true
  });

  schema.index({ email: 1, type: -1 }); // schema level

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);

};
