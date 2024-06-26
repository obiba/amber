// task-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'task';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const logSchema = new Schema({
    level: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, required: true }
  });
  const schema = new Schema({
    type: { type: String, enum: ['participants-info-activate', 'participants-activate', 'participants-reminder', 'participants-info-expire', 'participants-deactivate', 'participants-summary'], required: true },
    state: { type: String, enum: ['in_progress', 'completed', 'aborted'], required: true, default: 'in_progress' },
    error: { type: String },
    message: { type: String },
    logs: [logSchema],
    arguments: { type: Object, required: false },
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
