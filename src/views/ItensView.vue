<template>
  <div class="itens-container">
    <div class="header">
      <div class="actions">
        <input type="text" v-model="filtro" placeholder="Buscar por Nome ou Categoria..." />
        <button @click="abrirFormulario">+ Novo Item</button>
      </div>
    </div>

    <table class="projetos-tabela">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Categoria</th>
          <th>Unidade</th>
          <th>Custo Unitário</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in itensFiltrados" :key="item.id">
          <td>{{ item.NomeItem }}</td>
          <td>{{ item.Categoria }}</td>
          <td>{{ item.Unidade }}</td>
          <td>R$ {{ item.CustoUnitario.toFixed(2) }}</td>
          <td>
            <button @click="editarItem(item)">Editar</button>
            <button @click="excluirItem(item.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal -->
    <div v-if="formularioAberto" class="modal-overlay">
      <div class="modal">
        <h3>{{ itemAtual.id ? 'Editar Item' : 'Novo Item' }}</h3>

        <label>Nome do Item:</label>
        <input v-model="itemAtual.NomeItem" />

        <label>Descrição:</label>
        <textarea v-model="itemAtual.Descricao" rows="3"></textarea>

        <label>Categoria:</label>
        <select v-model="itemAtual.Categoria">
          <option value="">Selecione a Categoria</option>
          <option v-for="cat in categoriasGlobais" :key="cat" :value="cat">{{ cat }}</option>
        </select>

        <label>Unidade:</label>
        <input v-model="itemAtual.Unidade" placeholder="Ex: m², kg, un" />

        <label>Custo Unitário (R$):</label>
        <input type="number" v-model.number="itemAtual.CustoUnitario" step="0.01" />

        <label>URL de Referência:</label>
        <input v-model="itemAtual.ReferenciaURL" placeholder="http://..." />

        <div class="modal-actions">
          <button @click="salvarItem">Salvar</button>
          <button @click="fecharFormulario">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc } from 'firebase/firestore';

export default {
  props: ['projetoAtivo'],
  data() {
    return {
      itens: [],
      filtro: '',
      formularioAberto: false,
      itemAtual: {
        id: '',
        NomeItem: '',
        Descricao: '',
        Categoria: '',
        Unidade: '',
        CustoUnitario: 0,
        ReferenciaURL: '',
        ProjetoID: '',
        EtapaID: '',
        TipoItemID: '',
      },
      categoriasGlobais: [],
    };
  },
  computed: {
    itensFiltrados() {
      const texto = this.filtro.toLowerCase();
      return this.itens.filter(item =>
        (item.NomeItem || '').toLowerCase().includes(texto) ||
        (item.Categoria || '').toLowerCase().includes(texto)
      );
    },
  },
  methods: {
    async carregarItens() {
      if (!this.projetoAtivo) {
        console.warn("Nenhum projeto ativo.");
        return;
      }
      const querySnapshot = await getDocs(collection(db, "itens"));
      this.itens = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.ProjetoID === this.projetoAtivo);

      console.log("Itens carregados:", this.itens);
    },
    async carregarConfiguracoesGlobais() {
      const docRef = doc(db, "configuracoesGlobais", "padrao");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const config = docSnap.data();
        this.categoriasGlobais = config.categoriasItens || [];
      }
    },
    abrirFormulario() {
      console.log("Abrindo formulário - Projeto Ativo:", this.projetoAtivo);
      this.formularioAberto = true;
      this.itemAtual = {
        id: '',
        NomeItem: '',
        Descricao: '',
        Categoria: '',
        Unidade: '',
        CustoUnitario: 0,
        ReferenciaURL: '',
        ProjetoID: this.projetoAtivo,
        EtapaID: '',
        TipoItemID: '',
      };
    },
    fecharFormulario() {
      this.formularioAberto = false;
    },
    async salvarItem() {
      if (!this.projetoAtivo) {
        alert("Selecione um projeto antes de salvar um item.");
        return;
      }

      const itemParaSalvar = {
        NomeItem: this.itemAtual.NomeItem,
        Descricao: this.itemAtual.Descricao,
        Categoria: this.itemAtual.Categoria,
        Unidade: this.itemAtual.Unidade,
        CustoUnitario: this.itemAtual.CustoUnitario,
        ReferenciaURL: this.itemAtual.ReferenciaURL,
        ProjetoID: this.projetoAtivo,
        EtapaID: this.itemAtual.EtapaID || '',
        TipoItemID: this.itemAtual.TipoItemID || '',
      };

      try {
        if (this.itemAtual.id) {
          await updateDoc(doc(db, "itens", this.itemAtual.id), itemParaSalvar);
        } else {
          await addDoc(collection(db, "itens"), itemParaSalvar);
        }
        this.fecharFormulario();
        this.carregarItens();
      } catch (error) {
        console.error("Erro ao salvar item:", error);
        alert("Erro ao salvar item.");
      }
    },
    editarItem(item) {
      this.itemAtual = { ...item };
      this.formularioAberto = true;
    },
    async excluirItem(id) {
      await deleteDoc(doc(db, "itens", id));
      this.carregarItens();
    },
  },
  watch: {
    projetoAtivo(novoProjetoAtivo) {
      console.log("Novo Projeto Ativo:", novoProjetoAtivo);
      this.carregarItens();
    }
  },
  mounted() {
    this.carregarItens();
    this.carregarConfiguracoesGlobais();
  },
};
</script>
