<template>
  <div class="funcionarios-container">
    <div class="header">
      <div class="actions">
        <input type="text" v-model="filtro" placeholder="Buscar por nome ou cargo..." />
        <button @click="abrirFormulario">+ Novo Funcionário</button>
      </div>
    </div>

    <table class="projetos-tabela">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Telefone</th>
          <th>Cargo</th>
          <th>Salário</th>
          <th>Modalidade</th>
          <th>Anotações</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="funcionario in funcionariosFiltrados" :key="funcionario.id">
          <td>{{ funcionario.nome }}</td>
          <td>{{ funcionario.telefone }}</td>
          <td>{{ funcionario.cargo }}</td>
          <td>R$ {{ funcionario.salario.toFixed(2) }}</td>
          <td>{{ funcionario.modalidade }}</td>
          <td>{{ resumoTexto(funcionario.anotacoes) }}</td>
          <td>
            <button @click="editarFuncionario(funcionario)">Editar</button>
            <button @click="excluirFuncionario(funcionario.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal para adicionar/editar funcionário -->
    <div v-if="formularioAberto" class="modal-overlay">
      <div class="modal">
        <h3>{{ funcionarioAtual.id ? 'Editar Funcionário' : 'Novo Funcionário' }}</h3>

        <label>Nome:</label>
        <input v-model="funcionarioAtual.nome" />

        <label>Telefone:</label>
        <input v-model="funcionarioAtual.telefone" />

        <label>Cargo:</label>
        <input v-model="funcionarioAtual.cargo" />

        <label>Salário (R$):</label>
        <input type="number" v-model.number="funcionarioAtual.salario" />

        <label>Modalidade de Pagamento:</label>
        <input v-model="funcionarioAtual.modalidade" />

        <label>Anotações:</label>
        <textarea v-model="funcionarioAtual.anotacoes" rows="4"></textarea>

        <div class="modal-actions">
          <button @click="salvarFuncionario">Salvar</button>
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
  props: ['projetoAtivo'],
  data() {
    return {
      funcionarios: [],
      filtro: '',
      formularioAberto: false,
      funcionarioAtual: {
        id: '',
        nome: '',
        telefone: '',
        cargo: '',
        salario: 0,
        modalidade: '',
        anotacoes: '',
        ProjetoID: '',
      },
    };
  },
  computed: {
    funcionariosFiltrados() {
      const texto = this.filtro.toLowerCase();
      return this.funcionarios.filter(func =>
        (func.nome || '').toLowerCase().includes(texto) ||
        (func.cargo || '').toLowerCase().includes(texto)
      );
    },
  },
  methods: {
    resumoTexto(texto) {
      return texto && texto.length > 30 ? texto.substring(0, 30) + '...' : texto;
    },
    async carregarFuncionarios() {
      if (!this.projetoAtivo) return;
      const querySnapshot = await getDocs(collection(db, "funcionarios"));
      this.funcionarios = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(func => func.ProjetoID === this.projetoAtivo);
    },
    abrirFormulario() {
      this.formularioAberto = true;
      this.funcionarioAtual = {
        id: '',
        nome: '',
        telefone: '',
        cargo: '',
        salario: 0,
        modalidade: '',
        anotacoes: '',
        ProjetoID: this.projetoAtivo,
      };
    },
    fecharFormulario() {
      this.formularioAberto = false;
    },
    async salvarFuncionario() {
      if (!this.projetoAtivo) {
        alert("Selecione um projeto antes de salvar.");
        return;
      }

      const funcionarioParaSalvar = {
        nome: this.funcionarioAtual.nome,
        telefone: this.funcionarioAtual.telefone,
        cargo: this.funcionarioAtual.cargo,
        salario: this.funcionarioAtual.salario,
        modalidade: this.funcionarioAtual.modalidade,
        anotacoes: this.funcionarioAtual.anotacoes,
        ProjetoID: this.projetoAtivo,
      };

      try {
        if (this.funcionarioAtual.id) {
          await updateDoc(doc(db, "funcionarios", this.funcionarioAtual.id), funcionarioParaSalvar);
        } else {
          await addDoc(collection(db, "funcionarios"), funcionarioParaSalvar);
        }
        this.fecharFormulario();
        this.carregarFuncionarios();
      } catch (error) {
        console.error("Erro ao salvar funcionário:", error);
        alert("Erro ao salvar funcionário.");
      }
    },
    editarFuncionario(func) {
      this.funcionarioAtual = { ...func };
      this.formularioAberto = true;
    },
    async excluirFuncionario(id) {
      await deleteDoc(doc(db, "funcionarios", id));
      this.carregarFuncionarios();
    },
  },
  watch: {
    projetoAtivo() {
      this.carregarFuncionarios();
    }
  },
  mounted() {
    this.carregarFuncionarios();
  },
};
</script>

