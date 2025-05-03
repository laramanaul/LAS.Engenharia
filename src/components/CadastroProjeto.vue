<template>
  <div class="form-container">
    <h2>{{ projetoAtual.id ? 'Editar Projeto' : 'Novo Projeto' }}</h2>
    
    <form @submit.prevent="salvarProjeto">
      <div class="form-group">
        <label for="nomeProjeto">Nome do Projeto:</label>
        <input type="text" id="nomeProjeto" v-model="projetoAtual.NomeProjeto" placeholder="Nome do Projeto" required />
      </div>

      <div class="form-group">
        <label for="cliente">Cliente:</label>
        <input type="text" id="cliente" v-model="projetoAtual.Cliente" placeholder="Cliente" required />
      </div>

      <div class="form-group">
        <label for="estado">Estado:</label>
        <select id="estado" v-model="projetoAtual.Estado" required>
          <option value="">Selecione o Estado</option>
          <option v-for="estado in estados" :key="estado.sigla" :value="estado.sigla">{{ estado.nome }}</option>
        </select>
      </div>

      <div class="form-group">
        <label for="cidade">Cidade:</label>
        <select id="cidade" v-model="projetoAtual.Cidade" required>
          <option value="">Selecione a Cidade</option>
          <option v-for="cidade in cidades" :key="cidade.id" :value="cidade.nome">{{ cidade.nome }}</option>
        </select>
      </div>

      <div class="form-group">
        <label for="dataInicio">Data de Início:</label>
        <input type="date" id="dataInicio" v-model="projetoAtual.DataInicioPrevista" required />
      </div>

      <div class="form-group">
        <label for="dataFim">Data de Fim:</label>
        <input type="date" id="dataFim" v-model="projetoAtual.DataFimPrevista" required />
      </div>

      <div class="form-group">
        <label for="descricao">Descrição:</label>
        <textarea id="descricao" v-model="projetoAtual.Anotacoes" rows="4" placeholder="Descrição do Projeto" required></textarea>
      </div>

      <div class="actions">
        <button type="submit" class="btn-save">Salvar</button>
        <button type="button" class="btn-cancel" @click="cancelarCadastro">Cancelar</button>
      </div>
    </form>
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export default {
  name: 'CadastroProjeto',
  props: {
    user: Object,
    organizacaoId: String
  },
  data() {
    return {
      projetoAtual: {
        NomeProjeto: '',
        Cliente: '',
        Estado: '',
        Cidade: '',
        DataInicioPrevista: '',
        DataFimPrevista: '',
        Anotacoes: ''
      },
      estados: [],
      cidades: []
    };
  },
  methods: {
    async salvarProjeto() {
      const camposObrigatorios = ['NomeProjeto', 'Cliente', 'Estado', 'Cidade', 'DataInicioPrevista', 'DataFimPrevista', 'Anotacoes'];
      const faltando = camposObrigatorios.filter(c => !this.projetoAtual[c]?.toString().trim());

      if (faltando.length) {
        alert("Preencha todos os campos obrigatórios.");
        return;
      }

      if (!this.user?.uid || !this.organizacaoId) {
        alert("Usuário ou organização inválidos.");
        return;
      }

      try {
        await addDoc(collection(db, 'projetos'), {
          ...this.projetoAtual,
          organizacaoId: this.organizacaoId,
          criadoPor: this.user.uid,
          dataCriacao: new Date()
        });

        alert('Projeto salvo com sucesso!');
        this.cancelarCadastro();
      } catch (err) {
        console.error("Erro ao salvar projeto:", err);
        alert("Erro ao salvar projeto. Veja o console.");
      }
    },

    cancelarCadastro() {
      this.projetoAtual = {
        NomeProjeto: '',
        Cliente: '',
        Estado: '',
        Cidade: '',
        DataInicioPrevista: '',
        DataFimPrevista: '',
        Anotacoes: ''
      };
    },

    async carregarEstados() {
      try {
        const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        this.estados = await res.json();
      } catch (err) {
        console.error('Erro ao carregar estados:', err);
      }
    },

    async carregarCidades() {
      this.projetoAtual.Cidade = '';
      if (!this.projetoAtual.Estado) return;

      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${this.projetoAtual.Estado}/municipios`);
        this.cidades = await res.json();
      } catch (err) {
        console.error('Erro ao carregar cidades:', err);
      }
    }
  },
  watch: {
    'projetoAtual.Estado': 'carregarCidades'
  },
  mounted() {
    this.carregarEstados();
  }
};
</script>
