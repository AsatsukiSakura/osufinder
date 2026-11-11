<template>
  <div class="not-found">
    <div class="not-found-card">
      <div class="not-found-icon">
        <AppIcon name="alert" :size="34" />
      </div>
      <h1 class="not-found-code">404</h1>
      <p class="not-found-title">页面走丢了</p>
      <p class="not-found-desc">你访问的页面不存在，或者已经被删除。</p>
      <div class="not-found-actions">
        <button type="button" class="btn btn-secondary" @click="goBack">
          <AppIcon name="arrow-left" :size="16" /> 返回上一页
        </button>
        <router-link to="/players/search" class="btn btn-primary">
          <AppIcon name="search" :size="16" /> 去搜索玩家
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'

const router = useRouter()

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/players/search')
}
</script>

<style scoped>
.not-found {
  display: grid;
  place-items: center;
  min-height: 60vh;
  animation: rise-in 0.3s ease;
}

.not-found-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 40px 32px;
  max-width: 420px;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-pop);
}

.not-found-icon {
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: var(--gradient-primary-soft);
  color: var(--brand-pink);
  margin-bottom: 6px;
}

.not-found-code {
  font-size: var(--font-size-display);
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.04em;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.not-found-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
}

.not-found-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.not-found-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
}

.not-found-actions .btn {
  gap: 6px;
}
</style>
