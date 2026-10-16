<template>
  <q-page v-cloak>
    <q-pull-to-refresh @refresh="onRefresh">
      <div class="row q-pa-md q-mt-lg">
        <div class="col"></div>
        <div class="col-md-6 col-sm-8 col-xs-12">
          <div v-if="authStore.isAuthenticated">
            <q-card flat class="q-mb-md">
              <q-card-section>
                <q-list>
                  <q-item v-if="itwStore.participant && !receive">
                    <q-item-section>
                      <div class="text-h6">{{ itwStore.participant.code }}</div>
                    </q-item-section>
                    <q-item-section avatar>
                      <q-btn :title="$t('main.receive_participant')" icon-right="person" color="secondary" rounded
                        no-caps class="q-mt-sm q-mb-sm" @click="onReceive(true)" />
                    </q-item-section>
                  </q-item>
                  <q-item v-if="receive || !itwStore.participant">
                    <q-item-section>
                      <q-input v-model="code" :label="$t('main.code')" mask="XXXXXX" class="q-mb-md" />
                    </q-item-section>
                    <q-item-section avatar>
                      <q-btn color="primary" @click="onLoad(code)" :disable="!code || code.length < 6" class="q-mt-md">{{
                        $t("start") }}</q-btn>
                      <q-btn v-if="itwStore.participant" :label="$t('cancel')" color="secondary" flat no-caps
                        class="q-mt-sm" @click="onReceive(false)" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
          <q-card v-if="itwStore.design && !receive" :dark="settings.theme.dark" flat class="q-mb-md">
            <q-card-section>
              <div class="q-pl-md q-pr-md">
                <div class="text-h6">{{ tr(itwStore.design.label) }}</div>
                <div v-html="md(tr(itwStore.design.description))"></div>
              </div>
            </q-card-section>
            <q-separator :dark="settings.theme.dark"></q-separator>
            <q-card-section
              v-if="itwStore.completed && ($t('main.interview_completed_text') || (itwStore.design.completionUrl && !itwStore.user))">
              <div v-if="$t('main.interview_completed_text')" class="marked"
                v-html="md($t('main.interview_completed_text'))"></div>
              <div v-if="itwStore.design.completionUrl && !itwStore.user">
                <q-btn :label="$t('main.interview_completed_redirect', { count: countDown })" no-caps color="primary"
                  class="q-mt-md" @click="onRedirect(itwStore.design.completionUrl)" />
              </div>
            </q-card-section>

            <q-card-section>
              <q-list :dark="settings.theme.dark" separator>
                <template v-for="step in itwStore.design.steps" :key="step._id">
                  <q-item v-if="itwStore.rendering[step.name]?.visible" :dark="settings.theme.dark"
                    class="q-pt-lg q-pb-lg">
                    <q-item-section>
                      <q-item-label>{{ tr(step.label) }}</q-item-label>
                      <q-item-label caption lines="2">{{
                        tr(step.description)
                        }}</q-item-label>
                    </q-item-section>

                    <q-item-section side top>
                      <q-item-label v-if="step.time_estimate" caption>{{
                        step.time_estimate_max
                          ? $t("main.interval_estimate", {
                            count: `${step.time_estimate} - ${step.time_estimate_max}`,
                          })
                          : $t("main.time_estimate", {
                            count: step.time_estimate,
                          })
                      }}</q-item-label>
                      <q-btn v-if="itwStore.getRecordStatus(step.name) === null" :title="$t(
                        itwStore.rendering[step.name]?.disable
                          ? 'main.waiting_step'
                          : 'main.start_step'
                      )
                        " :icon-right="$q.lang.rtl ? 'chevron_left' : 'chevron_right'
                          " :color="itwStore.rendering[step.name]?.disable
                            ? 'secondary'
                            : 'primary'
                            " rounded no-caps class="q-mt-sm q-mb-sm" :to="`step/${step.name}`"
                        :disable="itwStore.rendering[step.name]?.disable" />
                      <q-btn v-if="
                        itwStore.getRecordStatus(step.name) === 'in_progress'
                      " :title="$t(
                        itwStore.rendering[step.name]?.disable
                          ? 'main.waiting_step'
                          : 'main.continue_step'
                      )
                        " icon-right="fas fa-ellipsis-h" :color="itwStore.rendering[step.name]?.disable
                          ? 'secondary'
                          : 'primary'
                          " rounded no-caps class="q-mt-sm q-mb-sm" :to="`step/${step.name}`"
                        :disable="itwStore.rendering[step.name]?.disable" />
                      <q-btn v-if="
                        itwStore.getRecordStatus(step.name) === 'completed'
                      " :title="$t('main.completed_step')" icon-right="check" :color="itwStore.rendering[step.name]?.disable
                        ? 'secondary'
                        : 'positive'
                        " rounded no-caps class="q-mt-sm q-mb-sm" :disable="itwStore.rendering[step.name]?.disable" />
                    </q-item-section>
                  </q-item>
                </template>
              </q-list>
            </q-card-section>
          </q-card>

          <q-card v-if="authStore.isAuthenticated && itwStore.completed && !receive">
            <q-card-section>
              <q-input filled v-model="itwStore.fillingDate" :label="$t('interview_filling_date')"
                :hint="$t('interview_filling_date_hint')" class="q-mb-md">
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="itwStore.fillingDate" mask="YYYY-MM-DD"
                        @update:model-value="onFillingDateUpdated">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup :label="$t('close')" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </q-card-section>
          </q-card>

          <div v-if="
            !authStore.isAuthenticated &&
            itwStore.supporters &&
            itwStore.supporters.length > 0
          ">
            <q-card flat class="q-mb-md">
              <q-card-section>
                <q-list>
                  <q-item>
                    <q-item-section>
                      {{ $t("main.investigator_help") }}
                    </q-item-section>
                    <q-item-section avatar>
                      <q-btn icon-right="help" color="info" rounded no-caps @click="showHelp = !showHelp" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
              <q-separator />
              <q-card-section v-show="showHelp">
                <q-list>
                  <q-item v-for="supporter in itwStore.supporters" :key="supporter.email" class="q-mb-md">
                    <q-item-section>
                      <q-item-label overline>{{ supporter.firstname }}
                        {{ supporter.lastname }}</q-item-label>
                      <q-item-label v-if="supporter.email">
                        <q-icon name="fas fa-envelope" class="q-mr-sm" />
                        <a :href="`mailto:${supporter.email}`">{{
                          supporter.email
                          }}</a></q-item-label>
                      <q-item-label v-if="supporter.phone">
                        <q-icon name="fas fa-phone" class="q-mr-sm" />
                        {{ supporter.phone }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>
        <div class="col"></div>
      </div>
    </q-pull-to-refresh>

    <q-dialog v-if="itwStore.isAuthenticated" v-model="showInstructions" position="bottom">
      <q-card>
        <q-card-section v-if="authStore.isAuthenticated">
          <div v-html="md(tr(itwStore.design.interviewer_instructions))"></div>
        </q-card-section>
        <q-card-section v-else>
          <div v-html="md(tr(itwStore.design.participant_instructions))"></div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup @click="itwStore.instructionsShown()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { Notify } from 'quasar'
import { settings as _settings } from '../boot/settings'
import { marked } from 'marked'
import { makeSchemaFormTr } from '@obiba/quasar-ui-amber'

const settings = _settings as Record<string, any>
const authStore = useAuthStore()
const itwStore = useInterviewStore()
const { locale, t } = useI18n({ useScope: 'global' })
const router = useRouter()

const code = ref('')
const receive = ref(false)
const showHelp = ref(false)
const showInstructions = ref(false)
const countDown = ref(10)

onMounted(() => {
  doShowInstructions()
  if (itwStore.completed && itwStore.design?.completionUrl && !itwStore.user) {
    const interval = setInterval(() => {
      if (countDown.value > 0) {
        countDown.value--
      } else {
        clearInterval(interval)
        onRedirect(itwStore.design.completionUrl)
      }
    }, 1000)
  }
})

function doShowInstructions() {
  if (itwStore.instructed) return
  if (!itwStore.user && itwStore.design?.participant_instructions) {
    showInstructions.value = true
  }
}

function tr(key: string) {
  return makeSchemaFormTr(itwStore.design, { locale: locale.value })(key)
}

function md(text: string | undefined) {
  return text ? (marked.parse(tr(text), { headerIds: false, mangle: false }) as string) : text
}

function onRedirect(url: string) {
  if (url) window.location.href = url
}

function onReceive(val: boolean) {
  receive.value = val
  if (val) code.value = ''
}

function onRefresh(done: () => void) {
  if (itwStore.participant) {
    onLoad(itwStore.participant.code, done)
  } else {
    done()
  }
}

function onFillingDateUpdated() {
  itwStore.saveFillingDate()
}

function onLoad(loadCode: string, done?: () => void) {
  const promise = itwStore.user
    ? itwStore.initByInterviewer(loadCode)
    : itwStore.initByParticipant()
  promise
    .then(() => {
      if (typeof done === 'function') {
        done()
      } else {
        showInstructions.value =
          itwStore.user && !itwStore.instructed && itwStore.design.interviewer_instructions !== undefined
      }
      receive.value = false
    })
    .catch((err: { name: string; message: string }) => {
      if (typeof done === 'function') done()
      if (err.name === 'NotAuthenticated') {
        router.push('login')
      } else {
        Notify.create({ message: t(err.message), color: 'negative' })
      }
    })
}
</script>
