<template>
  <div class="dashboard-widgets">
    <!-- Resumo de Projetos -->
    <div :class="['widget-card', { expanded: widgets[0].expandido }]">
      <div class="widget-header">
        <h3>Resumo de Projetos</h3>
        <button @click="toggleExpand(0)">[ {{ widgets[0].expandido ? '-' : '+' }} ]</button>
      </div>
      <p>Total: {{ projetosUsuario.length }}</p>
      <p>Em Andamento: {{ projetosEmAndamento }}</p>
      <p>Finalizados: {{ projetosFinalizados }}</p>
    </div>

    <!-- Previsão do Tempo -->
    <div :class="['widget-card', { expanded: widgets[1].expandido }]">
      <div class="widget-header">
        <h3>Previsão do Tempo</h3>
        <button @click="toggleExpand(1)">[ {{ widgets[1].expandido ? '-' : '+' }} ]</button>
      </div>
      <p>{{ localizacaoProjeto.cidade }}, {{ localizacaoProjeto.estado }}</p>
      <p>Previsão: {{ previsaoTexto }}</p>
    </div>
  </div>
</template>

<script>
import { onMounted, ref, computed } from 'vue';

export default {
  props: {
    projetos: { type: Array, default: () => [] },
    localizacaoProjeto: { type: Object, default: () => ({ cidade: '', estado: '' }) },
    user: { type: Object, required: true }
  },
  setup(props) {
    const previsaoTexto = ref('Carregando...');
    const widgets = ref([
      { expandido: false }, // Resumo de Projetos
      { expandido: false }  // Previsão do Tempo
    ]);

    const toggleExpand = (index) => {
      widgets.value[index].expandido = !widgets.value[index].expandido;
    };

    // Filtrar projetos do usuário logado
    const projetosUsuario = computed(() => {
      return props.projetos.filter(p =>
        p.criadoPor === props.user.uid || (p.allowedUsers || []).includes(props.user.uid)
      );
    });

    const projetosEmAndamento = computed(() =>
      projetosUsuario.value.filter(p => p.status === 'andamento').length
    );

    const projetosFinalizados = computed(() =>
      projetosUsuario.value.filter(p => p.status === 'finalizado').length
    );

    onMounted(() => {
      previsaoTexto.value = 'Ensolarado, 25°C'; // Mock, pode integrar API depois.
    });

    return {
      previsaoTexto,
      widgets,
      toggleExpand,
      projetosUsuario,
      projetosEmAndamento,
      projetosFinalizados
    };
  }
};
</script>
