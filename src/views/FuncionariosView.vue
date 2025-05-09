<template>
  <div class="funcionarios-view projetos-view">
    <h2>Funcionários</h2>

    <div class="topo-controles">
      <button class="botao-destaque" @click="abrirFormulario = true">➕ Adicionar Funcionário</button>
      <input type="text" v-model="filtroBusca" placeholder="Buscar por nome ou cargo..." class="campo-busca" />
    </div>

    <div v-if="abrirFormulario" class="modal-overlay">
      <div class="modal">
        <h3>{{ editandoId ? 'Editar Funcionário' : 'Novo Funcionário' }}</h3>

        <div class="formulario-projeto">
          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Nome</label>
            <input v-model="novoFuncionario.Nome" placeholder="Nome completo" required />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Email</label>
            <input v-model="novoFuncionario.CPF" placeholder="email" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Cargo</label>
            <input v-model="novoFuncionario.Cargo" placeholder="Cargo" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Contato</label>
            <input v-model="novoFuncionario.Contato" placeholder="Telefone" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Data de Admissão</label>
            <input type="date" v-model="novoFuncionario.DataAdmissao" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Data de Desligamento</label>
            <input type="date" v-model="novoFuncionario.DataDesligamento" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Salário</label>
            <input type="number" v-model="novoFuncionario.Salario" placeholder="0.00" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Formato de Pagamento</label>
            <select v-model="novoFuncionario.FormaPagamento">
              <option disabled value="">Selecione</option>
              <option>Mensalista</option>
              <option>Diária</option>
              <option>Por tarefa</option>
              <option>Outro</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Anotações</label>
            <textarea v-model="novoFuncionario.Anotacoes" rows="3" placeholder="Observações adicionais..."></textarea>
          </div>

          <div class="form-coluna">
            <label>Projetos Vinculados</label>
            <div class="checkbox-grid">
              <label v-for="projeto in projetosDisponiveis" :key="projeto.id" class="checkbox-item">
                <input type="checkbox" :value="projeto.id" v-model="novoFuncionario.ProjetosVinculados" />
                {{ projeto.NomeProjeto }}
              </label>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="botao-destaque" @click="salvarFuncionario">
            {{ editandoId ? 'Atualizar' : 'Adicionar' }} Funcionário
          </button>
          <button class="botao" @click="cancelarEdicao">Cancelar</button>
        </div>
      </div>
    </div>

    <div class="tabela-container">
      <div v-if="!funcionariosFiltrados.length" style="margin: 1rem 0; color: #a00;">
        ⚠️ Nenhum funcionário encontrado.
      </div>

      <table v-else class="projetos-tabela">
        <thead>
          <tr>
            <th>Ações</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Cargo</th>
            <th>Contato</th>
            <th>Admissão</th>
            <th>Desligamento</th>
            <th>Salário</th>
            <th>Forma</th>
            <th>Projetos</th>
            <th>Anotações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="funcionario in funcionariosFiltrados" :key="funcionario.id">
            <td>
              <div class="acoes-wrapper">
                <button class="botao-editar" @click="editarFuncionario(funcionario)">✏️</button>
                <button class="botao-excluir" @click="excluirFuncionario(funcionario.id)">🗑️</button>
              </div>
            </td>
            <td>{{ funcionario.Nome || '—' }}</td>
            <td>{{ funcionario.CPF || '—' }}</td>
            <td>{{ funcionario.Cargo || '—' }}</td>
            <td>{{ funcionario.Contato || '—' }}</td>
            <td>{{ funcionario.DataAdmissao || '—' }}</td>
            <td>{{ funcionario.DataDesligamento || '—' }}</td>
            <td>R$ {{ Number(funcionario.Salario || 0).toFixed(2) }}</td>
            <td>{{ funcionario.FormaPagamento || '—' }}</td>
            <td>
              <ul v-if="funcionario.ProjetosVinculados?.length">
                <li v-for="pid in funcionario.ProjetosVinculados" :key="pid">{{ buscarNomeProjeto(pid) }}</li>
              </ul>
              <span v-else>—</span>
            </td>
            <td>{{ funcionario.Anotacoes || '—' }}</td>
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
  name: 'FuncionariosView',
props: {
  user: Object,
  organizacaoId: String,
  projetoAtivo: String // ← necessário
},

  data() {
    return {
      funcionarios: [],
      funcionarioSelecionado: '',
      editandoId: '',
      abrirFormulario: false,
      filtroBusca: '',
      projetosDisponiveis: [],
      novoFuncionario: {
        Nome: '',
        CPF: '',
        Cargo: '',
        Contato: '',
        DataAdmissao: '',
        DataDesligamento: '',
        Salario: 0,
        FormaPagamento: '',
        Anotacoes: '',
        ProjetosVinculados: []
      }
    };
  },
  computed: {
    funcionariosFiltrados() {
      const termo = this.filtroBusca?.toLowerCase().trim();
      if (!termo) return this.funcionarios;
      return this.funcionarios.filter(f =>
        (f.Nome || '').toLowerCase().includes(termo) ||
        (f.Cargo || '').toLowerCase().includes(termo)
      );
    }
  },
  watch: {
    organizacaoId(nova) {
      if (nova && this.user?.uid) {
        this.carregarFuncionarios();
        this.carregarProjetosDisponiveis();
      }
    },
    user: {
      handler(novo) {
        if (novo?.uid && this.organizacaoId) {
          this.carregarFuncionarios();
          this.carregarProjetosDisponiveis();
        }
      },
      deep: true
    }
  },
  methods: {
async carregarFuncionarios() {
  if (!this.organizacaoId) return;
  const snapshot = await getDocs(collection(db, 'funcionarios'));
this.funcionarios = snapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter(f => f.organizacaoId === this.organizacaoId)
  .sort((a, b) => (a.Nome || '').localeCompare(b.Nome || ''));

}
,
    async carregarProjetosDisponiveis() {
      const snap = await getDocs(collection(db, 'projetos'));
      const todos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.projetosDisponiveis = todos.filter(p =>
        p.organizacaoId === this.organizacaoId &&
        (p.ProjetosVinculados === this.projetosDisponiveis.map || (p.allowedUsers || []).includes(this.user.uid))
      );
      if (!this.editandoId) {
        this.novoFuncionario.ProjetosVinculados = this.projetosDisponiveis.map(p => p.id);
      }
    },
    buscarNomeProjeto(id) {
      const projeto = this.projetosDisponiveis.find(p => p.id === id);
      return projeto?.NomeProjeto || '—';
    },
    async salvarFuncionario() {
      if (!this.organizacaoId || !this.user?.uid) return;
      const dados = {
        ...this.novoFuncionario,
        organizacaoId: this.organizacaoId,
        criadoPor: this.user.uid,
        dataCriacao: new Date()
      };
      if (this.editandoId) {
        await updateDoc(doc(db, 'funcionarios', this.editandoId), dados);
      } else {
        await addDoc(collection(db, 'funcionarios'), dados);
      }
      this.cancelarEdicao();
      this.carregarFuncionarios();
    },
    editarFuncionario(func) {
      this.novoFuncionario = { ...func };
      this.editandoId = func.id;
      this.abrirFormulario = true;
    },
    cancelarEdicao() {
      this.editandoId = '';
      this.abrirFormulario = false;
      this.novoFuncionario = {
        Nome: '',
        CPF: '',
        Cargo: '',
        Contato: '',
        DataAdmissao: '',
        DataDesligamento: '',
        Salario: 0,
        FormaPagamento: '',
        Anotacoes: '',
        ProjetosVinculados: []
      };
    },
    async excluirFuncionario(id) {
      if (confirm("Deseja excluir este funcionário?")) {
        await deleteDoc(doc(db, 'funcionarios', id));
        this.carregarFuncionarios();
      }
    }
  },
  mounted() {
    if (this.organizacaoId && this.user?.uid) {
      this.carregarFuncionarios();
      this.carregarProjetosDisponiveis();
    }
  }
};
</script>
