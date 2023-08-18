// interview-design-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'interviewDesign';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const permissionsSchema = new Schema({
    users: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    groups: [{ type: Schema.Types.ObjectId, ref: 'group' }]
  });
  const stepSchema = new Schema({
    name: { type: String, required: true },
    label: { type: String, required: true, default: 'step_title' },
    description: { type: String, required: false },
    time_estimate: { type: Number, required: false }, // time estimate for completing the step, in minutes
    form: { type: Schema.Types.ObjectId, ref: 'form', required: true },
    revision: { type: Number, required: false },
    condition: { type: String, required: false }, // js expression, visibility condition
    disable: { type: String, required: false },   // js expression, when visible disable/enable
  });
  const schema = new Schema({
    name: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, required: false },
    interviewer_instructions: { type: String, required: false },
    participant_instructions: { type: String, required: false },
    createdBy: { type: mongooseClient.Schema.Types.ObjectId, ref: 'user', required: true },
    study: { type: Schema.Types.ObjectId, ref: 'study', required: true },
    steps: [{ type: stepSchema }],
    i18n: { type: Object, default: {} }, // the translation keys, by language
    state: { type: String, enum: ['active', 'paused'], default: 'paused' },
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
