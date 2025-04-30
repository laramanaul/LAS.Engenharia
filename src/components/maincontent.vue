<!-- src/components/MainContent.vue -->
<template>
  <main class="main-content">
    <h1>Bem-vindo, {{ user.displayName || user.email }}</h1>
    <!-- Conteúdo principal -->
  </main>
</template>

<script>
export default {
  name: "MainContent",
  props: {
    user: Object
  }
};
</script>
