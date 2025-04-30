<template>
  <div :class="['main-layout', sidebarVisivel ? 'com-sidebar' : 'sem-sidebar']">
    <Sidebar
      v-if="sidebarVisivel"
      :user="user"
      :projetoAtivo="projetoAtivo"
      @logout="$emit('logout')"
      @reset-password="$emit('reset-password', $event)"
      @trocar-projeto="$emit('trocar-projeto', $event)"
    />

    <div class="main-content">
      <div class="page-content">
        <router-view
          :user="user"
          :projetoAtivo="projetoAtivo"
          @trocar-projeto="$emit('trocar-projeto', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Sidebar from './Sidebar.vue';

export default {
  props: ['user', 'projetoAtivo'],
  components: { Sidebar },
  computed: {
    sidebarVisivel() {
      return this.$route.path !== '/login';
    }
  }
};
</script>
