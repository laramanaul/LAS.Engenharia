<template>
  <div class="fornecedores-container">
    <div class="header">
      <div class="actions">
        <input type="text" v-model="filtro" placeholder="Buscar por nome ou produto/serviço..." />
        <button @click="abrirFormulario">+ Novo Fornecedor</button>
      </div>
    </div>

    <table class="projetos-tabela">
      <thead>
        <tr>
          <th>Nome</th>
          <th>CNPJ</th>
          <th>Endereço</th>
          <th>Serviços/Produtos</th>
          <th>Contato</th>
          <th>Anotações</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="fornecedor in fornecedoresFiltrados" :key="fornecedor.id">
          <td>{{ fornecedor.nome }}</td>
          <td>{{ fornecedor.cnpj }}</td>
          <td>{{ fornecedor.endereco }}</td>
          <td>{{ fornecedor.produtos }}</td>
          <td>{{ fornecedor.contato }}</td>
          <td>{{ resumoTexto(fornecedor.anotacoes) }}</td>
          <td>
            <button @click="editarFornecedor(fornecedor)">Editar</button>
            <button @click="excluirFornecedor(fornecedor.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal para adicionar/editar fornecedor -->
    <div v-if="formularioAberto" class="modal-overlay">
      <div class="modal">
        <h3>{{ fornecedorAtual.id ? 'Editar Fornecedor' : 'Novo Fornecedor' }}</h3>

        <label>Nome do Fornecedor:</label>
        <input v-model="fornecedorAtual.nome" />

        <label>CNPJ:</label>
        <input v-model="fornecedorAtual.cnpj" />

        <label>Endereço:</label>
        <input v-model="fornecedorAtual.endereco" />

        <label>Serviços/Produtos:</label>
        <input v-model="fornecedorAtual.produtos" />

        <label>Contato:</label>
        <input v-model="fornecedorAtual.contato" />

        <label>Anotações:</label>
        <textarea v-model="fornecedorAtual.anotacoes" rows="4"></textarea>

        <div class="modal-actions">
          <button @click="salvarFornecedor">Salvar</button>
          <button @click="fecharFormulario">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';

export default {
  data() {
    return {
      fornecedores: [],
      filtro: '',
      formularioAberto: false,
      fornecedorAtual: {
        id: '',
        nome: '',
        cnpj: '',
        endereco: '',
        produtos: '',
        contato: '',
        anotacoes: '',
      },
    };
  },
  computed: {
    fornecedoresFiltrados() {
      const texto = this.filtro.toLowerCase();
      return this.fornecedores.filter(f =>
        (f.nome || '').toLowerCase().includes(texto) ||
        (f.produtos || '').toLowerCase().includes(texto)
      );
    },
  },
  methods: {
    resumoTexto(texto) {
      return texto && texto.length > 30 ? texto.substring(0, 30) + '...' : texto;
    },
    async carregarFornecedores() {
      const querySnapshot = await getDocs(collection(db, "fornecedores"));
      this.fornecedores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    abrirFormulario() {
      this.formularioAberto = true;
      this.fornecedorAtual = {
        id: '',
        nome: '',
        cnpj: '',
        endereco: '',
        produtos: '',
        contato: '',
        anotacoes: '',
      };
    },
    fecharFormulario() {
      this.formularioAberto = false;
    },
    async salvarFornecedor() {
      const fornecedorParaSalvar = {
        nome: this.fornecedorAtual.nome,
        cnpj: this.fornecedorAtual.cnpj,
        endereco: this.fornecedorAtual.endereco,
        produtos: this.fornecedorAtual.produtos,
        contato: this.fornecedorAtual.contato,
        anotacoes: this.fornecedorAtual.anotacoes,
      };

      try {
        if (this.fornecedorAtual.id) {
          await updateDoc(doc(db, "fornecedores", this.fornecedorAtual.id), fornecedorParaSalvar);
        } else {
          await addDoc(collection(db, "fornecedores"), fornecedorParaSalvar);
        }
        this.fecharFormulario();
        this.carregarFornecedores();
      } catch (error) {
        console.error("Erro ao salvar fornecedor:", error);
        alert("Erro ao salvar fornecedor.");
      }
    },
    editarFornecedor(f) {
      this.fornecedorAtual = { ...f };
      this.formularioAberto = true;
    },
    async excluirFornecedor(id) {
      await deleteDoc(doc(db, "fornecedores", id));
      this.carregarFornecedores();
    },
  },
  mounted() {
    this.carregarFornecedores();
  },
};
</script>

