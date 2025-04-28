<template>
  <div class="relatorios-view">
    <h1>Relatórios</h1>

    <div class="filtros">
      <label>Tipo:</label>
      <select v-model="tipoRelatorio">
        <option value="projetos">Projetos</option>
        <option value="custos">Custos por Etapa</option>
        <option value="logs">Logs e Alterações</option>
        <option value="completo">Resumo Completo</option>
      </select>

      <label v-if="tipoRelatorio !== 'completo'">Projeto:</label>
      <select v-if="tipoRelatorio !== 'completo'" v-model="filtros.projetoId">
        <option value="">Todos</option>
        <option v-for="projeto in projetos" :key="projeto.id" :value="projeto.id">{{ projeto.nome }}</option>
      </select>

      <label>Data Inicial:</label>
      <input type="date" v-model="filtros.dataInicio" />

      <label>Data Final:</label>
      <input type="date" v-model="filtros.dataFim" />

      <button @click="exportarPDF">Exportar PDF</button>
      <button @click="exportarExcel">Exportar Excel</button>
    </div>
  </div>
</template>

<script>
import { gerarPDF } from '@/services/pdfService';
import { gerarExcel } from '@/services/excelService';
import { db } from '@/services/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default {
  data() {
    return {
      tipoRelatorio: 'projetos',
      filtros: {
        projetoId: '',
        dataInicio: '',
        dataFim: ''
      },
      projetos: []
    };
  },
  methods: {
    async exportarPDF() {
      await gerarPDF(this.tipoRelatorio, this.filtros);
    },
    async exportarExcel() {
      await gerarExcel(this.tipoRelatorio, this.filtros);
    },
    async carregarProjetos() {
      const querySnapshot = await getDocs(collection(db, "projetos"));
      this.projetos = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        this.projetos.push({ id: doc.id, nome: data.nome });
      });
    }
  },
  mounted() {
    this.carregarProjetos();
  }
};
</script>
