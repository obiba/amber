import { createPiniaClient } from "feathers-pinia";
import { pinia } from "./modules/pinia";
import rest from "@feathersjs/rest-client";
import { axios } from "./boot/axios";
import feathers from "@feathersjs/feathers";
import auth from "@feathersjs/authentication-client";
import { iff, discard } from "feathers-hooks-common";

const appEnv = window.env;
const restClient = rest(appEnv.AMBER_URL);

export const feathersClient = feathers()
  .configure(restClient.axios(axios))
  .configure(auth({ storage: window.localStorage }))
  .hooks({
    before: {
      all: [
        iff(
          (context) => ["create", "update", "patch"].includes(context.method),
          discard("__id", "__isTemp", "__v")
        ),
      ],
    },
    after: {
      all: [
        // context => console.debug(context)
      ],
    },
  });

export const api = createPiniaClient(feathersClient, {
  pinia,
  storage: window.localStorage,
  idField: "_id",
  whitelist: ["$regex"],
  paramsForServer: [],
});
