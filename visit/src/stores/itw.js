import { defineStore } from "pinia";
import { ref, computed, toHandlers } from "vue";
import { feathersClient } from "../feathers-client";
import { fileQueue, setFilesAuthHeaders, resetUploads } from "../file-queue";

export const useInterviewStore = defineStore(
  "itw",
  () => {
    const { client } = useFeathers();
    const itwdService = client.service("itwd");
    const itwService = client.service("itw");
    const interviewService = client.service("interview");
    const authStore = useAuthStore();

    const user = ref(null);
    const code = ref(null); // the current participant's code
    const design = ref(null); // the interview design
    const record = ref(null); // the current step form record
    const scheme = ref(null); // the authentication scheme
    const cred = ref(null); // the participant credentials if self-administered
    const itw = ref(null); // the interview collected data, to be saved
    const tosave = ref([]); // mark steps which changes are to be saved
    const instructed = ref(false); // instructions were shown
    const rendering = ref({}); // the visibility/enability of the steps
    const fillingDate = ref(null); // the interview filling date
    let saving = Promise.resolve(); // the saves, one at a time
    const unsaved = new Set(); // the steps changed and not saved yet, besides the ones that could not be saved (tosave)

    // the files are uploaded with the participant credentials, or the interviewer token
    setFilesAuthHeaders(async () =>
      cred.value
        ? { Authorization: `${scheme.value || "participant"} ${cred.value}` }
        : { Authorization: `Bearer ${await feathersClient.authentication.getAccessToken()}` }
    );

    /**
     * Upload the queued files of the steps data, and reference them by their server ids.
     * @param {Array} stepObjs
     * @returns the steps to be saved
     */
    async function flushFiles(stepObjs) {
      const rval = [];
      for (const step of stepObjs) {
        rval.push(step.data ? { ...step, data: await fileQueue.flush(step.data) } : step);
      }
      return rval;
    }

    /** the uploaded files were deleted (pending for too long) or attached by a save whose response was lost */
    const isInvalidFile = (err) => err.code === 400 && /^Not a valid file:/.test(err.message);

    /**
     * Save the changed steps, and the ones that could not be saved before, with the interview fields.
     * One save at a time, and the steps changed meanwhile are kept: a late response does not overwrite them.
     * @param {Array} names the names of the changed steps
     * @param {Object} fields the interview fields to patch
     * @returns the saved interview
     */
    function saveSteps(names, fields = {}) {
      names.forEach((name) => unsaved.add(name));
      const run = saving.then(async () => {
        tosave.value.forEach((name) => unsaved.add(name));
        const sent = itw.value.steps.filter((step) => unsaved.has(step.name));
        if (sent.length === 0) return itw.value;
        const id = itw.value._id;
        const stepObjs = sent.map((step) => {
          if (!step.form || !step.revision) {
            const stepDesign = getStepDesign(step.name);
            return { ...step, form: stepDesign.form, revision: stepDesign.revision };
          }
          return step;
        });
        const patch = async () => itwService.patch(id, { ...fields, steps: await flushFiles(stepObjs) }, makePayload());
        const response = await patch()
          .catch(async (err) => {
            if (!isInvalidFile(err)) throw err;
            // upload the files again, once
            await resetUploads(stepObjs);
            return patch();
          })
          .catch((err) => {
            tosave.value = [...unsaved];
            throw err;
          });
        if (itw.value?._id !== id) return response;
        // the steps that were not changed meanwhile are saved
        sent.forEach((step) => {
          if (itw.value.steps.includes(step)) unsaved.delete(step.name);
        });
        tosave.value = tosave.value.filter((name) => unsaved.has(name));
        const kept = itw.value.steps.filter((step) => unsaved.has(step.name));
        setInterview({
          ...response,
          steps: [...(response.steps || []).filter((step) => !unsaved.has(step.name)), ...kept],
        });
        evalRendering();
        fileQueue.purge([itw.value.steps, record.value?.data]).catch((err) => console.error(err));
        return response;
      });
      saving = run.catch(() => {});
      return run;
    }

    const isAuthenticated = computed(() => {
      if (authStore.isAuthenticated) return true;
      return cred.value !== null;
    });
    const participant = computed(() => design.value?.participant);
    const supporters = computed(() => design.value?.supporters);
    const steps = computed(() => design.value?.steps);
    const pending = computed(() => tosave.value.length > 0); // has pending changes to be saved
    const completed = computed(() => {
      if (itw.value) {
        return itw.value.state === "completed";
      }
      return false;
    });

    /**
     * Evaluate and set the rendering options.
     * @returns The interview state
     */
    function evalRendering() {
      const rval = {};

      if (design.value) {
        // collect data, participant's ones are included
        const data = {
          participant: design.value.participant
            ? design.value.participant.data
            : {},
        };
        // init each step with an empty data object
        design.value.steps.forEach((step) => {
          data[step.name] = {};
        });
        if (itw.value) {
          itw.value.steps?.forEach((step) => {
            if (step.state === "completed") {
              // only include data of completed steps otherwise
              // dependent steps could be actived while parent data could still be modified
              data[step.name] = step.data;
            }
            rval[step.name] = {
              state: step.state,
            };
          });
        }
        // eval condition and disable scripts
        design.value.steps.forEach((step) => {
          rval[step.name] = {
            ...rval[step.name],
            visible: true,
            disable: false,
          };
          if (step.condition && step.condition !== "") {
            const script = `try {
              const compute = (${variableRefRewrite(step.condition)});
              const rval = typeof compute === 'function' ? compute(data) : compute;
              return (rval);
            } catch(err) {
              console.error(err);
              return true;
            }`;
            const func = new Function(`return (data) => { ${script} }`)();
            rval[step.name].visible = func(data);
          }
          if (step.disable && step.disable !== "") {
            const script = `try {
              const compute = (${variableRefRewrite(step.disable)});
              const rval = typeof compute === 'function' ? compute(data) : compute;
              return (rval);
            } catch(err) {
              console.error(err);
              return false;
            }`;
            const func = new Function(`return (data) => { ${script} }`)();
            rval[step.name].disable = func(data);
          }
        });
      }

      rendering.value = rval;

      const completed =
        Object.values(rval).filter(
          (step) => step.visible && step.state !== "completed"
        ).length === 0;

      return completed ? "completed" : "in_progress";
    }

    /**
     * Rewrite the variable references $('xxx') in a JS script, for the condition/disable evaluation.
     * @param {string} script
     * @returns
     */
    function variableRefRewrite(script) {
      const doRewrite = (match, p1, offset, string) => {
        // console.log([match, p1, offset, string].join(', '))
        return "data." + p1;
      };
      return script && typeof script === "string"
        ? script.replace(/\$\('([\w\.]+)'\)/g, doRewrite)
        : script;
    }

    /**
     * Initialize design and interview data; to be called by the participant.
     * @param {string} code
     * @param {string} [password]
     * @returns
     */
    async function initByParticipant(code, password) {
      scheme.value = "participant";
      if (code) {
        cred.value = btoa(password ? `${code}:${password}` : code);
      }
      return itwdService
        .find({
          query: {},
          headers: { Authorization: `${scheme.value} ${cred.value}` },
        })
        .then((response) => {
          design.value = response.data[0];
          setInterview(null);
          rendering.value = {};
        })
        .then(() => initInterview());
    }

    /**
     * Initialize design and interview data; to be called by the participant.
     * @param {Object} query
     * @returns
     */
    async function initByWalkInParticipant(query) {
      scheme.value = "campaign";
      if (query) {
        cred.value = btoa(JSON.stringify(query));
      }
      return itwdService
        .find({
          query: {},
          headers: { Authorization: `${scheme.value} ${cred.value}` },
        })
        .then((response) => {
          design.value = response.data[0];
          const participant = design.value.participant;
          if (participant && participant.code) {
            cred.value = btoa(participant.code);
            scheme.value = "participant";
          }
          setInterview(null);
          rendering.value = {};
        })
        .then(() => initInterview());
    }

    /**
     * Set the interview object and associated filling date (for latter modification).
     * @param {Interview | null} interview
     */
    function setInterview(interview) {
      itw.value = interview;
      fillingDate.value = interview
        ? interview.fillingDate
          ? interview.fillingDate.split("T")[0]
          : null
        : null;
    }

    /**
     * Initialize design and interview data; to be called by the interviewer.
     * @param {string} pcode
     * @returns
     */
    async function initByInterviewer(pcode) {
      code.value = pcode;
      return itwdService
        .find({
          query: { $limit: 1, code: pcode },
        })
        .then((response) => {
          design.value = response.data[0];
          setInterview(null);
          rendering.value = {};
        })
        .then(() => initInterview());
    }

    /**
     * REST payload, with appropriate HTTP headers if participant is to be authenticated.
     * @returns
     */
    function makePayload() {
      const payload = {};
      if (cred.value) {
        payload.query = {};
        payload.headers = { Authorization: `${scheme.value || "participant"} ${cred.value}` };
      } else {
        payload.query = { code: code.value };
      }
      return payload;
    }

    /**
     * Initialize the interview if not already done.
     */
    async function initInterview() {
      if (!itw.value) {
        // get the interview data if we do not have it already
        const payload = makePayload();
        return itwService.find(payload).then((response) => {
          setInterview(response.data[0]);
          evalRendering();
        });
      } else {
        return new Promise((resolve) => resolve());
      }
    }

    /**
     * Get the step definition from the interview design.
     * @param {string} name
     * @returns
     */
    function getStepDesign(name) {
      return design.value?.steps?.find((step) => step.name === name);
    }

    /**
     * Initiate or reinstate the current record for the step.
     * @param {string} name
     */
    async function setupRecord(name) {
      return initInterview().then(() => {
        const step = itw.value.steps?.find((step) => step.name === name);
        let rec = {
          name,
          data: { __page: 0 },
        };
        if (step && step.data) {
          rec.data = step.data;
        }
        // add other steps data
        itw.value.steps
          ?.filter((step) => step.name !== name)
          .forEach((step) => {
            rec.data[step.name] = step.data;
          });
        rec.data.participant = design.value.participant.data;
        record.value = rec;
        // the queued files of the abandoned forms
        fileQueue.purge([itw.value.steps, rec.data]).catch((err) => console.error(err));
      });
    }

    /**
     * Update the current record and merge into the interview steps data.
     * @param {string} name
     * @param {Object} data
     */
    function updateRecord(name, data) {
      record.value = {
        name,
        data,
      };
      mergeRecord("in_progress");
    }

    /**
     * Intermediatesvae of the form: merge current record into the interview steps data with 'in_progress' state.
     */
    async function intermediateRecord() {
      return saveRecord("in_progress", true);
    }

    /**
     * Pause form: merge current record into the interview steps data with 'in_progress' state and set record to null.
     */
    async function pauseRecord() {
      return saveRecord("in_progress", false);
    }

    /**
     * Complete form: merge current record into the interview steps data with 'completed' state and set record to null.
     */
    async function completeRecord() {
      return saveRecord("completed", false);
    }

    /**
     * Save the interview with the provided state.
     * @param {string} state
     * @param {boolean} recording Keep on recording
     */
    async function saveRecord(state, recording) {
      const stepDesign = getStepDesign(record.value.name);
      const stepObj = {
        name: record.value.name,
        state: state,
        form: stepDesign.form,
        revision: stepDesign.revision,
        data: {},
      };
      // exclude entries from other steps and participant data
      const excludedKeys = design.value.steps
        .filter((step) => step.name !== record.value.name)
        .map((step) => step.name);
      excludedKeys.push("participant");
      Object.keys(record.value.data).forEach((key) => {
        if (!excludedKeys.includes(key)) {
          stepObj.data[key] = record.value.data[key];
        }
      });

      // include patch data to current itw, so that it works offline and saving can be postponed
      if (!itw.value.steps) {
        itw.value.steps = [stepObj];
      } else {
        const idx = itw.value.steps
          .map((step) => step.name)
          .indexOf(stepObj.name);
        if (idx < 0) {
          itw.value.steps.push(stepObj);
        } else {
          itw.value.steps.splice(idx, 1, stepObj);
        }
      }
      const names = [stepObj.name];

      // a step that could not be saved is in tosave, saved later
      if (recording) {
        return saveSteps(names).catch(() => {});
      } else {
        // update iterview and step states
        const itwState = evalRendering();
        itw.value.state = itwState;

        const toReset = Object.keys(rendering.value).filter(
          (name) => !rendering.value[name].visible
        );
        // replaced, not modified: a save in progress knows that they changed
        itw.value.steps = itw.value.steps.map((step) => {
          if (!toReset.includes(step.name)) return step;
          names.push(step.name);
          return { ...step, state: null, data: null };
        });

        return saveSteps(names, { state: itwState })
          .then(() => {
            record.value = null;
          })
          .catch(() => {});
      }
    }

    /**
     * Save the associated filling date through interview service.
     * @returns
     */
    async function saveFillingDate() {
      // const payload = makePayload();
      return interviewService
        .patch(itw.value._id, { fillingDate: fillingDate.value })
        .then((response) => {
          // for consistency
          itw.value.fillingDate = response.fillingDate;
        })
        .catch((err) => {
          console.error(err);
        });
    }

    /**
     * Save steps data that could not be changed before.
     * @returns
     */
    async function savePendingRecords() {
      if (tosave.value.length > 0) {
        return saveSteps([], { state: itw.value.state });
      }
    }

    /**
     * Get step state: 'in_progress', 'completed' or null (i.e. not started).
     * @param {string} name
     * @returns
     */
    function getRecordStatus(name) {
      if (itw.value && itw.value.steps) {
        const step = itw.value.steps.find((step) => step.name === name);
        if (step) {
          return step.state;
        }
      }
      return null;
    }

    /**
     * Merge current record into the interview steps data.
     * @param {string} state
     */
    function mergeRecord(state) {
      itw.value.steps[record.value.name] = record.value;
      itw.value.steps[record.value.name].state = state;
      // TODO remove other steps data
    }

    /**
     * Clear store from data.
     */
    function reset(force) {
      // check if changes to saved, otherwise data will be lost
      if (tosave.value.length === 0 || force) {
        user.value = null;
        code.value = null;
        design.value = null;
        record.value = null;
        cred.value = null;
        itw.value = null;
        fillingDate.value = null;
        tosave.value = [];
        unsaved.clear();
        instructed.value = false;
        rendering.value = {};
      }
    }

    /**
     * Mark that the instructions have been shown.
     */
    function instructionsShown() {
      instructed.value = true;
    }

    function setUser(payload) {
      user.value = payload;
    }

    return {
      user,
      code,
      cred,
      design,
      record,
      itw,
      fillingDate,
      tosave,
      instructed,
      rendering,
      // computed
      isAuthenticated,
      participant,
      supporters,
      steps,
      pending,
      completed,
      // methods
      initByInterviewer,
      initByParticipant,
      initByWalkInParticipant,
      initInterview,
      getStepDesign,
      setupRecord,
      updateRecord,
      intermediateRecord,
      pauseRecord,
      completeRecord,
      getRecordStatus,
      savePendingRecords,
      reset,
      instructionsShown,
      setUser,
      saveFillingDate,
    };
  },
  {
    persist: true,
  }
);
