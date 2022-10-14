// case-report-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'caseReport';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const ActionSchema = new Schema({
    type: { type: String, enum: ['init', 'pause', 'complete'], default: 'complete' },
    user: { type: String },
    timestamp: { type: Number }
  });
  const schema = new Schema({
    createdBy: { type: mongooseClient.Schema.Types.ObjectId, ref: 'user', required: true },
    caseReportForm: { type: Schema.Types.ObjectId, ref: 'case-report-form', required: true },
    study: { type: Schema.Types.ObjectId, ref: 'study', required: true },
    form: { type: Schema.Types.ObjectId, ref: 'form', required: true },
    revision: { type: Number, required: true },
    state: { type: String, enum: ['in_progress', 'completed'], default: 'completed' },
    actions: [ActionSchema],
    data: { type: Object, required: true, default: {} }
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
