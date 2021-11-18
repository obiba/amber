// form-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'form';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const FormSchema = new Schema({
    items: { type: [Object] },  // the form schema definition per items
    i18n: { type: Object },     // the translation keys, by language
    data: { type: Object }      // item options, data initialization
  });
  const schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: false },
    createdBy: { type: mongooseClient.Schema.Types.ObjectId, ref: 'user', required: true },
    study: { type: Schema.Types.ObjectId, ref: 'study' },
    schema: { type: FormSchema, default: {}}
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
