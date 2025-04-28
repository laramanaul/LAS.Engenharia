<template>
  <div class="app-layout">
    <Sidebar 
      :user="user" 
      :projetoAtivo="projetoAtivo"
      @logout="$emit('logout')"
      @reset-password="$emit('reset-password')"
      @trocar-projeto="$emit('trocar-projeto', $event)" 
    />
    <div class="main-content">
      <div class="page-content">
        <router-view :projetoAtivo="projetoAtivo" :user="user" />
      </div>
    </div>
  </div>
</template>

<script>
import Sidebar from './Sidebar.vue';

export default {
  props: ['user', 'projetoAtivo'],
  components: { Sidebar },
  emits: ['logout', 'reset-password', 'trocar-projeto'],
};
</script>
