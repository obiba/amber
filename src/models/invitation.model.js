// invitation-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'invitation';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    code: { type: String, required: true },
    password: { type: String },
    createdBy: { type: mongooseClient.Schema.Types.ObjectId, ref: 'user', required: true },
    study: { type: Schema.Types.ObjectId, ref: 'study', required: true },
    campaign: { type: Schema.Types.ObjectId, ref: 'campaign', required: true }
  }, {
    timestamps: true
  });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);
  
};
