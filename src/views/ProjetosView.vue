<template>
  <div v-if="carregandoProjetos" class="loading">
    Carregando projetos...
  </div>

  <div v-else class="projetos-container">
    <div class="header">
      <div class="actions">
        <input type="text" v-model="filtro" placeholder="Buscar por nome, cliente, tipo..." />
        <button @click="abrirFormulario">+ Novo Projeto</button>
      </div>
    </div>

    <div v-if="projetoSelecionado" class="projeto-selecionado-info">
      Projeto Ativo: <strong>{{ projetoSelecionadoNome }}</strong>
    </div>

    <table class="projetos-tabela">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Cliente</th>
          <th>Tipo</th>
          <th>Estado</th>
          <th>Cidade</th>
          <th>Data Início</th>
          <th>Data Fim</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="projeto in projetosFiltrados" :key="projeto.id">
          <td>{{ projeto.NomeProjeto }}</td>
          <td>{{ projeto.Cliente }}</td>
          <td>{{ projeto.TipoProjeto }}</td>
          <td>{{ projeto.Estado }}</td>
          <td>{{ projeto.Cidade }}</td>
          <td>{{ projeto.DataInicioPrevista }}</td>
          <td>{{ projeto.DataFimPrevista }}</td>
          <td>
            <button class="editar" @click="editarProjeto(projeto)">Editar</button>
            <button class="excluir" @click="excluirProjeto(projeto.id)">Excluir</button>
            <button @click="selecionarProjeto(projeto)">Selecionar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal -->
    <div v-if="formularioAberto" class="modal-overlay">
      <div class="modal">
        <h3>{{ projetoAtual.id ? 'Editar Projeto' : 'Novo Projeto' }}</h3>

        <label>Nome do Projeto:</label>
        <input v-model="projetoAtual.NomeProjeto" />

        <label>Cliente:</label>
        <input v-model="projetoAtual.Cliente" />

        <label>Endereço:</label>
        <input v-model="projetoAtual.Endereco" />

        <label>Estado:</label>
        <select v-model="projetoAtual.Estado">
          <option value="">Selecione o Estado</option>
          <option v-for="estado in estados" :key="estado.id" :value="estado.sigla">
            {{ estado.nome }}
          </option>
        </select>

        <label>Cidade:</label>
        <select v-model="projetoAtual.Cidade">
          <option value="">Selecione a Cidade</option>
          <option v-for="cidade in cidades" :key="cidade.id" :value="cidade.nome">
            {{ cidade.nome }}
          </option>
        </select>

        <label>Data Início Prevista:</label>
        <input type="date" v-model="projetoAtual.DataInicioPrevista" />

        <label>Data Fim Prevista:</label>
        <input type="date" v-model="projetoAtual.DataFimPrevista" />

        <label>Tipo do Projeto:</label>
        <select v-model="projetoAtual.TipoProjeto">
          <option value="">Selecione o Tipo</option>
          <option v-for="tipo in tiposProjetosGlobais" :key="tipo" :value="tipo">{{ tipo }}</option>
        </select>

        <label>Anotações:</label>
        <textarea v-model="projetoAtual.Anotacoes" rows="4" placeholder="Observações sobre o projeto..."></textarea>

        <div class="modal-actions">
          <button class="btn-save" @click="salvarProjeto">Salvar</button>
          <button class="btn-cancel" @click="fecharFormulario">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc } from 'firebase/firestore';

export default {
  props: ['user'],
  emits: ['trocar-projeto'],
  data() {
    return {
      projetos: [],
      filtro: '',
      formularioAberto: false,
      projetoAtual: {
        id: '',
        NomeProjeto: '',
        Cliente: '',
        Endereco: '',
        Estado: '',
        Cidade: '',
        DataInicioPrevista: '',
        DataFimPrevista: '',
        TipoProjeto: '',
        Anotacoes: '',
        allowedUsers: [],
      },
      estados: [],
      cidades: [],
      tiposProjetosGlobais: [],
      carregandoProjetos: true,
      projetoSelecionado: '', // Adicionado para controle de seleção
    };
  },
  computed: {
    projetosFiltrados() {
      const texto = this.filtro.toLowerCase();
      return this.projetos.filter(projeto =>
        (projeto.NomeProjeto || '').toLowerCase().includes(texto) ||
        (projeto.Cliente || '').toLowerCase().includes(texto) ||
        (projeto.TipoProjeto || '').toLowerCase().includes(texto)
      );
    },
    projetoSelecionadoNome() {
      const projeto = this.projetos.find(p => p.id === this.projetoSelecionado);
      return projeto ? projeto.NomeProjeto : '';
    }
  },
  methods: {
    async carregarProjetos() {
      this.carregandoProjetos = true;
      if (!this.user || !this.user.uid) return;

      try {
        const querySnapshot = await getDocs(collection(db, "projetos"));
        this.projetos = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => p.criadoPor === this.user.uid || (p.allowedUsers || []).includes(this.user.uid));

        if (!this.projetoSelecionado && this.projetos.length > 0) {
          this.projetoSelecionado = this.projetos[0].id;
        }
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
      } finally {
        this.carregandoProjetos = false;
      }
    },

    async carregarConfiguracoesGlobais() {
      const docRef = doc(db, "configuracoesGlobais", "padrao");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const config = docSnap.data();
        this.tiposProjetosGlobais = config.tiposProjetos || [];
      }
    },

    async carregarEstados() {
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
      const data = await response.json();
      this.estados = data.sort((a, b) => a.nome.localeCompare(b.nome));
    },

    async carregarCidades(uf) {
      if (!uf) {
        this.cidades = [];
        return;
      }
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
      const data = await response.json();
      this.cidades = data.sort((a, b) => a.nome.localeCompare(b.nome));
    },

    abrirFormulario() {
      this.formularioAberto = true;
      this.carregarEstados();
      this.projetoAtual = {
        id: '',
        NomeProjeto: '',
        Cliente: '',
        Endereco: '',
        Estado: '',
        Cidade: '',
        DataInicioPrevista: '',
        DataFimPrevista: '',
        TipoProjeto: '',
        Anotacoes: '',
        allowedUsers: [this.user?.uid || ''],
      };
    },

    fecharFormulario() {
      this.formularioAberto = false;
    },

    async salvarProjeto() {
      const { id, ...dadosProjeto } = this.projetoAtual;

      if (!dadosProjeto.Estado || !dadosProjeto.Cidade || !dadosProjeto.NomeProjeto) {
        alert("Preencha todos os campos obrigatórios.");
        return;
      }

      if (id) {
        await updateDoc(doc(db, "projetos", id), dadosProjeto);
      } else {
        await addDoc(collection(db, "projetos"), {
          ...dadosProjeto,
          criadoPor: this.user.uid,
          allowedUsers: [this.user.uid],
          createdAt: new Date(),
        });
      }
      this.fecharFormulario();
      this.carregarProjetos();
    },

    editarProjeto(projeto) {
      this.projetoAtual = { ...projeto };
      this.carregarEstados();
      this.carregarCidades(projeto.Estado);
      this.formularioAberto = true;
    },

    async excluirProjeto(id) {
      await deleteDoc(doc(db, "projetos", id));
      this.carregarProjetos();
    },

    selecionarProjeto(projeto) {
      this.projetoSelecionado = projeto.id;
      this.$emit('trocar-projeto', projeto.id);
    },
  },

  watch: {
    'projetoAtual.Estado'(novoUF) {
      this.carregarCidades(novoUF);
    }
  },

  mounted() {
    this.carregarProjetos();
    this.carregarConfiguracoesGlobais();
  },
};
</script>

