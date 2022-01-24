// case-report-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'caseReportForm';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const permissionsSchema = new Schema({
    users: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    groups: [{ type: Schema.Types.ObjectId, ref: 'group' }]
  });
  const schema = new Schema({
    createdBy: { type: mongooseClient.Schema.Types.ObjectId, ref: 'user', required: true },
    study: { type: Schema.Types.ObjectId, ref: 'study', required: true },
    form: { type: Schema.Types.ObjectId, ref: 'form', required: true },
    revision: { type: Number, required: false },
    state: { type: String, enum: ['active', 'paused'], default: 'paused' },
    private: { type: Boolean, default: false },
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
