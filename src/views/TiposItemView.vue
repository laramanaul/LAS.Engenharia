<template>
  <div class="content-area">
    <h2>Tipos de Item</h2>
    <ul>
      <li v-for="tipo in tipos" :key="tipo.id">
        {{ tipo.nome }}
      </li>
    </ul>
  </div>
</template>

<script>
import { getAll } from '../services/useFirestore';

export default {
  name: "TiposItemView",
  data() {
    return { tipos: [] };
  },
  async mounted() {
    this.tipos = await getAll("tipos-item");
  },
};
</script>
