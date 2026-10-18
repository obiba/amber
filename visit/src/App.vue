<template>
  <router-view />
</template>

<script setup>
const itwStore = useInterviewStore();

// save the steps that could not be saved (offline), when back online and every minute
const savePending = () => {
  if (itwStore.pending && navigator.onLine) {
    itwStore.savePendingRecords().catch((err) => console.debug("Pending steps not saved", err));
  }
};
let intervalId;

onMounted(() => {
  window.addEventListener("online", savePending);
  intervalId = setInterval(savePending, 60000);
});

onBeforeUnmount(() => {
  window.removeEventListener("online", savePending);
  clearInterval(intervalId);
});
</script>
