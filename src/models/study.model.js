// study-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'study';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const PopulationSchema = new Schema({ 
    name: { type: String, required: true, default: 'baseline' }
  });
  const schema = new Schema({
    name: { type: String, required: true },
    createdBy: { type: mongooseClient.Schema.Types.ObjectId, ref: 'user', required: true },
    populations: { type: [PopulationSchema], default: {}}
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
