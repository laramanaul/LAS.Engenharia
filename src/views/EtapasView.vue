<template>
  <div class="etapas-view projetos-view">
    <h2>Lançamento de Etapas</h2>

    <!-- Controles superiores -->
    <div class="topo-controles">
      <button class="botao-destaque" @click="abrirFormulario = true">➕ Nova Etapa</button>
      <input type="text" v-model="filtroBusca" placeholder="Buscar etapas..." class="campo-busca" />
    </div>

    <!-- Modal de formulário -->
    <div v-if="abrirFormulario" class="modal-overlay">
      <div class="modal">
        <h3>{{ editandoId ? 'Editar Etapa' : 'Nova Etapa' }}</h3>

        <div class="formulario-projeto">
        <div class="modal-actions">
          <button class="botao-destaque" @click="salvarEtapa">
            {{ editandoId ? 'Atualizar' : 'Adicionar' }} Etapa
          </button>
          <button class="botao" @click="cancelarEdicao">Cancelar</button>
        </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Nome da Etapa</label>
            <input v-model="novaEtapa.NomeEtapa" placeholder="Nome da etapa" required />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Data Estimada para Início</label>
            <input type="date" v-model="novaEtapa.DataInicioEstimada" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Data Estimada para Término</label>
            <input type="date" v-model="novaEtapa.DataTerminoEstimada" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Status</label>
            <select v-model="novaEtapa.Status" required>
              <option disabled value="">Selecione o status</option>
              <option>Pendente</option>
              <option>Em Andamento</option>
              <option>Concluída</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Anotações</label>
            <textarea v-model="novaEtapa.Anotacoes" rows="3" placeholder="Observações adicionais..."></textarea>
          </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Projetos Vinculados</label>
            <div class="checkbox-grid">
              <label
                v-for="projeto in projetosDisponiveis"
                :key="projeto.id"
                class="checkbox-item"
              >
                <input
                  type="checkbox"
                  :value="projeto.id"
                  v-model="novaEtapa.ProjetosVinculados"
                />
                {{ projeto.NomeProjeto }}
              </label>
            </div>
          </div>
        </div>


      </div>
    </div>

    <!-- Tabela de etapas -->
    <div class="tabela-container">
      <div v-if="!etapasFiltradas.length" style="margin: 1rem 0; color: #a00;">
        ⚠️ Nenhuma etapa encontrada.
      </div>

      <table v-else class="projetos-tabela">
        <thead>
          <tr>
            <th>Ações</th>
            <th>Etapa</th>
            <th>Início</th>
            <th>Término</th>
            <th>Status</th>
            <th>Projetos</th>
            <th>Anotações</th>

          </tr>
        </thead>
        <tbody>
          <tr
            v-for="etapa in etapasFiltradas"
            :key="etapa.id"
            :class="{ selecionado: etapaSelecionada === etapa.id }"
          >
            <td>
              <div class="acoes-wrapper">
                <button class="botao-editar" @click="editarEtapa(etapa)">✏️</button>
                <button class="botao-excluir" @click="excluirEtapa(etapa.id)">🗑️</button>
              </div>
            </td>
            <td>{{ etapa.NomeEtapa || '—' }}</td>
            <td>{{ etapa.DataInicioEstimada || '—' }}</td>
            <td>{{ etapa.DataTerminoEstimada || '—' }}</td>
            <td>{{ etapa.Status || '—' }}</td>
            <td>
              <ul v-if="etapa.ProjetosVinculados && etapa.ProjetosVinculados.length">
                <li v-for="pid in etapa.ProjetosVinculados" :key="pid">{{ pid }}</li>
              </ul>
              <span v-else>—</span>
            </td>
            <td>{{ etapa.Anotacoes || '—' }}</td>

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
  name: 'EtapasView',
  props: {
    user: Object,
    organizacaoId: String
  },
  data() {
    return {
      etapas: [],
      etapaSelecionada: '',
      editandoId: '',
      abrirFormulario: false,
      filtroBusca: '',
      projetosDisponiveis: [],
      novaEtapa: {
        NomeEtapa: '',
        DataInicioEstimada: '',
        DataTerminoEstimada: '',
        Status: '',
        Anotacoes: '',
        ProjetosVinculados: []
      }
    };
  },
  computed: {
    etapasFiltradas() {
      const termo = this.filtroBusca?.toLowerCase().trim();
      if (!termo) return this.etapas;

      return this.etapas.filter(e =>
        (e.NomeEtapa || '').toLowerCase().includes(termo) ||
        (e.Status || '').toLowerCase().includes(termo)
      );
    }
  },
  watch: {
    organizacaoId(nova) {
      if (nova && this.user?.uid) {
        this.carregarEtapas();
        this.carregarProjetosDisponiveis();
      }
    },
    user: {
      handler(novo) {
        if (novo?.uid && this.organizacaoId) {
          this.carregarEtapas();
          this.carregarProjetosDisponiveis();
        }
      },
      deep: true
    }
  },
  methods: {
    async carregarEtapas() {
      if (!this.organizacaoId || !this.user?.uid) return;
      try {
        const snapshot = await getDocs(collection(db, 'etapas'));
        const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.etapas = todos.filter(e =>
          e.organizacaoId === this.organizacaoId &&
          (e.criadoPor === this.user.uid || (e.allowedUsers || []).includes(this.user.uid))
        );
      } catch (err) {
        console.error('Erro ao carregar etapas:', err);
      }
    },

    async carregarProjetosDisponiveis() {
      if (!this.organizacaoId || !this.user?.uid) return;
      try {
        const snapshot = await getDocs(collection(db, 'projetos'));
        const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.projetosDisponiveis = todos.filter(p =>
          p.organizacaoId === this.organizacaoId &&
          (p.criadoPor === this.user.uid || (p.allowedUsers || []).includes(this.user.uid))
        );
        if (!this.editandoId) {
          this.novaEtapa.ProjetosVinculados = this.projetosDisponiveis.map(p => p.id);
        }
      } catch (err) {
        console.error('Erro ao carregar projetos disponíveis:', err);
      }
    },

    async salvarEtapa() {
      if (!this.organizacaoId || !this.user?.uid) {
        alert("Organização ou usuário não definidos.");
        return;
      }

      const dados = {
        ...this.novaEtapa,
        organizacaoId: this.organizacaoId,
        criadoPor: this.user.uid,
        dataCriacao: new Date()
      };

      try {
        if (this.editandoId) {
          await updateDoc(doc(db, 'etapas', this.editandoId), dados);
        } else {
          await addDoc(collection(db, 'etapas'), dados);
        }
        this.cancelarEdicao();
        this.carregarEtapas();
      } catch (err) {
        console.error('Erro ao salvar etapa:', err);
      }
    },

    editarEtapa(etapa) {
      this.novaEtapa = { ...etapa };
      this.editandoId = etapa.id;
      this.abrirFormulario = true;
    },

    cancelarEdicao() {
      this.editandoId = '';
      this.abrirFormulario = false;
      this.novaEtapa = {
        NomeEtapa: '',
        DataInicioEstimada: '',
        DataTerminoEstimada: '',
        Status: '',
        Anotacoes: '',
        ProjetosVinculados: []
      };
    },

    async excluirEtapa(id) {
      if (confirm("Deseja excluir esta etapa?")) {
        try {
          await deleteDoc(doc(db, 'etapas', id));
          this.carregarEtapas();
        } catch (err) {
          console.error('Erro ao excluir etapa:', err);
        }
      }
    },

  mounted() {
    if (this.organizacaoId && this.user?.uid) {
      this.carregarEtapas();
      this.carregarProjetosDisponiveis();
    }
  }
}
};
</script>
