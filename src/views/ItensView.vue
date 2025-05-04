<template>
  <div class="itens-view">
    <h2>Itens Cadastrados</h2>

    <div class="topo-controles">
      <div style="display: flex; gap: 1rem; align-items: center; width: 100%;">
        <button class="botao-destaque" @click="abrirFormulario = true">➕ Adicionar Item</button>
        <input type="text" v-model="filtroBusca" placeholder="Buscar itens..." class="campo-busca" />
        <button class="botao" @click="mostrarSomentePersonalizados = !mostrarSomentePersonalizados">
          {{ mostrarSomentePersonalizados ? 'Exibir Todos' : 'Exibir Somente Personalizados' }}
        </button>
      </div>
    </div>

    <div v-if="abrirFormulario" class="modal-overlay">
      <div class="modal">
        <h3>{{ editandoId ? 'Editar Item' : 'Novo Item' }}</h3>
        <div class="formulario-projeto">
          <div class="form-coluna">
            <label>Nome do Item</label>
            <input v-model="novoItem.NomeItem" placeholder="Nome do Item" required />
          </div>

          <div class="form-coluna">
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
            <label>Categoria</label>
            <select v-model="novoItem.Categoria" required>
              <option disabled value="">Selecione a categoria</option>
              <option v-for="cat in categoriasFixasOrdenadas" :key="cat">{{ cat }}</option>
            </select>
          </div>

          <div class="form-coluna">
            <label>Referência / URL</label>
            <input v-model="novoItem.ReferenciaURL" placeholder="Link ou código de referência" />
          </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Projetos Vinculados</label>
            <ul class="checkbox-list">
              <li v-for="projeto in projetosDisponiveis" :key="projeto.id">
                <label>
                  <input type="checkbox" :value="projeto.id" v-model="novoItem.ProjetosVinculados" checked />
                  {{ projeto.NomeProjeto }}
                </label>
              </li>
            </ul>
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in itensOrdenados" :key="item.id">
            <td>
              <template v-if="!item.ehPadrao">
                <div class="acoes-wrapper">
                  <button class="botao-selecionar" @click="selecionarItem(item.id)">✔</button>
                  <button class="botao-editar" @click="editarItem(item)">✏️</button>
                  <button class="botao-excluir" @click="excluirItem(item.id)">🗑️</button>
                </div>
              </template>
              <template v-else>
                <button class="botao-clonar" @click="duplicarItem(item)">📋 Personalizar</button>
              </template>
            </td>
            <td>{{ item.NomeItem || '—' }}</td>
            <td>{{ item.TipoItemID || '—' }}</td>
            <td>{{ item.Unidade || '—' }}</td>
            <td>{{ item.Categoria || '—' }}</td>
            <td>
              <ul v-if="item.ProjetosVinculados?.length">
                <li v-for="pid in item.ProjetosVinculados" :key="pid">{{ buscarNomeProjeto(pid) || pid }}</li>
              </ul>
              <span v-else>—</span>
            </td>
            <td>{{ item.Descricao || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default {
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
      mostrarSomentePersonalizados: false,
      novoItem: {
        NomeItem: '', Unidade: '', Categoria: '', TipoItemID: '', ProjetosVinculados: [],
        ReferenciaURL: '', Descricao: '', ehPadrao: false
      },
      tiposProjeto: ['Serviço', 'Mão de Obra Direta', 'Material', 'Material + Serviço'],
      categoriasFixas: [
        'Execução', 'Acessórios', 'Hidráulica', 'Documentação', 'Alvenaria', 'Máquinas e Equipamentos',
        'Acabamento', 'Fundação', 'Revestimento', 'Estrutura', 'Marcenaria', 'Limpeza Pós-Obra',
        'Outros', 'Serralheria', 'Paisagismo', 'EPI', 'Ferramentas', 'Elétrica', 'Cobertura', 'Pintura'
      ],
      projetosDisponiveis: [],
      unidadesMedida: [
        { sigla: 'un', nome: 'Unidade', uso: 'Itens individuais' },
        { sigla: 'm', nome: 'Metro linear', uso: 'Cabos, tubos, etc' },
        { sigla: 'm²', nome: 'Metro quadrado', uso: 'Revestimentos, pisos' },
        { sigla: 'm³', nome: 'Metro cúbico', uso: 'Concreto, aterro' },
        { sigla: 'l', nome: 'Litro', uso: 'Tintas, líquidos' },
        { sigla: 'kg', nome: 'Quilograma', uso: 'Materiais pesáveis' },
        { sigla: 'cx', nome: 'Caixa', uso: 'Caixas de itens' },
        { sigla: 'dia', nome: 'Diária', uso: 'Serviços diários' }
      ].sort((a, b) => a.sigla.localeCompare(b.sigla))
    };
  },
  computed: {
    categoriasFixasOrdenadas() {
      return [...this.categoriasFixas].sort((a, b) => a.localeCompare(b));
    },
    itensFiltrados() {
      let base = [...this.itens];
      if (this.mostrarSomentePersonalizados) {
        base = base.filter(i => !i.ehPadrao);
      }
      const termo = this.filtroBusca?.toLowerCase().trim();
      if (!termo) return base;
      return base.filter(i => Object.values(i).some(v => typeof v === 'string' && v.toLowerCase().includes(termo)));
    },
    itensOrdenados() {
      return [...this.itensFiltrados].sort((a, b) => (a.NomeItem || '').localeCompare(b.NomeItem || ''));
    }
  },
  methods: {
    async carregarItens() {
      if (!this.organizacaoId || !this.user?.uid) return;
      try {
        const snapItens = await getDocs(collection(db, 'itens'));
        const personalizados = snapItens.docs.map(doc => ({ id: doc.id, ...doc.data(), ehPadrao: false })).filter(i => i.organizacaoId === this.organizacaoId);

        const snapPadrao = await getDocs(collection(db, 'itensPadrao'));
        const padrao = snapPadrao.docs.map(doc => ({ id: doc.id, ...doc.data(), ehPadrao: true }));

        this.itens = [...padrao, ...personalizados];
      } catch (err) {
        console.error('Erro ao carregar itens:', err);
      }
    },
    buscarNomeProjeto(id) {
      const projeto = this.projetosDisponiveis.find(p => p.id === id);
      return projeto ? projeto.NomeProjeto : null;
    },
    async carregarProjetosDisponiveis() {
      try {
        const snapshot = await getDocs(collection(db, 'projetos'));
        this.projetosDisponiveis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(p => p.organizacaoId === this.organizacaoId);
        this.novoItem.ProjetosVinculados = this.projetosDisponiveis.map(p => p.id);
      } catch (err) {
        console.error('Erro ao carregar projetos:', err);
      }
    },
    async salvarItem() {
      const data = {
        ...this.novoItem,
        organizacaoId: this.organizacaoId,
        criadoPor: this.user.uid,
        dataCriacao: new Date()
      };
      try {
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
        NomeItem: '', Unidade: '', Categoria: '', TipoItemID: '', ProjetosVinculados: [],
        ReferenciaURL: '', Descricao: '', ehPadrao: false
      };
    },
    async excluirItem(id) {
      if (!confirm('Deseja excluir este item?')) return;
      try {
        await deleteDoc(doc(db, 'itens', id));
        this.carregarItens();
      } catch (err) {
        console.error('Erro ao excluir item:', err);
      }
    },
    async duplicarItem(item) {
      try {
        const copia = { ...item };
        delete copia.id;
        copia.organizacaoId = this.organizacaoId;
        copia.criadoPor = this.user.uid;
        copia.dataCriacao = new Date();
        await addDoc(collection(db, 'itens'), copia);
        this.carregarItens();
      } catch (err) {
        console.error('Erro ao duplicar item:', err);
      }
    }
  },
  mounted() {
    this.carregarItens();
    this.carregarProjetosDisponiveis();
  }
};
</script>
