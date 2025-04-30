<template>
  <div class="cronograma-view">
    <h1>Cronograma</h1>
    <label for="tipoCronograma">Tipo de Cronograma:</label>
    <select v-model="tipoSelecionado" id="tipoCronograma">
      <option value="etapas">Etapas da Obra</option>
      <option value="tarefas">Tarefas</option>
      <option value="gastos">Gasto por Item</option>
    </select>

    <label for="modoVisualizacao">Modo de Visualização:</label>
    <select v-model="modoVisualizacao" id="modoVisualizacao">
      <option value="gantt">Linha do Tempo</option>
      <option value="calendario">Calendário</option>
    </select>

    <div class="botoes-controle">
      <button @click="abrirModalAdicao">Adicionar {{ tipoSelecionado }}</button>
      <button @click="salvarAlteracoes">Salvar Alterações</button>
      <button @click="exportarCronograma">Exportar Cronograma</button>
    </div>

    <CronogramaGantt v-if="modoVisualizacao === 'gantt'" :dados="dadosCronograma" @atualizarDatas="atualizarDatas" @excluirItem="excluirItem" />
    <CronogramaCalendario v-if="modoVisualizacao === 'calendario'" :dados="dadosCronograma" @excluirItem="excluirItem" />

    <!-- Modal Customizado -->
    <div v-if="mostrarModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ itemEdicao.id ? 'Editar' : 'Adicionar' }} {{ tipoSelecionado }}</h3>
        <label>Nome:</label>
        <input v-model="itemEdicao.nome" type="text" />
        <label>Data de Início:</label>
        <input v-model="itemEdicao.dataInicio" type="date" />
        <label>Data de Fim:</label>
        <input v-model="itemEdicao.dataFim" type="date" />
        <div class="modal-botoes">
          <button @click="salvarItem">Salvar</button>
          <button @click="fecharModal">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CronogramaGantt from '@/components/CronogramaGantt.vue';
import CronogramaCalendario from '@/components/CronogramaCalendario.vue';

import { db } from '@/services/firebase';
import { collection, getDocs, updateDoc, addDoc, deleteDoc, doc } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default {
  components: { CronogramaGantt, CronogramaCalendario },
  data() {
    return {
      tipoSelecionado: 'etapas',
      modoVisualizacao: 'gantt',
      dadosEtapas: [],
      dadosTarefas: [],
      dadosGastos: [],
      mostrarModal: false,
      itemEdicao: { nome: '', dataInicio: '', dataFim: '', id: null }
    };
  },
  computed: {
    dadosCronograma() {
      if (this.tipoSelecionado === 'etapas') return this.dadosEtapas;
      if (this.tipoSelecionado === 'tarefas') return this.dadosTarefas;
      return this.dadosGastos;
    }
  },
  mounted() {
    this.carregarDadosFirebase();
  },
  methods: {
    async carregarDadosFirebase() {
      const etapasSnapshot = await getDocs(collection(db, "etapas"));
      this.dadosEtapas = etapasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const tarefasSnapshot = await getDocs(collection(db, "tarefas"));
      this.dadosTarefas = tarefasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const gastosSnapshot = await getDocs(collection(db, "gastos"));
      this.dadosGastos = gastosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    atualizarDatas(itemAtualizado) {
      const lista = this.dadosCronograma;
      const index = lista.findIndex(item => item.id === itemAtualizado.id);
      if (index !== -1) {
        lista[index].dataInicio = itemAtualizado.dataInicio;
        lista[index].dataFim = itemAtualizado.dataFim;
      }
    },
    abrirModalAdicao() {
      this.itemEdicao = { nome: '', dataInicio: '', dataFim: '', id: null };
      this.mostrarModal = true;
    },
    async salvarItem() {
      if (this.itemEdicao.nome && this.itemEdicao.dataInicio && this.itemEdicao.dataFim) {
        if (this.itemEdicao.id) {
          const ref = doc(db, this.tipoSelecionado, this.itemEdicao.id);
          await updateDoc(ref, {
            nome: this.itemEdicao.nome,
            dataInicio: this.itemEdicao.dataInicio,
            dataFim: this.itemEdicao.dataFim
          });
        } else {
          const ref = await addDoc(collection(db, this.tipoSelecionado), {
            nome: this.itemEdicao.nome,
            dataInicio: this.itemEdicao.dataInicio,
            dataFim: this.itemEdicao.dataFim
          });
          this.itemEdicao.id = ref.id;
          this.dadosCronograma.push({ ...this.itemEdicao });
        }
        this.mostrarModal = false;
        alert('Item salvo com sucesso!');
      }
    },
    fecharModal() {
      this.mostrarModal = false;
    },
    async excluirItem(id) {
      await deleteDoc(doc(db, this.tipoSelecionado, id));
      const lista = this.dadosCronograma;
      const index = lista.findIndex(item => item.id === id);
      if (index !== -1) lista.splice(index, 1);
    },
    async salvarAlteracoes() {
      const lista = this.dadosCronograma;
      for (const item of lista) {
        const ref = doc(db, this.tipoSelecionado, item.id);
        await updateDoc(ref, {
          dataInicio: item.dataInicio,
          dataFim: item.dataFim
        });
      }
      alert('Alterações salvas com sucesso!');
    },
    exportarCronograma() {
      html2canvas(document.querySelector(".cronograma-view"), { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'pt', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save("cronograma.pdf");
      });
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.modal-botoes {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
