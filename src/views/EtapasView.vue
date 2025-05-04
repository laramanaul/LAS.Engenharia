<template>
  <div class="etapas-view">
    <h2>Cadastro de Etapas</h2>

    <div class="topo-controles">
      <div style="display: flex; gap: 1rem; align-items: center; width: 100%;">
        <button class="botao-destaque" @click="abrirFormulario = true">➕ Nova Etapa</button>
        <input type="text" v-model="filtroBusca" placeholder="Buscar etapas..." class="campo-busca" />
      </div>

      <!-- Botões de filtro por status -->
      <div class="filtro-botoes-status">
        <label>Status:</label>
        <div class="filtro-botoes">
          <button
            :class="{ ativo: filtrosStatus.includes('Pendente') }"
            @click="alternarStatus('Pendente')"
          >
            Pendente
          </button>
          <button
            :class="{ ativo: filtrosStatus.includes('Em Andamento') }"
            @click="alternarStatus('Em Andamento')"
          >
            Em Andamento
          </button>
          <button
            :class="{ ativo: filtrosStatus.includes('Concluída') }"
            @click="alternarStatus('Concluída')"
          >
            Concluída
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Formulário -->
    <div v-if="abrirFormulario" class="modal-overlay">
      <div class="modal">
        <h3>{{ editandoId ? 'Editar Etapa' : 'Nova Etapa' }}</h3>

        <div class="formulario-projeto">
          <div class="form-coluna">
            <label>Fase da Obra</label>
            <select v-model="faseSelecionada">
              <option disabled value="">Selecione a fase</option>
              <option v-for="fase in fasesDisponiveisOrdenadas" :key="fase" :value="fase">{{ fase }}</option>
            </select>
          </div>

          <div class="form-coluna">
            <label>Etapa Padrão</label>
            <select v-model="etapaSelecionadaId" @change="preencherCamposEtapa">
              <option disabled value="">Selecione a etapa</option>
              <option v-for="etapa in etapasFiltradasPorFase" :key="etapa.id" :value="etapa.id">
                {{ etapa.NomeEtapa }} ({{ etapa.FaseObra }})
              </option>
            </select>
          </div>

          <div class="form-coluna">
            <label>Status</label>
            <select v-model="novaEtapa.Status" required>
              <option disabled value="">Selecione o status</option>
              <option>Pendente</option>
              <option>Em Andamento</option>
              <option>Concluída</option>
            </select>
          </div>

          <div class="form-linha">
            <div class="form-coluna" style="flex: 1 1 20%;">
              <label>Data de Início Prevista</label>
              <input type="date" v-model="novaEtapa.DataInicioPrevista" required />
            </div>
            <div class="form-coluna"style="flex: 1 1 20%;">
              <label>Data de Término Previsto</label>
              <input type="date" v-model="novaEtapa.DataTerminoPrevisto" required />
            </div>
          </div>
         <div class="form-coluna"style="flex: 1 1 40%;">
            <label>Anotações</label>
            <textarea v-model="novaEtapa.Anotacoes" placeholder="Observações adicionais..."></textarea>
          </div>
        </div>


          <div class="form-coluna">
            <label>Projetos Vinculados</label>
            <ul class="checkbox-list">
              <li v-for="projeto in projetosDisponiveis" :key="projeto.id">
                <label>
                  <input type="checkbox" :value="projeto.id" v-model="novaEtapa.ProjetosVinculados" />
                  {{ projeto.NomeProjeto }}
                </label>
              </li>
            </ul>
          </div>

        <div class="modal-actions">
          <button class="botao-destaque" @click="salvarEtapa">
            {{ editandoId ? 'Atualizar' : 'Adicionar' }} Etapa
          </button>
          <button class="botao" @click="cancelarEdicao">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Lista de Etapas Cadastradas -->
    <div class="tabela-container">
      <table class="projetos-tabela">
        <thead>
          <tr>
            <th>Ações</th>
            <th>Etapa</th>
            <th>Fase</th>
            <th>Status</th>
            <th>Início</th>
            <th>Término</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="etapa in etapasFiltradas" :key="etapa.id">
            <td>
              <div class="acoes-wrapper">
                <button class="botao-editar" @click="editarEtapa(etapa)">✏️</button>
                <button class="botao-excluir" @click="excluirEtapa(etapa.id)">🗑️</button>
              </div>
            </td>
            <td>{{ etapa.NomeEtapa }}</td>
            <td>{{ etapa.FaseObra }}</td>
            <td>
              <span :class="['status-badge', etapa.Status.toLowerCase().replace(' ', '-')]">
                {{ etapa.Status }}
              </span>
            </td>
            <td>{{ formatarData(etapa.DataInicioPrevista) }}</td>
            <td>{{ formatarData(etapa.DataTerminoPrevisto) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc
} from 'firebase/firestore';

export default {
  props: {
    user: Object,
    organizacaoId: String
  },
  data() {
    return {
      etapas: [],
      projetosDisponiveis: [],
      etapasPadrao: [],
      faseSelecionada: '',
      etapaSelecionadaId: '',
      novaEtapa: {
        NomeEtapa: '',
        FaseObra: '',
        DataInicioPrevista: '',
        DataTerminoPrevisto: '',
        Status: '',
        ProjetosVinculados: [],
        Anotacoes: ''
      },
      abrirFormulario: false,
      filtroBusca: '',
      filtrosStatus: ['Pendente', 'Em Andamento', 'Concluída'],
      editandoId: ''
    };
  },
  computed: {
    fasesDisponiveisOrdenadas() {
      const fases = [...new Set(this.etapasPadrao.map(e => e.FaseObra))];
      return fases.sort((a, b) => a.localeCompare(b, 'pt', { numeric: true }));
    },
    etapasFiltradasPorFase() {
      return this.etapasPadrao.filter(e => e.FaseObra === this.faseSelecionada);
    },
    etapasFiltradas() {
      const busca = this.filtroBusca.trim().toLowerCase();
      return this.etapas
        .filter(e => this.filtrosStatus.includes(e.Status))
        .filter(e =>
          (e.NomeEtapa || '').toLowerCase().includes(busca) ||
          (e.FaseObra || '').toLowerCase().includes(busca) ||
          (e.Status || '').toLowerCase().includes(busca)
        );
    }
  },
  methods: {
    alternarStatus(status) {
      if (this.filtrosStatus.includes(status)) {
        this.filtrosStatus = this.filtrosStatus.filter(s => s !== status);
      } else {
        this.filtrosStatus.push(status);
      }
    },
    formatarData(dataStr) {
      if (!dataStr) return '';
      const data = new Date(dataStr);
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    },
    async carregarEtapasPadrao() {
      const snap = await getDocs(collection(db, 'etapasPadrao'));
      this.etapasPadrao = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async carregarProjetosDisponiveis() {
      const snap = await getDocs(collection(db, 'projetos'));
      this.projetosDisponiveis = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => p.organizacaoId === this.organizacaoId);
    },
    async carregarEtapas() {
      const snap = await getDocs(collection(db, 'etapas'));
      this.etapas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(e => e.organizacaoId === this.organizacaoId);
    },
    preencherCamposEtapa() {
      const etapa = this.etapasPadrao.find(e => e.id === this.etapaSelecionadaId);
      if (etapa) {
        this.novaEtapa.NomeEtapa = etapa.NomeEtapa;
        this.novaEtapa.FaseObra = etapa.FaseObra;
      }
    },
    async salvarEtapa() {
      if (!this.organizacaoId || !this.user?.uid) return;
      const data = {
        ...this.novaEtapa,
        organizacaoId: this.organizacaoId,
        criadoPor: this.user.uid,
        dataCriacao: new Date()
      };
      if (this.editandoId) {
        await updateDoc(doc(db, 'etapas', this.editandoId), data);
      } else {
        await addDoc(collection(db, 'etapas'), data);
      }
      this.cancelarEdicao();
      this.carregarEtapas();
    },
    editarEtapa(etapa) {
      this.novaEtapa = { ...etapa };
      this.editandoId = etapa.id;
      this.abrirFormulario = true;
      this.faseSelecionada = etapa.FaseObra;
      const etapaEncontrada = this.etapasPadrao.find(e => e.NomeEtapa === etapa.NomeEtapa);
      if (etapaEncontrada) this.etapaSelecionadaId = etapaEncontrada.id;
    },
    cancelarEdicao() {
      this.abrirFormulario = false;
      this.editandoId = '';
      this.faseSelecionada = '';
      this.etapaSelecionadaId = '';
      this.novaEtapa = {
        NomeEtapa: '',
        FaseObra: '',
        DataInicioPrevista: '',
        DataTerminoPrevisto: '',
        Status: '',
        ProjetosVinculados: [],
        Anotacoes: ''
      };
    },
    async excluirEtapa(id) {
      if (confirm('Deseja excluir esta etapa?')) {
        await deleteDoc(doc(db, 'etapas', id));
        this.carregarEtapas();
      }
    }
  },
  mounted() {
    this.carregarEtapasPadrao();
    this.carregarProjetosDisponiveis();
    this.carregarEtapas();
  }
};
</script>
