// interview-forms-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'interviewForms';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const permissionsSchema = new Schema({
    users: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    groups: [{ type: Schema.Types.ObjectId, ref: 'group' }]
  });
  const stepSchema = new Schema({
    form: { type: Schema.Types.ObjectId, ref: 'form', required: true },
    revision: { type: Number, required: false },
  });
  const schema = new Schema({
    name: { type: String, required: true, default: '.' },
    description: { type: String, required: false },
    createdBy: { type: mongooseClient.Schema.Types.ObjectId, ref: 'user', required: true },
    study: { type: Schema.Types.ObjectId, ref: 'study', required: true },
    steps: [{ type: stepSchema }],
    state: { type: String, enum: ['active', 'paused'], default: 'paused' },
    repeatPolicy: { type: String, enum: ['single_reject', 'single_update', 'multiple'], default: 'single_reject' },
    permissions: { type: permissionsSchema }
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
