import { defineStore } from "pinia";
import { ref, computed, toHandlers } from "vue";

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
      const payload = makePayload();
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
      const stepObjs = [stepObj];

      if (recording) {
        return itwService
          .patch(itw.value._id, { steps: stepObjs }, payload)
          .then((response) => {
            tosave.value = [];
            setInterview(response);
          })
          .catch((err) => {
            // handle save error
            stepObjs.forEach((step) => {
              if (!tosave.value.includes(step.name)) {
                tosave.value.push(step.name);
              }
            });
          });
      } else {
        // update iterview and step states
        const itwState = evalRendering();
        itw.value.state = itwState;

        const toReset = Object.keys(rendering.value).filter(
          (name) => !rendering.value[name].visible
        );
        if (toReset.length > 0) {
          itw.value.steps
            .filter((step) => toReset.includes(step.name))
            .forEach((step) => {
              step.state = null;
              step.data = null;
              stepObjs.push(step);
            });
        }

        return itwService
          .patch(itw.value._id, { state: itwState, steps: stepObjs }, payload)
          .then((response) => {
            record.value = null;
            tosave.value = [];
            setInterview(response);
            evalRendering();
          })
          .catch((err) => {
            // handle save error
            stepObjs.forEach((step) => {
              if (!tosave.value.includes(step.name)) {
                tosave.value.push(step.name);
              }
            });
          });
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
        const stepObjs = itw.value.steps
          .filter((step) => tosave.value.includes(step.name))
          .map((step) => {
            if (!step.form || !step.revision) {
              const stepDesign = getStepDesign(step.name);
              return {
                ...step,
                form: stepDesign.form,
                revision: stepDesign.revision,
              };
            }
            return step;
          });
        const payload = makePayload();
        return itwService
          .patch(
            itw.value._id,
            { state: itw.value.state, steps: stepObjs },
            payload
          )
          .then((response) => {
            setInterview(response);
            evalRendering();
            tosave.value = [];
          });
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
