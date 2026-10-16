<template>
  <router-view />
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useRecordStore } from './stores/record'
import { storeToRefs } from 'pinia'

const router = useRouter()
const { locale } = useI18n({ useScope: 'global' })
const authStore = useAuthStore()
const recordStore = useRecordStore()

// Get reactive references to store state
const { user: currentUser } = storeToRefs(authStore)
const { caseReports } = storeToRefs(recordStore)

const intervalId = ref(null)

// Watch currentUser changes
watch(currentUser, (newUser, oldUser) => {
  if (newUser === null) {
    router.push('/login')
  } else {
    locale.value = authStore.user.language
  }
})

// Auto-save completed case reports
onMounted(() => {
  intervalId.value = setInterval(() => {
    if (currentUser.value) {
      const completedCaseReports = caseReports.value.filter(cr => cr.state === 'completed')
      if (completedCaseReports.length > 0) {
        completedCaseReports.forEach(cr => {
          recordStore.saveCaseReport({
            id: cr.id,
            user: currentUser.value.email,
            silent: true
          })
        })
      }
    }
  }, 60000) // every minute
})

onBeforeUnmount(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})
</script>
