import { makeFileQueue, makeIndexedDBStore } from "@obiba/quasar-ui-amber";
import { api } from "./boot/axios";

const store = makeIndexedDBStore();

// the Authorization header of the participant or interviewer, set by the interview store
let authHeaders = async () => ({});

export function setFilesAuthHeaders(fn) {
  authHeaders = fn;
}

/**
 * The files picked in the interview step forms, queued in the browser and uploaded
 * when the step is saved, so that an interview can go on offline.
 */
export const fileQueue = makeFileQueue({
  store,
  upload: async (blob, { fileName, contentType }) => {
    const headers = {
      ...(await authHeaders()),
      "Content-Type": contentType,
      "X-File-Name": encodeURIComponent(fileName),
    };
    return (await api.post("/files", blob, { headers })).data;
  },
  download: async (item) => {
    const headers = await authHeaders();
    return (await api.get(`/files/${item.id || item.path}`, { headers, responseType: "blob" })).data;
  },
});

/** forgets the server ids of the queued files of the data (local ids), so that they are uploaded again */
export async function resetUploads(data) {
  const json = JSON.stringify(data);
  for (const entry of await store.getAll()) {
    if (entry.serverId && json.includes(JSON.stringify(entry.id))) {
      delete entry.serverId;
      await store.put(entry);
    }
  }
}
