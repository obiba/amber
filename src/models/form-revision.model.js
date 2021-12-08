// form-revision-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'formRevision';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  // basically same schema as a form + revision
  const FormSchema = new Schema({
    name: { type: String, required: true, default: '.' },
    label: { type: String, required: true, default: 'form_title' },
    description: { type: String, required: false },
    items: { type: [Object] },  // the form schema definition per items
    i18n: { type: Object },     // the translation keys, by language
  });
  const schema = new Schema({
    publishedBy: { type: mongooseClient.Schema.Types.ObjectId, ref: 'user', required: true },
    study: { type: Schema.Types.ObjectId, ref: 'study' },
    form: { type: Schema.Types.ObjectId, ref: 'form' },
    schema: { type: FormSchema, default: {}},
    revision: { type: Number, required: false },
    comment: { type: String, required: false }
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
