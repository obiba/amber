// participant-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'participant';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const ReminderSchema = new Schema({
    type: { type: String, enum: ['participants-reminder', 'participants-info-expire'] },
    date: { type: Date }
  });
  const schema = new Schema({
    code: { type: String, required: true }, // personal invitation code
    password: { type: String },   // personal secret
    identifier: { type: String }, // id of the participant in the context of the study, optional
    validFrom: { type: Date },    // participant is enabled from provided date, optional
    validUntil: { type: Date },   // participant is enabled until provided date, optional
    initialContact: { type: Date },
    reminders: [{ type: ReminderSchema }],
    activated: { type: Boolean, default: true }, // can be (de)activated temporarily
    lastSeen: { type: Date }, // last authentication by the participant (not on behalf of the interviewer)
    initAt: { type: Date },   // last authentication by the participant (not on behalf of the interviewer)
    data: { type: Object, required: true, default: {} }, // personal data
    createdBy: { type: mongooseClient.Schema.Types.ObjectId, ref: 'user', required: true },
    study: { type: Schema.Types.ObjectId, ref: 'study', required: true },
    interviewDesign: { type: Schema.Types.ObjectId, ref: 'interview-design', required: true },
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
