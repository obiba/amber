import { api } from "../feathers-client";
import { pinia } from "../modules/pinia";

export default ({ app }) => {
  app.use(pinia);
  app.use(api);
};
