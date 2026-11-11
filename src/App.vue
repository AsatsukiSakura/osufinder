<template>
  <RouterView />
  <ToastHost />
  <AppDialog />
</template>

<script setup lang="ts">
import ToastHost from './components/ToastHost.vue'
import AppDialog from './components/AppDialog.vue'
</script>
