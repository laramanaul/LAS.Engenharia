<template>
  <div class="gantt-container">
    <div class="gantt-header">
      <span v-for="(dia, index) in diasEscala" :key="index" class="gantt-dia">{{ dia }}</span>
    </div>
    <div v-for="(item, index) in dados" :key="index" class="gantt-row">
      <div class="gantt-label">
        {{ item.nome }}
        <input type="date" v-model="item.dataInicio" @change="emitirAtualizacao(item)" />
        <input type="date" v-model="item.dataFim" @change="emitirAtualizacao(item)" />
      </div>
      <div class="gantt-bar" :style="calcularEstiloBarra(item)"></div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['dados'],
  computed: {
    diasEscala() {
      const dias = [];
      const inicio = new Date(Math.min(...this.dados.map(item => new Date(item.dataInicio).getTime())));
      const fim = new Date(Math.max(...this.dados.map(item => new Date(item.dataFim).getTime())));
      for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
        dias.push(new Date(d).toLocaleDateString());
      }
      return dias;
    }
  },
  methods: {
    calcularEstiloBarra(item) {
      const inicioGlobal = new Date(Math.min(...this.dados.map(i => new Date(i.dataInicio).getTime())));
      const fimGlobal = new Date(Math.max(...this.dados.map(i => new Date(i.dataFim).getTime())));
      const totalDias = (fimGlobal - inicioGlobal) / (1000 * 60 * 60 * 24);

      const inicio = new Date(item.dataInicio);
      const fim = new Date(item.dataFim);
      const inicioDia = (inicio - inicioGlobal) / (1000 * 60 * 60 * 24);
      const duracao = (fim - inicio) / (1000 * 60 * 60 * 24);

      return {
        width: `${(duracao / totalDias) * 100}%`,
        marginLeft: `${(inicioDia / totalDias) * 100}%`
      };
    },
    emitirAtualizacao(item) {
      this.$emit('atualizarDatas', item);
    }
  }
};
</script>

