<template>
  <div class="fornecedores-view projetos-view">
    <!-- Título da página -->
    <h2>Fornecedores</h2>

    <!-- Controles superiores -->
    <div class="topo-controles">
      <button class="botao-destaque" @click="abrirFormulario = true">➕ Adicionar Fornecedor</button>
      <input
        type="text"
        v-model="filtroBusca"
        placeholder="Buscar fornecedores..."
        class="campo-busca"
      />
    </div>

    <!-- Modal de formulário -->
    <div v-if="abrirFormulario" class="modal-overlay">
      <div class="modal">
        <h3>{{ editandoId ? 'Editar Fornecedor' : 'Novo Fornecedor' }}</h3>

        <div class="formulario-projeto">
          <div class="form-coluna"  style="flex: 1 1 45%;">
            <label>Nome do Fornecedor</label>
            <input v-model="novoFornecedor.Nome" placeholder="Nome do fornecedor" required />
          </div>

          <div class="form-coluna">
            <label>CNPJ</label>
            <input v-model="novoFornecedor.CNPJ" placeholder="CNPJ ou CPF" />
          </div>

          <div class="form-coluna">
            <label>Contato</label>
            <input v-model="novoFornecedor.Contato" placeholder="Telefone, e-mail ou responsável" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Endereço</label>
            <input v-model="novoFornecedor.Endereco" placeholder="Endereço completo" />
          </div>


          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Produtos ou Serviços</label>
            <textarea v-model="novoFornecedor.ProdutosServicos" rows="2" placeholder="Materiais ou serviços fornecidos"></textarea>
          </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Anotações</label>
            <textarea v-model="novoFornecedor.Anotacoes" rows="2" placeholder="Observações, histórico, condições, etc."></textarea>
          </div>
        </div>

        <div class="modal-actions">
          <button class="botao-destaque" @click="salvarFornecedor">
            {{ editandoId ? 'Atualizar' : 'Adicionar' }} Fornecedor
          </button>
          <button class="botao" @click="cancelarEdicao">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Tabela de fornecedores -->
    <div class="tabela-container">
      <div v-if="!fornecedoresFiltrados.length" style="margin: 1rem 0; color: #a00;">
        ⚠️ Nenhum fornecedor encontrado.
      </div>

      <table v-else class="projetos-tabela">
        <thead>
          <tr>
            <th>Ações</th>
            <th>Nome</th>
            <th>CNPJ</th>
            <th>Endereço</th>
            <th>Contato</th>
            <th>Produtos/Serviços</th>
            <th>Anotações</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="fornecedor in fornecedoresFiltrados"
            :key="fornecedor.id"
            :class="{ selecionado: fornecedorSelecionado === fornecedor.id }"
          >
            <td>
              <div class="acoes-wrapper">
                <button class="botao-selecionar" @click="selecionarFornecedor(fornecedor.id)">✔</button>
                <button class="botao-editar" @click="editarFornecedor(fornecedor)">✏️</button>
                <button class="botao-excluir" @click="excluirFornecedor(fornecedor.id)">🗑️</button>
              </div>
            </td>
            <td>{{ fornecedor.Nome || '—' }}</td>
            <td>{{ fornecedor.CNPJ || '—' }}</td>
            <td>{{ fornecedor.Endereco || '—' }}</td>
            <td>{{ fornecedor.Contato || '—' }}</td>
            <td>{{ fornecedor.ProdutosServicos || '—' }}</td>
            <td>{{ fornecedor.Anotacoes || '—' }}</td>
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
  name: 'FornecedoresView',
  props: {
    user: Object,
    organizacaoId: String
  },
  data() {
    return {
      fornecedores: [],
      fornecedorSelecionado: '',
      editandoId: '',
      abrirFormulario: false,
      filtroBusca: '',
      novoFornecedor: {
        Nome: '',
        CNPJ: '',
        Endereco: '',
        Contato: '',
        ProdutosServicos: '',
        Anotacoes: ''
      }
    };
  },
  computed: {
    fornecedoresFiltrados() {
      const termo = this.filtroBusca?.toLowerCase().trim();
      if (!termo) return this.fornecedores;
      return this.fornecedores.filter(f =>
        Object.values(f).some(v =>
          typeof v === 'string' && v.toLowerCase().includes(termo)
        )
      );
    }
  },
  watch: {
    organizacaoId(nova) {
      if (nova && this.user?.uid) {
        this.carregarFornecedores();
      }
    },
    user: {
      handler(novo) {
        if (novo?.uid && this.organizacaoId) {
          this.carregarFornecedores();
        }
      },
      deep: true
    }
  },
  methods: {
    async carregarFornecedores() {
      if (!this.organizacaoId || !this.user?.uid) return;
      try {
        const snapshot = await getDocs(collection(db, 'fornecedores'));
        const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.fornecedores = todos.filter(f =>
          f.organizacaoId === this.organizacaoId &&
          (f.criadoPor === this.user.uid || (f.allowedUsers || []).includes(this.user.uid))
        );
      } catch (err) {
        console.error('Erro ao carregar fornecedores:', err);
      }
    },

    async salvarFornecedor() {
      if (!this.organizacaoId || !this.user?.uid) {
        alert("Organização ou usuário não definidos.");
        return;
      }

      const data = {
        ...this.novoFornecedor,
        organizacaoId: this.organizacaoId,
        criadoPor: this.user.uid,
        dataCriacao: new Date()
      };

      try {
        if (this.editandoId) {
          await updateDoc(doc(db, 'fornecedores', this.editandoId), data);
        } else {
          await addDoc(collection(db, 'fornecedores'), data);
        }
        this.cancelarEdicao();
        this.carregarFornecedores();
      } catch (err) {
        console.error('Erro ao salvar fornecedor:', err);
      }
    },

    editarFornecedor(fornecedor) {
      this.novoFornecedor = { ...fornecedor };
      this.editandoId = fornecedor.id;
      this.abrirFormulario = true;
    },

    cancelarEdicao() {
      this.editandoId = '';
      this.abrirFormulario = false;
      this.novoFornecedor = {
        Nome: '',
        CNPJ: '',
        Endereco: '',
        Contato: '',
        ProdutosServicos: '',
        Anotacoes: ''
      };
    },

    async excluirFornecedor(id) {
      if (confirm("Deseja excluir este fornecedor?")) {
        try {
          await deleteDoc(doc(db, 'fornecedores', id));
          this.carregarFornecedores();
        } catch (err) {
          console.error('Erro ao excluir fornecedor:', err);
        }
      }
    },

    selecionarFornecedor(id) {
      this.fornecedorSelecionado = id;
    }
  },
  mounted() {
    if (this.organizacaoId && this.user?.uid) {
      this.carregarFornecedores();
    }
  }
};
</script>
