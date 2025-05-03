<template>
  <div class="cronograma-gantt-view">
    <div class="filtros-barra">
      <label>Tipo:</label>
      <select :value="tipoSelecionado" @change="$emit('update:tipoSelecionado', $event.target.value)">
        <option value="etapas">Etapas</option>
        <option value="tarefas">Tarefas</option>
        <option value="execucoes">Execuções</option>
        <option value="diario">Diário de Obra</option>
      </select>

      <label>Período:</label>
      <input type="date" :value="filtroInicio" @change="$emit('update:filtroInicio', $event.target.value)" />
      <input type="date" :value="filtroFim" @change="$emit('update:filtroFim', $event.target.value)" />

      <label>Zoom:</label>
      <select :value="zoom" @change="$emit('update:zoom', $event.target.value)">
        <option value="day">Dia</option>
        <option value="week">Semana</option>
        <option value="month">Mês</option>
        <option value="year">Ano</option>
      </select>
    </div>

    <div ref="ganttContainer" class="gantt-wrapper"></div>

    <transition name="fade">
      <div v-if="detalhes" class="detalhes-modal">
        <h3>{{ detalhes.text }}</h3>
        <p><strong>Início:</strong> {{ formatarData(detalhes.start_date) }}</p>
        <p><strong>Fim:</strong> {{ formatarData(detalhes.end_date) }}</p>
        <p v-if="detalhes.ProjetoNome"><strong>Projeto:</strong> {{ detalhes.ProjetoNome }}</p>
        <p v-if="detalhes.EtapaNome"><strong>Etapa:</strong> {{ detalhes.EtapaNome }}</p>
        <p v-if="detalhes.tipo"><strong>Tipo:</strong> {{ detalhes.tipo }}</p>
        <button @click="detalhes = null">Fechar</button>
      </div>
    </transition>
  </div>
</template>

<script>
import dayjs from "dayjs";
import gantt from "dhtmlx-gantt";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";

export default {
  name: 'CronogramaGantt',
  props: {
    dados: Array,
    tipoSelecionado: String,
    filtroInicio: String,
    filtroFim: String,
    zoom: String
  },
  data() {
    return {
      detalhes: null
    };
  },
  methods: {
    formatarData(data) {
      if (!data) return '—';
      return dayjs(data).format('DD/MM/YYYY');
    },
    mostrarDetalhes(task) {
      this.detalhes = task;
    },
    getCorPorTipo(tipo) {
      switch (tipo) {
        case 'etapas': return '#3b82f6';
        case 'tarefas': return '#f59e0b';
        case 'execucoes': return '#10b981';
        case 'diario': return '#6b7280';
        default: return '#9ca3af';
      }
    },
    configurarZoom() {
      switch (this.zoom) {
        case 'day':
          gantt.config.scale_unit = "day";
          gantt.config.date_scale = "%d/%m";
          gantt.config.subscales = [];
          break;
        case 'week':
          gantt.config.scale_unit = "week";
          gantt.config.date_scale = "Semana %W";
          gantt.config.subscales = [{ unit: "day", step: 1, date: "%D" }];
          break;
        case 'month':
          gantt.config.scale_unit = "month";
          gantt.config.date_scale = "%M %Y";
          gantt.config.subscales = [{ unit: "day", step: 1, date: "%d" }];
          break;
        case 'year':
          gantt.config.scale_unit = "year";
          gantt.config.date_scale = "%Y";
          gantt.config.subscales = [{ unit: "month", step: 1, date: "%M" }];
          break;
      }
    },
    renderizarGantt() {
      gantt.clearAll();
      this.configurarZoom();
      gantt.init(this.$refs.ganttContainer);

      const inicio = this.filtroInicio ? dayjs(this.filtroInicio) : null;
      const fim = this.filtroFim ? dayjs(this.filtroFim) : null;

      let tarefas = (this.dados || [])
        .filter(item => item.dataInicio && item.dataFim)
        .filter(item => {
          const inicioItem = dayjs(item.dataInicio);
          const fimItem = dayjs(item.dataFim);
          return (!inicio || fimItem.isAfter(inicio.subtract(1, 'day')))
              && (!fim || inicioItem.isBefore(fim.add(1, 'day')));
        })
        .map(item => ({
          id: item.id,
          text: item.nome || item.NomeEtapa || item.NomeTarefa || 'Item',
          start_date: dayjs(item.dataInicio).format('YYYY-MM-DD'),
          end_date: dayjs(item.dataFim).format('YYYY-MM-DD'),
          ProjetoNome: item.ProjetoNome || '',
          EtapaNome: item.EtapaNome || '',
          tipo: this.tipoSelecionado,
          color: this.getCorPorTipo(this.tipoSelecionado)
        }));

      gantt.templates.tooltip_text = function (start, end, task) {
        return `<b>${task.text}</b><br/><b>Início:</b> ${start.toLocaleDateString()}<br/><b>Fim:</b> ${end.toLocaleDateString()}`;
      };

      gantt.parse({ data: tarefas });

      gantt.attachEvent("onTaskClick", (id) => {
        const tarefa = tarefas.find(t => t.id === id);
        this.mostrarDetalhes(tarefa);
        return true;
      });
    }
  },
  mounted() {
    this.renderizarGantt();
  },
  watch: {
    dados: { handler() { this.renderizarGantt(); }, deep: true },
    tipoSelecionado() { this.renderizarGantt(); },
    filtroInicio() { this.renderizarGantt(); },
    filtroFim() { this.renderizarGantt(); },
    zoom() { this.renderizarGantt(); }
  }
};
</script>

<style scoped>
.cronograma-gantt-view {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.filtros-barra {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.filtros-barra label {
  font-size: 0.85rem;
  font-weight: 600;
  margin-right: 0.25rem;
}
.filtros-barra select,
.filtros-barra input[type="date"] {
  font-size: 0.8rem;
  padding: 0.2rem 0.3rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  max-width: 140px;
}
.gantt-wrapper {
  width: 100%;
  height: 60vh;
  max-height: 600px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  background: #fff;
}
.detalhes-modal {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  z-index: 999;
  max-width: 300px;
  transition: all 0.3s ease;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
