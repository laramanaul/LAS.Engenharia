<template>
  <div class="etapas-container">
    <div class="header">
      <div class="actions">
        <input type="text" v-model="filtro" placeholder="Buscar por Nome ou Status..." />
        <button @click="abrirFormulario">+ Nova Etapa</button>
      </div>
    </div>

    <table class="projetos-tabela">
      <thead>
        <tr>
          <th>Projeto</th>
          <th>Nome da Etapa</th>
          <th>Data Início</th>
          <th>Data Fim</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="etapa in etapasFiltradas" :key="etapa.id">
  <td>{{ nomeProjeto}}</td>
  <td>{{ etapa.NomeEtapa }}</td>
  <td>{{ formatarData(etapa.DataInicio) }}</td>
  <td>{{ formatarData(etapa.DataFim) }}</td>
  <td>{{ etapa.Status }}</td>

  <td>
    <button @click="editarEtapa(etapa)">Editar</button>
    <button @click="excluirEtapa(etapa.id)">Excluir</button>
  </td>
</tr>

          
      </tbody>
    </table>

    <!-- Modal para adicionar/editar etapa -->
    <div v-if="formularioAberto" class="modal-overlay">
      <div class="modal">
        <h3>{{ etapaAtual.id ? 'Editar Etapa' : 'Nova Etapa' }}</h3>


<label>Projeto:</label>
<select v-model="etapaAtual.ProjetoID">
  <option disabled value="">Selecione um projeto</option>
  <option v-for="projeto in projetos" :key="projeto.id" :value="projeto.id">
    {{ projeto.NomeProjeto }}
  </option>
</select>



        <label>Nome da Etapa:</label>
        <input v-model="etapaAtual.NomeEtapa" />

        <label>Data Início:</label>
        <input type="date" v-model="etapaAtual.DataInicio" />

        <label>Data Fim:</label>
        <input type="date" v-model="etapaAtual.DataFim" />

        <label>Status:</label>
        <select v-model="etapaAtual.Status">
          <option value="">Selecione o Status</option>
          <option v-for="status in statusEtapasGlobais" :key="status" :value="status">
            {{ status }}
          </option>
        </select>

        <div class="modal-actions">
          <button @click="salvarEtapa">Salvar</button>
          <button @click="fecharFormulario">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import { db } from '../firebase';
import { query, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, where, getDoc, Timestamp } from 'firebase/firestore';
import { auth } from '@/firebase';

export default {
  props: ['projetoAtivo'],
  data() {
    return {
      etapas: [],
      projetos: [],
      filtro: '',
      formularioAberto: false,
      etapaAtual: {
        id: '',
        NomeEtapa: '',
        DataInicio: '',
        DataFim: '',
        Status: '',
        ProjetoID: ''
      },
      statusEtapasGlobais: [],
    };
  },
  computed: {
    etapasFiltradas() {
      const texto = this.filtro.toLowerCase();
      return this.etapas.filter(etapa =>
        (etapa.NomeEtapa || '').toLowerCase().includes(texto) ||
        (etapa.Status || '').toLowerCase().includes(texto) ||
        (etapa.id || '').toLowerCase().includes(texto)
      );
    },
  },
  methods: {
    async carregarProjetos() {
  const user = auth.currentUser;

  if (!user) {
    console.warn('Usuário não está autenticado');
    return;
  }

  try {
    const q = query(
      collection(db, 'projetos'),
      where('allowedUsers', 'array-contains', user.uid)
    );
    const querySnapshot = await getDocs(q);
    this.projetos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
  }
    },
     formatarData(timestamp) {
      if (!timestamp) return '';
      const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return data.toLocaleDateString();
    },
async carregarEtapas() {
      if (!this.projetoAtivo) {
        console.warn("Nenhum projeto ativo.");
        return;
      }
      const querySnapshot = await getDocs(collection(db, "etapas"));
      this.etapas = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(etapa => etapa.ProjetoID === this.projetoAtivo);

      console.log("Etapas carregadas:", this.etapas);
    },
    async carregarConfiguracoesGlobais() {
      const docRef = doc(db, "configuracoesGlobais", "padrao");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const config = docSnap.data();
        this.statusEtapasGlobais = config.statusEtapas || [];
      }
    },
    abrirFormulario() {
      console.log("Abrindo formulário - Projeto Ativo:", this.projetoAtivo);
      this.formularioAberto = true;
      this.etapaAtual = {
        id: '',
        NomeEtapa: '',
        DataInicio: '',
        DataFim: '',
        Status: '',
        ProjetoID: this.projetoAtivo || '',
      };
    },
    fecharFormulario() {
      this.formularioAberto = false;
    },
    async salvarEtapa() {
      if (!this.etapaAtual.ProjetoID) {
        alert("Selecione um projeto antes de salvar uma etapa.");
        return;
      }

      const etapaParaSalvar = {
        NomeEtapa: this.etapaAtual.NomeEtapa,
        ProjetoID: this.etapaAtual.ProjetoID,
        Status: this.etapaAtual.Status,
        DataInicio: this.etapaAtual.DataInicio ? Timestamp.fromDate(new Date(this.etapaAtual.DataInicio)) : null,
        DataFim: this.etapaAtual.DataFim ? Timestamp.fromDate(new Date(this.etapaAtual.DataFim)) : null,
      };

      try {
        if (this.etapaAtual.id) {
          await updateDoc(doc(db, "etapas", this.etapaAtual.id), etapaParaSalvar);
        } else {
          await addDoc(collection(db, "etapas"), etapaParaSalvar);
        }
        this.fecharFormulario();
        this.carregarEtapas();
      } catch (error) {
        console.error("Erro ao salvar etapa:", error);
        alert("Erro ao salvar etapa. Verifique os dados.");
      }
    },
    editarEtapa(etapa) {
      this.etapaAtual = {
        id: etapa.id,
        NomeEtapa: etapa.NomeEtapa,
        DataInicio: etapa.DataInicio ? etapa.DataInicio.toDate().toISOString().split('T')[0] : '',
        DataFim: etapa.DataFim ? etapa.DataFim.toDate().toISOString().split('T')[0] : '',
        Status: etapa.Status,
        ProjetoID: etapa.ProjetoID || this.projetoAtivo || ''
      };
      this.formularioAberto = true;
    },
    async excluirEtapa(id) {
      await deleteDoc(doc(db, "etapas", id));
      this.carregarEtapas();
    }
  },
  watch: {
    projetoAtivo(novoProjetoAtivo) {
      console.log("Novo Projeto Ativo:", novoProjetoAtivo);
      this.carregarEtapas();
    }
  },
  mounted() {
    this.carregarEtapas();
    this.carregarConfiguracoesGlobais();
    this.carregarProjetos();
  },
};
</script>
