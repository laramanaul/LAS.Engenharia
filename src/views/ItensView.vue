<template>
  <div class="itens-view">
    <h2>Itens Cadastrados</h2>

    <!-- Controles superiores -->
    <div class="topo-controles">
      <div style="display: flex; gap: 1rem; align-items: center; width: 100%;">
        <button class="botao-destaque" @click="abrirFormulario = true">➕ Adicionar Item</button>
        <input type="text" v-model="filtroBusca" placeholder="Buscar itens..." class="campo-busca" />
      </div>
    </div>

    <!-- Modal do formulário -->
    <div v-if="abrirFormulario" class="modal-overlay">
      <div class="modal">
        <h3>{{ editandoId ? 'Editar Item' : 'Novo Item' }}</h3>
        <div class="formulario-projeto">
          <div class="form-coluna">
            <label>Nome do Item</label>
            <input v-model="novoItem.NomeItem" placeholder="Nome do Item" required />
          </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Descrição</label>
            <textarea v-model="novoItem.Descricao" rows="2" placeholder="Descrição do item"></textarea>
          </div>

          <div class="form-coluna">
            <label>Tipo do Item</label>
            <select v-model="novoItem.TipoItemID" required>
              <option disabled value="">Selecione o tipo</option>
              <option v-for="tipo in tiposProjeto" :key="tipo">{{ tipo }}</option>
            </select>
          </div>

          <div class="form-coluna">
            <label>Unidade de Medida</label>
            <select v-model="novoItem.Unidade" required>
              <option disabled value="">Selecione a unidade</option>
              <option v-for="unidade in unidadesMedida" :key="unidade.sigla" :value="unidade.sigla">
                {{ unidade.sigla }} – {{ unidade.nome }} ({{ unidade.uso }})
              </option>
            </select>
          </div>

          <div class="form-coluna">
            <label>
              Categoria
              <button class="botao-mini" @click="abrirGerenciadorCategorias" title="Gerenciar categorias">⚙</button>
            </label>
            <select v-model="novoItem.Categoria" required>
              <option disabled value="">Selecione a categoria</option>
              <option v-for="cat in categoriasItem" :key="cat.id" :value="cat.nome">
                {{ cat.nome }}
              </option>
            </select>
          </div>

          <div class="form-coluna">
            <label>Preço de Referência (R$)</label>
            <input type="number" v-model="novoItem.CustoUnitario" placeholder="0.00" />
          </div>

          <div class="form-coluna">
            <label>Referência / URL</label>
            <input v-model="novoItem.ReferenciaURL" placeholder="Link ou código de referência" />
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
                  v-model="novoItem.ProjetosVinculados"
                />
                {{ projeto.NomeProjeto }}
              </label>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="botao-destaque" @click="salvarItem">
            {{ editandoId ? 'Atualizar' : 'Adicionar' }} Item
          </button>
          <button class="botao" @click="cancelarEdicao">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal de Gerenciador de Categorias -->
    <div v-if="modalCategoriasAberto" class="modal-overlay">
      <div class="modal" style="max-width: 500px;">
        <h3>Gerenciar Categorias de Item</h3>

        <ul style="margin-bottom: 1rem;">
          <li
            v-for="cat in categoriasItem"
            :key="cat.id"
            style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;"
          >
            <input v-model="cat.nome" @blur="atualizarCategoria(cat)" />
            <button class="botao-excluir" @click="excluirCategoria(cat.id)">🗑</button>
          </li>
        </ul>

        <div style="display: flex; gap: 0.5rem;">
          <input v-model="novaCategoria" placeholder="Nova categoria..." style="flex: 1;" />
          <button class="botao" @click="adicionarCategoria">➕ Adicionar</button>
        </div>

        <div class="modal-actions">
          <button class="botao" @click="modalCategoriasAberto = false">Fechar</button>
        </div>
      </div>
    </div>

    <!-- Tabela de itens -->
    <div class="tabela-container">
      <div v-if="!itensFiltrados.length" style="margin: 1rem 0; color: #a00;">
        ⚠️ Nenhum item encontrado.
      </div>
      <table v-else class="projetos-tabela">
        <thead>
          <tr>
            <th>Ações</th>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Unidade</th>
            <th>Categoria</th>
            <th>Projetos</th>
            <th>Descrição</th>
            <th>Preço de Referência</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in itensFiltrados"
            :key="item.id"
            :class="{ selecionado: itemSelecionado === item.id }"
          >
            <td>
              <div class="acoes-wrapper">
                <button class="botao-selecionar" @click="selecionarItem(item.id)">✔</button>
                <button class="botao-editar" @click="editarItem(item)">✏️</button>
                <button class="botao-excluir" @click="excluirItem(item.id)">🗑️</button>
              </div>
            </td>
            <td>{{ item.NomeItem || '—' }}</td>
            <td>{{ item.TipoItemID || '—' }}</td>
            <td>{{ item.Unidade || '—' }}</td>
            <td>{{ item.Categoria || '—' }}</td>
            <td>
              <ul v-if="item.ProjetosVinculados && item.ProjetosVinculados.length">
                <li v-for="pid in item.ProjetosVinculados" :key="pid">{{ pid }}</li>
              </ul>
              <span v-else>—</span>
            </td>
            <td>{{ item.Descricao || '—' }}</td>
            <td>R$ {{ Number(item.CustoUnitario || 0).toFixed(2) }}</td>
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
  name: 'ItensView',
  props: {
    user: Object,
    organizacaoId: String
  },
  data() {
    return {
      itens: [],
      itemSelecionado: '',
      editandoId: '',
      abrirFormulario: false,
      filtroBusca: '',
      novoItem: {
        NomeItem: '',
        Unidade: '',
        Categoria: '',
        TipoItemID: '',
        ProjetosVinculados: [],
        ReferenciaURL: '',
        Descricao: '',
        CustoUnitario: 0
      },
      tiposProjeto: ['Serviço', 'Mão de Obra Direta', 'Material', 'Material + Serviço'],
      categoriasItem: [],
      novaCategoria: '',
      modalCategoriasAberto: false,
      projetosDisponiveis: [],
      unidadesMedida: [
        { sigla: 'cx', nome: 'Caixa', uso: 'Lote de produtos' },
        { sigla: 'dia', nome: 'Diária', uso: 'Pagamento diário de mão de obra' },
        { sigla: 'h', nome: 'Hora', uso: 'Mão de obra eventual' },
        { sigla: 'jogo', nome: 'Jogo', uso: 'Conjuntos de ferramentas ou acabamentos' },
        { sigla: 'kg', nome: 'Quilograma', uso: 'Fios, pregos, sacos, aço' },
        { sigla: 'l', nome: 'Litro', uso: 'Tintas, combustíveis, aditivos' },
        { sigla: 'm', nome: 'Metro linear', uso: 'Cabos, tubos, rodapés, trilhos' },
        { sigla: 'm²', nome: 'Metro quadrado', uso: 'Piso, reboco, pintura, forro' },
        { sigla: 'm³', nome: 'Metro cúbico', uso: 'Concreto, aterro, argamassa' },
        { sigla: 'mL', nome: 'Metro de linha', uso: 'Revestimentos decorativos' },
        { sigla: 'mês', nome: 'Mês', uso: 'Serviços contínuos (terceirizados)' },
        { sigla: 'mód', nome: 'Módulo', uso: 'Painéis, divisórias' },
        { sigla: 'par', nome: 'Par', uso: 'EPI, luvas, rodízios' },
        { sigla: 'pct', nome: 'Pacote', uso: 'Embalagens fechadas' },
        { sigla: 'sem', nome: 'Semana', uso: 'Contratos de curto prazo' },
        { sigla: 'ton', nome: 'Tonelada', uso: 'Aço, cimento a granel' },
        { sigla: 'un', nome: 'Unidade', uso: 'Peças, equipamentos, acessórios' }
      ].sort((a, b) => a.sigla.localeCompare(b.sigla))
    };
  },
  computed: {
    itensFiltrados() {
      const termo = this.filtroBusca?.toLowerCase().trim();
      if (!termo) return this.itens;
      return this.itens.filter(i =>
        Object.values(i).some(v =>
          typeof v === 'string' && v.toLowerCase().includes(termo)
        )
      );
    }
  },
  watch: {
    organizacaoId(nova) {
      if (nova && this.user?.uid) {
        this.carregarItens();
        this.carregarProjetosDisponiveis();
        this.carregarCategoriasItem();
      }
    },
    user: {
      handler(novo) {
        if (novo?.uid && this.organizacaoId) {
          this.carregarItens();
          this.carregarProjetosDisponiveis();
          this.carregarCategoriasItem();
        }
      },
      deep: true
    }
  },
  methods: {
    abrirGerenciadorCategorias() {
      this.modalCategoriasAberto = true;
    },

    async adicionarCategoria() {
      if (!this.novaCategoria.trim()) return;
      try {
        await addDoc(collection(db, 'categoriasItem'), {
          nome: this.novaCategoria.trim(),
          organizacaoId: this.organizacaoId,
          criadoPor: this.user.uid,
          dataCriacao: new Date()
        });
        this.novaCategoria = '';
        this.carregarCategoriasItem();
      } catch (err) {
        console.error('Erro ao adicionar categoria:', err);
      }
    },

    async atualizarCategoria(cat) {
      if (!cat.id || !cat.nome.trim()) return;
      try {
        await updateDoc(doc(db, 'categoriasItem', cat.id), {
          nome: cat.nome.trim()
        });
      } catch (err) {
        console.error('Erro ao atualizar categoria:', err);
      }
    },

    async excluirCategoria(id) {
      if (confirm("Deseja excluir esta categoria?")) {
        try {
          await deleteDoc(doc(db, 'categoriasItem', id));
          this.carregarCategoriasItem();
        } catch (err) {
          console.error('Erro ao excluir categoria:', err);
        }
      }
    },

    async carregarItens() {
      if (!this.organizacaoId || !this.user?.uid) return;
      try {
        const snapshot = await getDocs(collection(db, 'itens'));
        const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.itens = todos.filter(i =>
          i.organizacaoId === this.organizacaoId &&
          (i.criadoPor === this.user.uid || (i.allowedUsers || []).includes(this.user.uid))
        );
      } catch (err) {
        console.error('Erro ao carregar itens:', err);
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
          this.novoItem.ProjetosVinculados = this.projetosDisponiveis.map(p => p.id);
        }
      } catch (err) {
        console.error('Erro ao carregar projetos disponíveis:', err);
      }
    },

    async carregarCategoriasItem() {
      if (!this.organizacaoId) return;
      try {
        const snapshot = await getDocs(collection(db, 'categoriasItem'));
        const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.categoriasItem = todos.filter(c => c.organizacaoId === this.organizacaoId);
      } catch (err) {
        console.error('Erro ao carregar categorias de item:', err);
      }
    },

    async salvarItem() {
      if (!this.organizacaoId || !this.user?.uid) {
        alert("Organização ou usuário não definidos.");
        return;
      }
      try {
        const data = {
          ...this.novoItem,
          organizacaoId: this.organizacaoId,
          criadoPor: this.user.uid,
          dataCriacao: new Date()
        };
        if (this.editandoId) {
          await updateDoc(doc(db, 'itens', this.editandoId), data);
        } else {
          await addDoc(collection(db, 'itens'), data);
        }
        this.cancelarEdicao();
        this.carregarItens();
      } catch (err) {
        console.error('Erro ao salvar item:', err);
      }
    },

    editarItem(item) {
      this.novoItem = { ...item };
      this.editandoId = item.id;
      this.abrirFormulario = true;
    },

    cancelarEdicao() {
      this.editandoId = '';
      this.abrirFormulario = false;
      this.novoItem = {
        NomeItem: '',
        Unidade: '',
        Categoria: '',
        TipoItemID: '',
        ProjetosVinculados: [],
        ReferenciaURL: '',
        Descricao: '',
        CustoUnitario: 0
      };
    },

    async excluirItem(id) {
      if (confirm("Deseja excluir este item?")) {
        try {
          await deleteDoc(doc(db, 'itens', id));
          this.carregarItens();
        } catch (err) {
          console.error('Erro ao excluir item:', err);
        }
      }
    },

    selecionarItem(id) {
      this.itemSelecionado = id;
    }
  },
  mounted() {
    if (this.organizacaoId && this.user?.uid) {
      this.carregarItens();
      this.carregarProjetosDisponiveis();
      this.carregarCategoriasItem();
    }
  }
};
</script>
