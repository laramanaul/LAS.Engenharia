<template>
  <div class="execucao-view projetos-view">
    <h2>Execuções de Etapas</h2>

    <div class="topo-controles">
      <button class="botao-destaque" @click="abrirFormulario">➕ Nova Execução</button>
      <input type="text" v-model="filtroBusca" placeholder="Buscar execuções..." class="campo-busca" />
    </div>

    <div v-if="formularioAberto" class="modal-overlay">
      <div class="modal">
        <h3>{{ editandoId ? 'Editar Execução' : 'Nova Execução' }}</h3>

        <div class="formulario-projeto">
          <div class="form-coluna" style="flex: 1 1 30%">
            <label>Data de Execução</label>
            <input type="date" v-model="execucaoAtual.DataExecucao" />
          </div>

          <div class="form-coluna" style="flex: 1 1 30%">
            <label>Projeto</label>
            <select v-model="execucaoAtual.ProjetoID">
              <option disabled value="">Selecione o projeto</option>
              <option v-for="p in projetosDisponiveis" :key="p.id" :value="p.id">{{ p.NomeProjeto }}</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 30%">
            <label>Etapa</label>
            <select v-model="execucaoAtual.EtapaID">
              <option disabled value="">Selecione a etapa</option>
              <option v-for="e in etapasDisponiveis" :key="e.id" :value="e.id">{{ e.NomeEtapa }}</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 45%">
            <label>Fornecedor</label>
            <select v-model="execucaoAtual.FornecedorID">
              <option disabled value="">Selecione o fornecedor</option>
              <option v-for="f in fornecedores" :key="f.id" :value="f.id">{{ f.Nome }}</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 45%">
            <label>Item</label>
            <select v-model="execucaoAtual.ItemID" @change="atualizarInfoItem">
              <option disabled value="">Selecione o item</option>
              <option v-for="i in itens" :key="i.id" :value="i.id">{{ i.NomeItem }}</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 45%">
            <label>Unidade</label>
            <input v-model="execucaoAtual.Unidade" readonly />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%">
            <label>Valor de Referência (R$)</label>
            <input v-model="execucaoAtual.ValorReferencia" readonly />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%">
            <label>Valor Orçado (R$)</label>
            <input type="number" v-model.number="execucaoAtual.ValorCotado" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%">
            <label>Valor Pago (R$)</label>
            <input type="number" v-model.number="execucaoAtual.ValorReal" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%">
            <label>Forma de Pagamento</label>
            <select v-model="execucaoAtual.FormaPagamento">
              <option disabled value="">Selecione</option>
              <option>Dinheiro em espécie</option>
              <option>Pix</option>
              <option>Cartão de Crédito</option>
              <option>Cartão de Débito</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 45%">
            <label>Situação da Execução</label>
            <select v-model="execucaoAtual.Status">
              <option disabled value="">Selecione</option>
              <option>Pendente</option>
              <option>Finalizada</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 100%">
            <label>Anotações</label>
            <textarea v-model="execucaoAtual.Anotacoes" rows="3"></textarea>
          </div>
        </div>

        <div class="modal-actions">
          <button class="botao-destaque" @click="salvarExecucao">
            {{ editandoId ? 'Atualizar' : 'Adicionar' }} Execução
          </button>
          <button class="botao" @click="cancelarEdicao">Cancelar</button>
        </div>
      </div>
    </div>

    <div class="filtros-execucao">
      <label>Situação:</label>
      <div class="filtro-botoes">
        <button :class="{ ativo: filtrosStatus.includes('Pendente') }" @click="alternarStatus('Pendente')">Pendente</button>
        <button :class="{ ativo: filtrosStatus.includes('Finalizada') }" @click="alternarStatus('Finalizada')">Finalizada</button>
      </div>
    </div>

    <div class="tabela-container">
      <table class="projetos-tabela">
        <thead>
          <tr>
            <th>Ações</th>
            <th>Data</th>
            <th>Projeto</th>
            <th>Etapa</th>
            <th>Item</th>
            <th>Fornecedor</th>
            <th>Valor Orçado</th>
            <th>Valor Pago</th>
            <th>Status</th>
            <th>Forma Pgto</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="execucao in execucoesFiltradas" :key="execucao.id">
            <td>
              <div class="acoes-wrapper">
                <button class="botao-editar" @click="editarExecucao(execucao)">✏️</button>
                <button class="botao-excluir" @click="excluirExecucao(execucao.id)">🗑️</button>
              </div>
            </td>
            <td>{{ formatarData(execucao.DataExecucao) }}</td>
            <td>{{ nomeProjeto(execucao.ProjetoID) }}</td>
            <td>{{ nomeEtapa(execucao.EtapaID) }}</td>
            <td>{{ nomeItem(execucao.ItemID) }}</td>
            <td>{{ nomeFornecedor(execucao.FornecedorID) }}</td>
            <td>R$ {{ execucao.ValorCotado?.toFixed(2) || '0.00' }}</td>
            <td>R$ {{ execucao.ValorReal?.toFixed(2) || '0.00' }}</td>
            <td>{{ execucao.Status }}</td>
            <td>{{ execucao.FormaPagamento }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>




<script>
import { db } from '../firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp
} from 'firebase/firestore';
import { nextTick } from 'vue';

export default {
  name: 'ExecucaoView',
  props: {
    user: Object,
    organizacaoId: String,
    projetoAtivo: String
  },
  data() {
    const hoje = new Date().toISOString().split('T')[0];
    return {
      execucoes: [],
      todasExecucoes: [],
      filtrosStatus: ['Pendente', 'Finalizada'],
      execucaoAtual: {
        DataExecucao: hoje,
        ProjetoID: this.projetoAtivo || '',
        EtapaID: '',
        FornecedorID: '',
        ItemID: '',
        Unidade: '',
        ValorReferencia: 0,
        ValorCotado: 0,
        ValorReal: 0,
        FormaPagamento: '',
        Status: '',
        Anotacoes: ''
      },
      editandoId: '',
      formularioAberto: false,
      filtroBusca: '',
      projetosDisponiveis: [],
      etapasDisponiveis: [],
      itens: [],
      fornecedores: []
    };
  },
  computed: {
    execucoesFiltradas() {
      const termo = this.filtroBusca.toLowerCase();
      return this.execucoes.filter(e =>
        this.filtrosStatus.includes(e.Status) &&
        (
          this.nomeProjeto(e.ProjetoID).toLowerCase().includes(termo) ||
          this.nomeItem(e.ItemID).toLowerCase().includes(termo) ||
          (e.Anotacoes || '').toLowerCase().includes(termo)
        )
      );
    }
  },
  methods: {
    async carregarTodosDados() {
      await Promise.all([
        this.carregarExecucoes(),
        this.carregarProjetos(),
        this.carregarItens(),
        this.carregarEtapas(),
        this.carregarFornecedores()
      ]);
    },
    formatarData(data) {
      const d = data?.toDate?.() || new Date(data);
      return d.toLocaleDateString();
    },
    nomeProjeto(id) {
      const p = this.projetosDisponiveis.find(p => p.id === id);
      return p?.NomeProjeto || '—';
    },
    nomeEtapa(id) {
      const e = this.etapasDisponiveis.find(e => e.id === id);
      return e?.NomeEtapa || '—';
    },
    nomeItem(id) {
      const i = this.itens.find(i => i.id === id);
      return i?.NomeItem || '—';
    },
    nomeFornecedor(id) {
      const f = this.fornecedores.find(f => f.id === id);
      return f?.Nome || '—';
    },
    async carregarExecucoes() {
      if (!this.organizacaoId || !this.user?.uid) return;
      const snapshot = await getDocs(collection(db, 'execucoes'));
      const todas = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(e => e.organizacaoId === this.organizacaoId);
      this.todasExecucoes = todas;
      this.filtrarExecucoes();
    },
    filtrarExecucoes() {
      if (!this.filtrosStatus.length) {
        this.execucoes = [];
      } else {
        this.execucoes = this.todasExecucoes.filter(
          e => this.filtrosStatus.includes(e.Status)
        );
      }
    },
    alternarStatus(situacao) {
      if (this.filtrosStatus.includes(situacao)) {
        this.filtrosStatus = this.filtrosStatus.filter(s => s !== situacao);
      } else {
        this.filtrosStatus.push(situacao);
      }
      this.filtrarExecucoes();
    },
async carregarProjetos() {
  if (!this.organizacaoId || !this.user?.uid) return;

  const snapshot = await getDocs(collection(db, 'projetos'));
  const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  this.projetosDisponiveis = todos
    .filter(p => {
      const allowed = Array.isArray(p.allowedUsers) ? p.allowedUsers : [];
      return (
        p.organizacaoId === this.organizacaoId
      );
    })
    .sort((a, b) => a.NomeProjeto.localeCompare(b.NomeProjeto));

  console.log("Projetos disponíveis:", this.projetosDisponiveis);
}
,
    async carregarItens() {
      if (!this.organizacaoId || !this.user?.uid) return;
      const snapItens = await getDocs(collection(db, 'itens'));
      const personalizados = snapItens.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(i =>
          i.organizacaoId === this.organizacaoId
        );
      const snapPadrao = await getDocs(collection(db, 'itensPadrao'));
      const padrao = snapPadrao.docs.map(doc => ({ id: doc.id, ...doc.data(), ehPadrao: true }));
      this.itens = [...padrao, ...personalizados].sort((a, b) =>
        (a.NomeItem || '').localeCompare(b.NomeItem || '')
      );
    },
    async carregarEtapas() {
      const snapshot = await getDocs(collection(db, 'etapas'));
      const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.etapasDisponiveis = todos
        .filter(e =>
          e.organizacaoId === this.organizacaoId
        )
        .sort((a, b) => a.NomeEtapa.localeCompare(b.NomeEtapa));
    },
    async carregarFornecedores() {
      const snapshot = await getDocs(collection(db, 'fornecedores'));
      const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.fornecedores = todos
        .filter(f =>
          f.organizacaoId === this.organizacaoId
        )
        .sort((a, b) => a.Nome.localeCompare(b.Nome));
    },
    atualizarInfoItem() {
      const item = this.itens.find(i => i.id === this.execucaoAtual.ItemID);
      if (item) {
        this.execucaoAtual.Unidade = item.Unidade || '';
        if (Array.isArray(item.Cotacoes) && item.Cotacoes.length > 0) {
          const valoresValidos = item.Cotacoes.map(c => parseFloat(c.valor)).filter(v => !isNaN(v));
          const menor = Math.min(...valoresValidos);
          this.execucaoAtual.ValorReferencia = isFinite(menor) ? menor : 0;
        } else {
          this.execucaoAtual.ValorReferencia = 0;
        }
      } else {
        this.execucaoAtual.Unidade = '';
        this.execucaoAtual.ValorReferencia = 0;
      }
    },
    abrirFormulario() {
      const hoje = new Date().toISOString().split('T')[0];
      this.execucaoAtual = {
        DataExecucao: hoje,
        ProjetoID: this.projetoAtivo || '',
        EtapaID: '',
        FornecedorID: '',
        ItemID: '',
        Unidade: '',
        ValorReferencia: 0,
        ValorCotado: 0,
        ValorReal: 0,
        FormaPagamento: '',
        Status: '',
        Anotacoes: ''
      };
      this.editandoId = '';
      this.formularioAberto = true;
    },
    cancelarEdicao() {
      this.editandoId = '';
      this.formularioAberto = false;
    },
    async salvarExecucao() {
      console.log("Salvar execução: ", {
        organizacaoId: this.organizacaoId,
        user: this.user?.uid,
        execucaoAtual: this.execucaoAtual
      });

      if (!this.organizacaoId || !this.user?.uid) {
        console.error('Dados ausentes para salvar execução');
        return;
      }

      const dados = {
        ...this.execucaoAtual,
        DataExecucao: Timestamp.fromDate(new Date(this.execucaoAtual.DataExecucao)),
        organizacaoId: this.organizacaoId,
        UsuarioID: this.user.uid,
        dataCriacao: new Date()
      };
      try {
        if (this.editandoId) {
          await updateDoc(doc(db, 'execucoes', this.editandoId), dados);
        } else {
          await addDoc(collection(db, 'execucoes'), dados);
        }
        this.cancelarEdicao();
        this.carregarExecucoes();
      } catch (err) {
        console.error('Erro ao salvar execução:', err);
      }
    },
    async editarExecucao(exec) {
      this.execucaoAtual = {
        ...exec,
        DataExecucao: exec.DataExecucao?.toDate?.().toISOString().split('T')[0] || ''
      };
      this.editandoId = exec.id;
      this.formularioAberto = true;
      await nextTick();
      this.atualizarInfoItem();
    },
    async excluirExecucao(id) {
      if (confirm('Deseja excluir esta execução?')) {
        try {
          await deleteDoc(doc(db, 'execucoes', id));
          this.carregarExecucoes();
        } catch (err) {
          console.error('Erro ao excluir execução:', err);
        }
      }
    }
  },
  watch: {
    organizacaoId(nova) {
      if (nova && this.user?.uid) {
        this.carregarTodosDados();
      }
    },
    projetoAtivo(novo) {
      if (novo && this.user?.uid) {
        this.execucaoAtual.ProjetoID = novo;
      }
    },
    user(novo) {
      if (novo?.uid && this.organizacaoId) {
        this.carregarTodosDados();
      }
    }
  },
  mounted() {
    if (this.organizacaoId && this.user?.uid) {
      this.carregarTodosDados();
    }
  }
};
</script>
