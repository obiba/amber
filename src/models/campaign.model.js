// campaign-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'campaign';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: false },
    investigators: [{ type: mongooseClient.Schema.Types.ObjectId, ref: 'user', required: true }],
    validFrom: { type: Date },    // notifications and participants are enabled from provided date, optional
    validUntil: { type: Date },   // notifications and participants are enabled until provided date, optional
    weeksBetweenReminders: { type: Number, default: 2 },  // number of weeks to wait between invitation reminders
    numberOfReminders: { type: Number, default: 2 },
    weeksToDeactivate: { type: Number, default: 18 },     // number of weeks from initial contact after which a participant is deactivated
    withPassword: { type: Boolean, default: false }, // whether participants are asked to set a password at first connection
    createdBy: { type: mongooseClient.Schema.Types.ObjectId, ref: 'user', required: true },
    interviewDesign: { type: Schema.Types.ObjectId, ref: 'interview-design', required: true },
    study: { type: Schema.Types.ObjectId, ref: 'study', required: true },
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
