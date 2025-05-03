<template>
  <div class="dashboard-widgets">
    <!-- Alertas -->
    <div v-if="exibir.alertas" class="widget-card">
      <h3>Alertas</h3>
      <ul>
        <li v-for="(alerta, index) in alertas" :key="index">
          <strong>{{ alerta.tipo }}:</strong> {{ alerta.mensagem }}
        </li>
      </ul>
    </div>

    <!-- Resumo de Projetos -->
    <div v-if="exibir.projetos" class="widget-card">
      <h3>Resumo de Projetos</h3>
      <p>Total: {{ contagemProjetos.total }}</p>
      <p>Em Andamento: {{ contagemProjetos.andamento }}</p>
      <p>Finalizados: {{ contagemProjetos.finalizados }}</p>
    </div>

    <!-- Últimos Logs -->
    <div v-if="exibir.logs" class="widget-card">
      <h3>Últimos Logs</h3>
      <ul>
        <li v-for="(log, index) in logsRecentes" :key="index">
          {{ log.usuario }} - {{ log.acao }} - {{ log.data }}
        </li>
      </ul>
    </div>

    <!-- Alterações Recentes -->
    <div v-if="exibir.alteracoes" class="widget-card">
      <h3>Alterações Recentes</h3>
      <ul>
        <li v-for="(alt, index) in alteracoesRecentes" :key="index">
          {{ alt.usuario }} alterou {{ alt.campo }} em {{ alt.data }}
        </li>
      </ul>
    </div>

    <!-- Resumo de Custos -->
    <div v-if="exibir.custos" class="widget-card">
      <h3>Resumo de Custos</h3>
      <ul>
        <li v-for="(custo, index) in custosPorEtapa" :key="index">
          {{ custo.etapa }}: R$ {{ custo.valor }}
        </li>
      </ul>
    </div>

    <!-- Previsão do Tempo -->
    <div v-if="exibir.tempo" class="widget-card">
      <h3>Previsão do Tempo</h3>
      <p>{{ localizacaoProjeto.cidade }}, {{ localizacaoProjeto.estado }}</p>
      <p>Previsão: {{ previsaoTexto }}</p>
    </div>

    <!-- Status dos Projetos -->
    <div v-if="exibir.status" class="widget-card">
      <h3>Status dos Projetos</h3>
      <ul>
        <li v-for="(projeto, index) in projetos" :key="index">
          {{ projeto.nome }}: Em progresso
        </li>
      </ul>
    </div>

    <!-- Progresso das Etapas -->
    <div v-if="exibir.progresso" class="widget-card">
      <h3>Progresso das Etapas</h3>
      <ul>
        <li v-for="(etapa, index) in etapas" :key="index">
          {{ etapa.etapa }} - {{ etapa.progresso }}%
        </li>
      </ul>
    </div>

    <!-- Atividades Recentes -->
    <div v-if="exibir.atividades" class="widget-card">
      <h3>Atividades Recentes</h3>
      <ul>
        <li v-for="(log, index) in logsRecentes" :key="index">
          {{ log.usuario }} fez {{ log.acao }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    exibir: Object,
    alertas: Array,
    contagemProjetos: Object,
    logsRecentes: Array,
    alteracoesRecentes: Array,
    custosPorEtapa: Array,
    localizacaoProjeto: Object,
    previsaoTexto: String,
    projetos: Array,
    etapas: Array
  }
};
</script>

<style scoped>
.dashboard-widgets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
}
.widget-card {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  overflow-wrap: anywhere;
}
</style>
