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
export default {
  data() {
    return {
      projetoAtual: {
        NomeProjeto: '',
        Cliente: '',
        Estado: '',
        Cidade: '',
        DataInicioPrevista: '',
        DataFimPrevista: '',
        Anotacoes: '',
      },
      estados: [], // Carregar estados
      cidades: [], // Carregar cidades conforme estado
    };
  },
  methods: {
    salvarProjeto() {
      // Salvar dados do projeto
      alert('Projeto salvo com sucesso!');
    },
    cancelarCadastro() {
      // Limpar os campos ou redirecionar
      this.projetoAtual = {
        NomeProjeto: '',
        Cliente: '',
        Estado: '',
        Cidade: '',
        DataInicioPrevista: '',
        DataFimPrevista: '',
        Anotacoes: '',
      };
    },
  },
};
</script>
