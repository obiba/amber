import { defineStore } from "pinia";
import { useAuth } from "feathers-pinia";
import { api } from "../boot/axios";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const { client } = useFeathers();
    const auth = useAuth({ api: client, servicePath: "user" });
    if (auth.isAuthenticated) auth.reAuthenticate();

    async function getOAuthProviders() {
      const response = await api.get('/auth/providers')
      return response.data
    }

    return {
      ...auth,
      getOAuthProviders
    };
  },
  { persist: true }
);
