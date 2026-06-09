<template>
  <div class="add-view">
    <div class="add-header">
      <h2>👤 添加新玩家</h2>
      <router-link to="/players/search" class="btn-back">← 返回列表</router-link>
    </div>
    <div class="add-body">
      <PlayerEditor @saved="onSaved" />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import PlayerEditor from '../components/PlayerEditor.vue'

const router = useRouter()

function onSaved() {
  router.push('/players/search')
}
</script>