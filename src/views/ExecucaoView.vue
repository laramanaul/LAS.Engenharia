<template>
  <div class="execucao-container">
    <div class="header">
      <div class="actions">
        <input type="text" v-model="filtro" placeholder="Buscar por item ou notas..." />
        <button @click="abrirFormulario">+ Nova Execução</button>
      </div>
    </div>

    <table class="projetos-tabela">
      <thead>
        <tr>
          <th>Data</th>
          <th>Item</th>
          <th>Fornecedor</th>
          <th>Quantidade</th>
          <th>Custo Unitário</th>
          <th>Custo Total</th>
          <th>Notas</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="execucao in execucoesFiltradas" :key="execucao.id">
          <td>{{ formatarData(execucao.DataExecucao) }}</td>
          <td>{{ nomeItem(execucao.ItemID) }}</td>
          <td>{{ nomeFornecedor(execucao.FornecedorID) }}</td>
          <td>{{ execucao.Quantidade }}</td>
          <td>R$ {{ execucao.CustoUnitarioRegistro.toFixed(2) }}</td>
          <td>R$ {{ execucao.CustoTotalCalculado.toFixed(2) }}</td>
          <td>{{ resumoTexto(execucao.Notas) }}</td>
          <td>
            <button @click="editarExecucao(execucao)">Editar</button>
            <button @click="excluirExecucao(execucao.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal para adicionar/editar execução -->
    <div v-if="formularioAberto" class="modal-overlay">
      <div class="modal">
        <h3>{{ execucaoAtual.id ? 'Editar Execução' : 'Nova Execução' }}</h3>

        <label>Data de Execução:</label>
        <input type="date" v-model="execucaoAtual.DataExecucao" />

        <label>Item:</label>
        <select v-model="execucaoAtual.ItemID">
          <option value="">Selecione o Item</option>
          <option v-for="item in itens" :key="item.id" :value="item.id">{{ item.NomeItem }}</option>
        </select>

        <label>Fornecedor:</label>
        <select v-model="execucaoAtual.FornecedorID">
          <option value="">Selecione o Fornecedor</option>
          <option v-for="fornecedor in fornecedores" :key="fornecedor.id" :value="fornecedor.id">{{ fornecedor.nome }}</option>
        </select>

        <label>Quantidade:</label>
        <input type="number" v-model.number="execucaoAtual.Quantidade" />

        <label>Custo Unitário (R$):</label>
        <input type="number" v-model.number="execucaoAtual.CustoUnitarioRegistro" />

        <label>Notas:</label>
        <textarea v-model="execucaoAtual.Notas" rows="3"></textarea>

        <div class="modal-actions">
          <button @click="salvarExecucao">Salvar</button>
          <button @click="fecharFormulario">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore';

export default {
  props: ['projetoAtivo', 'user'],
  data() {
    return {
      execucoes: [],
      itens: [],
      fornecedores: [],
      filtro: '',
      formularioAberto: false,
      execucaoAtual: {
        id: '',
        DataExecucao: '',
        ItemID: '',
        FornecedorID: '',
        Quantidade: 0,
        CustoUnitarioRegistro: 0,
        CustoTotalCalculado: 0,
        Notas: '',
        ProjetoID: '',
        UsuarioID: '',
      },
    };
  },
  computed: {
    execucoesFiltradas() {
      const texto = this.filtro.toLowerCase();
      return this.execucoes.filter(e =>
        (this.nomeItem(e.ItemID) || '').toLowerCase().includes(texto) ||
        (e.Notas || '').toLowerCase().includes(texto)
      );
    },
  },
  methods: {
    async carregarExecucoes() {
      if (!this.projetoAtivo) return;
      const querySnapshot = await getDocs(collection(db, "execucoes"));
      this.execucoes = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(e => e.ProjetoID === this.projetoAtivo);
    },
    async carregarItens() {
      if (!this.projetoAtivo) return;
      const querySnapshot = await getDocs(collection(db, "itens"));
      this.itens = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(i => i.ProjetoID === this.projetoAtivo);
    },
    async carregarFornecedores() {
      const querySnapshot = await getDocs(collection(db, "fornecedores"));
      this.fornecedores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    nomeItem(itemId) {
      const item = this.itens.find(i => i.id === itemId);
      return item ? item.NomeItem : '---';
    },
    nomeFornecedor(fornecedorId) {
      const fornecedor = this.fornecedores.find(f => f.id === fornecedorId);
      return fornecedor ? fornecedor.nome : '---';
    },
    formatarData(timestamp) {
      if (!timestamp) return '';
      const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return data.toLocaleDateString();
    },
    resumoTexto(texto) {
      return texto && texto.length > 30 ? texto.substring(0, 30) + '...' : texto;
    },
    abrirFormulario() {
      this.formularioAberto = true;
      const hoje = new Date().toISOString().split('T')[0];
      this.execucaoAtual = {
        id: '',
        DataExecucao: hoje,
        ItemID: '',
        FornecedorID: '',
        Quantidade: 0,
        CustoUnitarioRegistro: 0,
        CustoTotalCalculado: 0,
        Notas: '',
        ProjetoID: this.projetoAtivo,
        UsuarioID: this.user.uid,
      };
    },
    fecharFormulario() {
      this.formularioAberto = false;
    },
    async salvarExecucao() {
      if (!this.projetoAtivo) {
        alert("Selecione um projeto antes de salvar.");
        return;
      }

      const custoTotal = this.execucaoAtual.Quantidade * this.execucaoAtual.CustoUnitarioRegistro;

      const execucaoParaSalvar = {
        DataExecucao: Timestamp.fromDate(new Date(this.execucaoAtual.DataExecucao)),
        ItemID: this.execucaoAtual.ItemID,
        FornecedorID: this.execucaoAtual.FornecedorID,
        Quantidade: this.execucaoAtual.Quantidade,
        CustoUnitarioRegistro: this.execucaoAtual.CustoUnitarioRegistro,
        CustoTotalCalculado: custoTotal,
        Notas: this.execucaoAtual.Notas,
        ProjetoID: this.projetoAtivo,
        UsuarioID: this.user.uid,
      };

      try {
        if (this.execucaoAtual.id) {
          await updateDoc(doc(db, "execucoes", this.execucaoAtual.id), execucaoParaSalvar);
        } else {
          await addDoc(collection(db, "execucoes"), execucaoParaSalvar);
        }
        this.fecharFormulario();
        this.carregarExecucoes();
      } catch (error) {
        console.error("Erro ao salvar execução:", error);
        alert("Erro ao salvar execução.");
      }
    },
    editarExecucao(execucao) {
      this.execucaoAtual = {
        id: execucao.id,
        DataExecucao: execucao.DataExecucao ? execucao.DataExecucao.toDate().toISOString().split('T')[0] : '',
        ItemID: execucao.ItemID,
        FornecedorID: execucao.FornecedorID || '',
        Quantidade: execucao.Quantidade,
        CustoUnitarioRegistro: execucao.CustoUnitarioRegistro,
        CustoTotalCalculado: execucao.CustoTotalCalculado,
        Notas: execucao.Notas,
        ProjetoID: execucao.ProjetoID,
        UsuarioID: execucao.UsuarioID,
      };
      this.formularioAberto = true;
    },
    async excluirExecucao(id) {
      await deleteDoc(doc(db, "execucoes", id));
      this.carregarExecucoes();
    },
  },
  watch: {
    projetoAtivo() {
      this.carregarExecucoes();
      this.carregarItens();
      this.carregarFornecedores();
    }
  },
  mounted() {
    this.carregarExecucoes();
    this.carregarItens();
    this.carregarFornecedores();
  },
};
</script>

