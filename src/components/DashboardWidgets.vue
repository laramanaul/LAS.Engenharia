
<template>
  <div class="dashboard-widgets">
    <!-- Widget: Resumo Geral -->
    <div v-if="visibilidade.resumo" class="widget-card">
      <div class="widget-header">
        <span>📊 Resumo Geral</span>
      </div>
      <ul>
<li>Total de Projetos: {{ resumo.totalProjetos || 0 }}</li>
<li>Em Andamento: {{ resumo.andamento || 0 }}</li>
<li>Finalizados: {{ resumo.finalizados || 0 }}</li>
<li>Itens Cadastrados: {{ resumo.totalItens || 0 }}</li>
<li>Etapas: {{ resumo.etapasConcluidas || 0 }} / {{ resumo.etapasTotal || 0 }}</li>
<li>Tarefas: {{ resumo.tarefasConcluidas || 0 }} / {{ resumo.tarefasTotal || 0 }}</li>

        <li>Valor Executado: R$ {{ (resumo.totalExecutado || 0).toFixed(2) }}</li>

      </ul>
    </div>

    <!-- Widget: Custos por Etapa -->
<!-- Widget: Custos Executados/Pendentes -->
<div v-if="visibilidade.custos" class="widget-card">
  <div class="widget-header">
    <span>💰 Custos</span>
  </div>
  <ul>
    <li v-for="(item, idx) in custosPorEtapa" :key="idx">
      {{ item.tipo }} — R$ {{ (item.valor || 0).toFixed(2) }}
    </li>
  </ul>
</div>


    <!-- Widget: Alertas -->
    <div v-if="visibilidade.alertas" class="widget-card">
      <div class="widget-header">
        <span>🚨 Alertas</span>
      </div>
      <ul>
        <li v-for="(a, idx) in alertas" :key="idx">
          {{ a.titulo }} - {{ a.responsavel }} (até {{ a.prazo }})
        </li>
      </ul>
    </div>

    <!-- Widget: Alterações Recentes -->
    <div v-if="visibilidade.alteracoes" class="widget-card">
      <div class="widget-header">
        <span>📌 Alterações Recentes</span>
      </div>
      <ul>
        <li v-for="(alt, idx) in alteracoes" :key="idx">
          {{ alt.etapa }} - {{ alt.status }} (por {{ alt.modificadoPor }})
        </li>
      </ul>
    </div>

    <!-- Widget: Previsão do Tempo -->
    <div v-if="visibilidade.previsao" class="widget-card" :class="{ expanded: expandido.previsao }">
      <div class="widget-header">
        <span>🌤️ Previsão do Tempo</span>
<button @click="toggleExpand('previsao')" :aria-label="expandido.previsao ? 'Reduzir previsão' : 'Expandir previsão'">
  {{ expandido.previsao ? 'Reduzir' : 'Expandir' }}
</button>


      </div>
      <p>Hoje: {{ previsao.hoje }}</p>

<div v-if="expandido.previsao">
  <h4>Próximos dias:</h4>
  <ul>
    <li v-for="(dia, idx) in previsao.diasFuturos" :key="idx">
      {{ dia.dia }} — {{ obterIconeTempo(dia.codigo) }} {{ dia.min }}° / {{ dia.max }}°
    </li>
  </ul>
</div>

    </div>
  </div>
</template>

<script>
export default {
  props: {
    visibilidade: Object,
    resumo: Object,
    custosPorEtapa: Array,
    alertas: Array,
    alteracoes: Array,
    previsao: Object
  },
  data() {
    return {
      expandido: {
        previsao: false
      }
    };
  },
methods: {
  toggleExpand(widget) {
    this.expandido[widget] = !this.expandido[widget];
  },
  obterIconeTempo(codigo) {
    // Base simplificada do Open-Meteo
    if ([0, 1].includes(codigo)) return '☀️';
    if ([2].includes(codigo)) return '⛅';
    if ([3].includes(codigo)) return '☁️';
    if ([45, 48].includes(codigo)) return '🌫️';
    if ([51, 53, 55, 56, 57].includes(codigo)) return '🌦️';
    if ([61, 63, 65, 66, 67].includes(codigo)) return '🌧️';
    if ([71, 73, 75, 77, 85, 86].includes(codigo)) return '❄️';
    if ([80, 81, 82].includes(codigo)) return '🌧️';
    if ([95, 96, 99].includes(codigo)) return '⛈️';
    return '❔';
  }
}

};
</script>
=======
<template>
  <div class="dashboard-widgets">
    <!-- Widget: Resumo Geral -->
    <div v-if="visibilidade.resumo" class="widget-card">
      <div class="widget-header">
        <span>📊 Resumo Geral</span>
      </div>
      <ul>
<li>Total de Projetos: {{ resumo.totalProjetos || 0 }}</li>
<li>Em Andamento: {{ resumo.andamento || 0 }}</li>
<li>Finalizados: {{ resumo.finalizados || 0 }}</li>
<li>Itens Cadastrados: {{ resumo.totalItens || 0 }}</li>
<li>Etapas: {{ resumo.etapasConcluidas || 0 }} / {{ resumo.etapasTotal || 0 }}</li>
<li>Tarefas: {{ resumo.tarefasConcluidas || 0 }} / {{ resumo.tarefasTotal || 0 }}</li>

        <li>Valor Executado: R$ {{ (resumo.totalExecutado || 0).toFixed(2) }}</li>

      </ul>
    </div>

    <!-- Widget: Custos por Etapa -->
<!-- Widget: Custos Executados/Pendentes -->
<div v-if="visibilidade.custos" class="widget-card">
  <div class="widget-header">
    <span>💰 Custos</span>
  </div>
  <ul>
    <li v-for="(item, idx) in custosPorEtapa" :key="idx">
      {{ item.tipo }} — R$ {{ (item.valor || 0).toFixed(2) }}
    </li>
  </ul>
</div>


    <!-- Widget: Alertas -->
    <div v-if="visibilidade.alertas" class="widget-card">
      <div class="widget-header">
        <span>🚨 Alertas</span>
      </div>
      <ul>
        <li v-for="(a, idx) in alertas" :key="idx">
          {{ a.titulo }} - {{ a.responsavel }} (até {{ a.prazo }})
        </li>
      </ul>
    </div>

    <!-- Widget: Alterações Recentes -->
    <div v-if="visibilidade.alteracoes" class="widget-card">
      <div class="widget-header">
        <span>📌 Alterações Recentes</span>
      </div>
      <ul>
        <li v-for="(alt, idx) in alteracoes" :key="idx">
          {{ alt.etapa }} - {{ alt.status }} (por {{ alt.modificadoPor }})
        </li>
      </ul>
    </div>

    <!-- Widget: Previsão do Tempo -->
    <div v-if="visibilidade.previsao" class="widget-card" :class="{ expanded: expandido.previsao }">
      <div class="widget-header">
        <span>🌤️ Previsão do Tempo</span>
<button @click="toggleExpand('previsao')" :aria-label="expandido.previsao ? 'Reduzir previsão' : 'Expandir previsão'">
  {{ expandido.previsao ? 'Reduzir' : 'Expandir' }}
</button>


      </div>
      <p>Hoje: {{ previsao.hoje }}</p>

<div v-if="expandido.previsao">
  <h4>Próximos dias:</h4>
  <ul>
    <li v-for="(dia, idx) in previsao.diasFuturos" :key="idx">
      {{ dia.dia }} — {{ obterIconeTempo(dia.codigo) }} {{ dia.min }}° / {{ dia.max }}°
    </li>
  </ul>
</div>

    </div>
  </div>
</template>

<script>
export default {
  props: {
    visibilidade: Object,
    resumo: Object,
    custosPorEtapa: Array,
    alertas: Array,
    alteracoes: Array,
    previsao: Object
  },
  data() {
    return {
      expandido: {
        previsao: false
      }
    };
  },
methods: {
  toggleExpand(widget) {
    this.expandido[widget] = !this.expandido[widget];
  },
  obterIconeTempo(codigo) {
    // Base simplificada do Open-Meteo
    if ([0, 1].includes(codigo)) return '☀️';
    if ([2].includes(codigo)) return '⛅';
    if ([3].includes(codigo)) return '☁️';
    if ([45, 48].includes(codigo)) return '🌫️';
    if ([51, 53, 55, 56, 57].includes(codigo)) return '🌦️';
    if ([61, 63, 65, 66, 67].includes(codigo)) return '🌧️';
    if ([71, 73, 75, 77, 85, 86].includes(codigo)) return '❄️';
    if ([80, 81, 82].includes(codigo)) return '🌧️';
    if ([95, 96, 99].includes(codigo)) return '⛈️';
    return '❔';
  }
}

};
</script>
>>>>>>> 9396cd378334692f8c2f504fe0827aa082427823
