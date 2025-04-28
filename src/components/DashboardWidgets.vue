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
    <div v-if="exibir.logs" class="widget-card">
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
    <div v-if="exibir.graficoCustos" class="widget-card">
      <h3>Previsão do Tempo</h3>
      <p>{{ localizacaoProjeto.cidade }}, {{ localizacaoProjeto.estado }}</p>
      <p>Previsão: {{ previsaoTexto }}</p>
    </div>

    <!-- Gráfico de Custos -->
    <div v-if="exibir.graficoCustos" class="widget-card">
      <h3>Gráfico de Custos</h3>
      <canvas ref="graficoCustos"></canvas>
    </div>

    <!-- Status dos Projetos -->
    <div v-if="exibir.graficoStatus" class="widget-card">
      <h3>Status dos Projetos</h3>
      <ul>
        <li v-for="(projeto, index) in projetos" :key="index">
          {{ projeto.nome }}: Em progresso
        </li>
      </ul>
    </div>

    <!-- Progresso das Etapas -->
    <div v-if="exibir.graficoProgresso" class="widget-card">
      <h3>Progresso das Etapas</h3>
      <ul>
        <li v-for="(etapa, index) in custosPorEtapa" :key="index">
          {{ etapa.etapa }} - {{ etapa.progresso }}%
        </li>
      </ul>
    </div>

    <!-- Atividades Recentes -->
    <div v-if="exibir.graficoLogs" class="widget-card">
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
import { onMounted, ref } from 'vue';
import Chart from 'chart.js/auto';

export default {
  props: {
    alertas: { type: Array, default: () => [] },
    contagemProjetos: { type: Object, default: () => ({ total: 0, andamento: 0, finalizados: 0 }) },
    logsRecentes: { type: Array, default: () => [] },
    alteracoesRecentes: { type: Array, default: () => [] },
    custosPorEtapa: { type: Array, default: () => [] },
    projetoSelecionado: { type: String, default: '' },
    localizacaoProjeto: { type: Object, default: () => ({ cidade: '', estado: '' }) },
    projetos: { type: Array, default: () => [] },
    exibir: { type: Object, default: () => ({ alertas: true, projetos: true, logs: true, custos: true, graficoCustos: true, graficoStatus: true, graficoProgresso: true, graficoLogs: true }) }
  },
  setup(props) {
    const previsaoTexto = ref('Carregando...');
    const graficoCustos = ref(null);

    onMounted(() => {
      previsaoTexto.value = 'Ensolarado, 25°C'; // Mock ou API

      if (graficoCustos.value) {
        const ctx = graficoCustos.value.getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: props.custosPorEtapa.map(c => c.etapa),
            datasets: [{
              label: 'Custos (R$)',
              data: props.custosPorEtapa.map(c => c.valor),
              backgroundColor: '#007bff'
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } }
          }
        });
      }
    });

    return { previsaoTexto, graficoCustos };
  }
};
</script>
