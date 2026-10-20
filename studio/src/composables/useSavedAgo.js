import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const UNITS = [['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]]

// last save time, formatted relatively to now ("2 minutes ago") and refreshed periodically
export function useSavedAgo () {
  const { t, locale } = useI18n()
  const savedAt = ref(null)
  const now = ref(Date.now())
  let intervalId = null

  const savedAgo = computed(() => {
    if (!savedAt.value) return ''
    const secs = Math.max(0, Math.round((now.value - new Date(savedAt.value).getTime()) / 1000))
    if (secs < 10) return t('saved_ago', { ago: t('just_now') })
    const [unit, size] = UNITS.find(([, s]) => secs >= s)
    const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })
    return t('saved_ago', { ago: rtf.format(-Math.floor(secs / size), unit) })
  })

  function markSaved (date) {
    savedAt.value = date || Date.now()
    now.value = Date.now()
  }

  onMounted(() => {
    intervalId = setInterval(() => { now.value = Date.now() }, 10000)
  })
  onBeforeUnmount(() => clearInterval(intervalId))

  return { savedAgo, markSaved }
}
