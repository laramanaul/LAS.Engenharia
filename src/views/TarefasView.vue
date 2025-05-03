<template>
  <div class="tarefas-view projetos-view">
    <h2>Tarefas</h2>

    <!-- Controles superiores -->
    <div class="topo-controles">
      <button class="botao-destaque" @click="abrirFormularioTarefa">➕ Nova Tarefa</button>
      <input type="text" v-model="filtroBusca" placeholder="Buscar tarefas..." class="campo-busca" />
    </div>

    <!-- Modal de cadastro/edição -->
    <div v-if="formularioAberto" class="modal-overlay">
      <div class="modal">
        <h3>{{ editandoId ? 'Editar Tarefa' : 'Nova Tarefa' }}</h3>

        <div class="formulario-projeto">
          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Data de Lançamento</label>
            <input type="date" v-model="tarefaAtual.DataLancamento" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Previsão de Conclusão</label>
            <input type="date" v-model="tarefaAtual.PrevisaoConclusao" />
          </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Demanda</label>
            <input v-model="tarefaAtual.Demanda" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Responsável</label>
            <input v-model="tarefaAtual.Responsavel" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Etapa Associada</label>
            <select v-model="tarefaAtual.EtapaID">
              <option disabled value="">Selecione a etapa</option>
              <option v-for="e in etapasDisponiveisFiltradas" :key="e.id" :value="e.id">{{ e.NomeEtapa }}</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Observações</label>
            <textarea v-model="tarefaAtual.Observacoes" rows="3" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="botao-destaque" @click="salvarTarefa">
            {{ editandoId ? 'Atualizar' : 'Adicionar' }} Tarefa
          </button>
          <button class="botao" @click="cancelarEdicao">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Colunas Kanban -->
    <div class="kanban-board">
      <div
        v-for="status in ['Pendente', 'Em Andamento', 'Concluído']"
        :key="status"
        class="kanban-coluna"
        @dragover.prevent
        @drop="soltarTarefa($event, status)"
        @dragenter="colunaEmFoco = status"
        @dragleave="colunaEmFoco = ''"
        :class="{ dragover: colunaEmFoco === status }"
      >
        <h3>{{ status }}</h3>
        <div
          v-for="tarefa in tarefasFiltradas(status)"
          :key="tarefa.id"
          class="kanban-card"
          draggable="true"
          @dragstart="iniciarArrasto(tarefa)"
        >
          <div class="kanban-topo">
            <strong>{{ tarefa.Demanda }}</strong>
            <span class="data">{{ formatarData(tarefa.PrevisaoConclusao) }}</span>
          </div>
          <p><strong>Responsável:</strong> {{ tarefa.Responsavel }}</p>
          <p><strong>Etapa:</strong>
            <select v-model="tarefa.EtapaID" @change="atualizarEtapaTarefa(tarefa)">
              <option disabled value="">Selecione</option>
              <option v-for="e in etapasDisponiveisFiltradas" :key="e.id" :value="e.id">{{ e.NomeEtapa }}</option>
            </select>
          </p>
          <p><strong>Obs:</strong> {{ tarefa.Observacoes || '—' }}</p>

          <div class="acoes-wrapper">
            <button class="botao-editar" @click="editarTarefa(tarefa)">✏️</button>
            <button class="botao-excluir" @click="excluirTarefa(tarefa.id)">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import { db } from '../firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp
} from 'firebase/firestore';

export default {
  name: 'TarefasView',
  props: {
    user: Object,
    organizacaoId: String,
    projetoAtivo: String
  },
  data() {
    const hoje = new Date().toISOString().split('T')[0];
    return {
      colunaEmFoco: '',
      tarefas: [],
      etapas: [],
      tarefaAtual: {
        DataLancamento: hoje,
        PrevisaoConclusao: hoje,
        Demanda: '',
        Responsavel: '',
        Observacoes: '',
        Status: 'Pendente',
        ProjetoID: this.projetoAtivo,
        EtapaID: ''
      },
      filtroBusca: '',
      formularioAberto: false,
      editandoId: '',
      tarefaArrastada: null
    };
  },
  computed: {
    etapasDisponiveisFiltradas() {
      return this.etapas.filter(e =>
        (e.ProjetosVinculados || []).includes(this.projetoAtivo) &&
        e.organizacaoId === this.organizacaoId &&
        (e.criadoPor === this.user.uid || (e.allowedUsers || []).includes(this.user.uid))
      ).sort((a, b) => a.NomeEtapa.localeCompare(b.NomeEtapa));
    }
  },
  watch: {
    projetoAtivo(novo) {
      if (novo) {
        this.carregarTarefas();
        this.carregarEtapas();
      }
    },
    organizacaoId(novo) {
      if (novo) {
        this.carregarEtapas();
      }
    }
  },
  methods: {
    formatarData(data) {
      const d = data?.toDate?.() || new Date(data);
      return d.toLocaleDateString();
    },
    async carregarTarefas() {
      if (!this.projetoAtivo) return;
      const snapshot = await getDocs(collection(db, 'tarefas'));
      this.tarefas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(t => t.ProjetoID === this.projetoAtivo);
    },
    async carregarEtapas() {
      if (!this.organizacaoId || !this.projetoAtivo) return;
      const snapshot = await getDocs(collection(db, 'etapas'));
      this.etapas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    tarefasFiltradas(status) {
      const texto = this.filtroBusca.toLowerCase();
      return this.tarefas
        .filter(t => t.Status === status)
        .filter(t =>
          (t.Demanda || '').toLowerCase().includes(texto) ||
          (t.Responsavel || '').toLowerCase().includes(texto)
        )
        .sort((a, b) => (a.PrevisaoConclusao || '').localeCompare(b.PrevisaoConclusao));
    },
    abrirFormularioTarefa() {
      const hoje = new Date().toISOString().split('T')[0];
      this.tarefaAtual = {
        DataLancamento: hoje,
        PrevisaoConclusao: hoje,
        Demanda: '',
        Responsavel: '',
        Observacoes: '',
        Status: 'Pendente',
        ProjetoID: this.projetoAtivo,
        EtapaID: ''
      };
      this.editandoId = '';
      this.formularioAberto = true;
    },
    cancelarEdicao() {
      this.formularioAberto = false;
      this.editandoId = '';
    },
    async salvarTarefa() {
      const dados = {
        ...this.tarefaAtual,
        DataLancamento: Timestamp.fromDate(new Date(this.tarefaAtual.DataLancamento)),
        PrevisaoConclusao: Timestamp.fromDate(new Date(this.tarefaAtual.PrevisaoConclusao)),
        ProjetoID: this.projetoAtivo
      };

      try {
        if (this.editandoId) {
          await updateDoc(doc(db, 'tarefas', this.editandoId), dados);
        } else {
          await addDoc(collection(db, 'tarefas'), dados);
        }
        this.cancelarEdicao();
        this.carregarTarefas();
      } catch (err) {
        console.error('Erro ao salvar tarefa:', err);
      }
    },
    editarTarefa(tarefa) {
      this.tarefaAtual = {
        ...tarefa,
        DataLancamento: tarefa.DataLancamento?.toDate?.().toISOString().split('T')[0] || '',
        PrevisaoConclusao: tarefa.PrevisaoConclusao?.toDate?.().toISOString().split('T')[0] || ''
      };
      this.editandoId = tarefa.id;
      this.formularioAberto = true;
    },
    async excluirTarefa(id) {
      if (confirm('Deseja excluir esta tarefa?')) {
        try {
          await deleteDoc(doc(db, 'tarefas', id));
          this.carregarTarefas();
        } catch (err) {
          console.error('Erro ao excluir tarefa:', err);
        }
      }
    },
    iniciarArrasto(tarefa) {
      this.tarefaArrastada = tarefa;
    },
    async soltarTarefa(event, novoStatus) {
      if (!this.tarefaArrastada) return;
      try {
        await updateDoc(doc(db, 'tarefas', this.tarefaArrastada.id), { Status: novoStatus });
        this.carregarTarefas();
        this.tarefaArrastada = null;
      } catch (err) {
        console.error('Erro ao mover tarefa:', err);
      }
    },
    async atualizarEtapaTarefa(tarefa) {
      try {
        await updateDoc(doc(db, 'tarefas', tarefa.id), { EtapaID: tarefa.EtapaID });
        this.carregarTarefas();
      } catch (err) {
        console.error('Erro ao atualizar etapa:', err);
      }
    }
  },
  mounted() {
    this.carregarTarefas();
    this.carregarEtapas();
  }
};
</script>
