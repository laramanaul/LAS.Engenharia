<<<<<<< HEAD
<template>
  <div class="tarefas-view">
    <h2>Gestão de Tarefas</h2>

    <!-- Controles superiores -->
    <div class="topo-controles">
      <button class="botao-destaque" @click="abrirFormulario = true">➕ Nova Tarefa</button>
      <input type="text" v-model="filtroBusca" placeholder="Buscar tarefas..." class="campo-busca" />
      <select v-model="filtroEtapa">
        <option value="">Todas as Etapas</option>
        <option v-for="etapa in etapasDisponiveis" :key="etapa.id" :value="etapa.NomeEtapa">
          {{ etapa.NomeEtapa }}
        </option>
      </select>
      <select v-model="filtroPrioridade">
        <option value="">Todas</option>
        <option value="Alta">Somente Prioridade Alta</option>
        <option value="Vencida">Somente Vencidas</option>
        <option value="Normal">Somente Normais</option>
      </select>
    </div>

     <!-- Modal de formulário -->
    <div v-if="abrirFormulario" class="modal-overlay">
      <div class="modal">
        <h3>{{ editandoId ? 'Editar Tarefa' : 'Nova Tarefa' }}</h3>

        <div class="formulario-projeto">
          <div class="form-coluna">
            <label>Demanda</label>
            <input v-model="novaTarefa.Titulo" placeholder="Título da tarefa" required />
          </div>

          <div class="form-linha">
            <div class="form-coluna">
              <label>Data Início</label>
              <input type="date" v-model="novaTarefa.DataInicio" required />
            </div>
            <div class="form-coluna">
              <label>Data Limite</label>
              <input type="date" v-model="novaTarefa.DataLimite" required />
            </div>
            <div class="form-coluna">
              <label>Prioridade</label>
              <select v-model="novaTarefa.prioridade">
                <option value="">Normal</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>

          <div class="form-linha">
            <div class="form-coluna">
              <label>Etapa Relacionada</label>
              <select v-model="novaTarefa.Etapa" required>
                <option disabled value="">Selecione</option>
                <option v-for="etapa in etapasDisponiveis" :key="etapa.id" :value="etapa.NomeEtapa">
                  {{ etapa.NomeEtapa }}
                </option>
              </select>
            </div>
            <div class="form-coluna">
              <label>Responsável</label>
              <select v-model="novaTarefa.Responsavel" required>
                <option disabled value="">Selecione</option>
                <option v-for="f in funcionariosDisponiveis" :key="f.id" :value="f.Nome">
                  {{ f.Nome }}
                </option>
              </select>
            </div>
            <div class="form-coluna">
              <label>Status</label>
              <select v-model="novaTarefa.Status" required>
                <option disabled value="">Selecione</option>
                <option>Pendente</option>
                <option>Em Andamento</option>
                <option>Concluída</option>
              </select>
            </div>
          </div>

          <div class="form-coluna" style="flex: 1 1 100%; max-height: 100px;">
            <label>Anotações</label>
            <textarea v-model="novaTarefa.Anotacoes" rows="3" placeholder="Observações adicionais..."></textarea>
          </div>

          <div class="modal-actions">
            <button class="botao-destaque" @click="salvarTarefa">
              {{ editandoId ? 'Atualizar' : 'Adicionar' }} Tarefa
            </button>
            <button class="botao" @click="cancelarEdicao">Cancelar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Colunas Kanban -->
    <div class="kanban-container alinhado-esquerda">
      <div
        class="kanban-coluna"
        v-for="status in ['Pendente', 'Em Andamento', 'Concluída']"
        :key="status"
      >
        <div class="kanban-header">
          <h3>{{ status }}</h3>
          <span class="contador">({{ tarefasFiltradasPorStatus[status].length }})</span>
        </div>
        <draggable
          v-model="tarefasPorStatus[status]"
          group="kanban"
          item-key="id"
          class="kanban-list"
          @end="(evento) => onDropEvento(evento, status)"
        >
          <template #item="{ element: tarefa }">
            <div
              class="tarefa-card"
              :class="[
                tarefa.Status.toLowerCase().replace(/\\s/g, '-'),
                tarefa.prioridade === 'Alta' ? 'prioridade-alta' : '',
                new Date(tarefa.DataLimite) < new Date() ? 'vencida' : ''
              ]"
            >
              <h4>
                <span v-if="tarefa.Status === 'Pendente'">🕒</span>
                <span v-else-if="tarefa.Status === 'Em Andamento'">🚧</span>
                <span v-else-if="tarefa.Status === 'Concluída'">✅</span>
                {{ tarefa.Titulo }}
              </h4>
              <p><strong>Responsável:</strong> {{ tarefa.Responsavel }}</p>
              <p><strong>Início:</strong> {{ formatarData(tarefa.DataInicio) }}</p>
              <p><strong>Limite:</strong> {{ formatarData(tarefa.DataLimite) }}</p>
              <p><strong>Anotações:</strong> {{ tarefa.Anotacoes || '—' }}</p>
              <label :title="'Alterar status da tarefa'">Status:</label>
              <select v-model="tarefa.Status" @change="atualizarStatus(tarefa)">
                <option>Pendente</option>
                <option>Em Andamento</option>
                <option>Concluída</option>
              </select>
              <div class="acoes-wrapper">
                <button class="botao-editar" @click="editarTarefa(tarefa)">✏️</button>
                <button class="botao-excluir" @click="excluirTarefa(tarefa.id)">🗑️</button>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>



<script>
import { db } from '../firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc
} from 'firebase/firestore';
import draggable from 'vuedraggable';

export default {
  name: 'TarefasView',
  components: { draggable },
  props: {
    user: Object,
    organizacaoId: String,
    projetoAtivo: String
  },
  data() {
    const hoje = new Date().toISOString().substring(0, 10);
    return {
      tarefas: [],
      etapasDisponiveis: [],
      funcionariosDisponiveis: [],
      abrirFormulario: false,
      editandoId: '',
      filtroBusca: '',
      filtroEtapa: '',
      filtroPrioridade: '',
      novaTarefa: {
        Titulo: '',
        Responsavel: '',
        DataInicio: hoje,
        DataLimite: '',
        Status: '',
        Etapa: '',
        Anotacoes: '',
        prioridade: ''
      }
    };
  },
  computed: {
    tarefasFiltradas() {
      const termo = this.filtroBusca?.toLowerCase().trim();
      return this.tarefas.filter(t => {
        const porBusca = termo
          ? (t.Titulo || '').toLowerCase().includes(termo) ||
            (t.Anotacoes || '').toLowerCase().includes(termo) ||
            (t.Responsavel || '').toLowerCase().includes(termo)
          : true;

        const porEtapa = this.filtroEtapa ? t.Etapa === this.filtroEtapa : true;

        const porPrioridade = this.filtroPrioridade === 'Alta'
          ? t.prioridade === 'Alta'
          : this.filtroPrioridade === 'Vencida'
          ? new Date(t.DataLimite) < new Date()
          : this.filtroPrioridade === 'Normal'
          ? !t.prioridade || t.prioridade === ''
          : true;

        return porBusca && porEtapa && porPrioridade;
      });
    },
    tarefasPorStatus() {
      return {
        'Pendente': this.tarefasFiltradas.filter(t => t.Status === 'Pendente'),
        'Em Andamento': this.tarefasFiltradas.filter(t => t.Status === 'Em Andamento'),
        'Concluída': this.tarefasFiltradas.filter(t => t.Status === 'Concluída')
      };
    },
    tarefasFiltradasPorStatus() {
      return this.tarefasPorStatus;
    }
  },
  watch: {
    organizacaoId: 'carregarDados',
    projetoAtivo: 'carregarDados',
    user: {
      handler(novo) {
        if (novo?.uid && this.organizacaoId && this.projetoAtivo) {
          this.carregarDados();
        }
      },
      deep: true
    }
  },
  methods: {
    async carregarDados() {
      if (!this.organizacaoId || !this.user?.uid || !this.projetoAtivo) return;
      try {
        const [tarefasSnap, etapasSnap, funcionariosSnap] = await Promise.all([
          getDocs(collection(db, 'tarefas')),
          getDocs(collection(db, 'etapas')),
          getDocs(collection(db, 'funcionarios'))
        ]);

        const todasTarefas = tarefasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.tarefas = todasTarefas.filter(t =>
          t.organizacaoId === this.organizacaoId &&
          t.projetoId === this.projetoAtivo 
        );

        const todasEtapas = etapasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.etapasDisponiveis = todasEtapas
  .filter(e =>
    e.organizacaoId === this.organizacaoId &&
    e.ProjetosVinculados?.includes(this.projetoAtivo)
  )
  .sort((a, b) => (a.NomeEtapa || '').localeCompare(b.NomeEtapa || ''));

this.funcionariosDisponiveis = funcionariosSnap.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter(f => f.organizacaoId === this.organizacaoId)
  .sort((a, b) => (a.Nome || '').localeCompare(b.Nome || ''));


      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    },

    async salvarTarefa() {
      if (!this.organizacaoId || !this.user?.uid || !this.projetoAtivo) {
        alert("Organização, projeto ou usuário não definidos.");
        return;
      }

      const camposObrigatorios = ['Titulo', 'Responsavel', 'DataInicio', 'DataLimite', 'Status', 'Etapa'];
      const faltando = camposObrigatorios.filter(c => !this.novaTarefa[c]?.toString().trim());

      if (faltando.length) {
        alert("Preencha todos os campos obrigatórios antes de continuar.");
        return;
      }

      const dados = {
        ...this.novaTarefa,
        organizacaoId: this.organizacaoId,
        projetoId: this.projetoAtivo,
        criadoPor: this.user.uid,
        dataCriacao: new Date()
      };

      try {
        if (this.editandoId) {
          await updateDoc(doc(db, 'tarefas', this.editandoId), dados);
        } else {
          await addDoc(collection(db, 'tarefas'), dados);
        }
        this.cancelarEdicao();
        this.carregarDados();
      } catch (err) {
        console.error('Erro ao salvar tarefa:', err);
      }
    },

    editarTarefa(tarefa) {
      this.novaTarefa = { ...tarefa };
      this.editandoId = tarefa.id;
      this.abrirFormulario = true;
    },

    cancelarEdicao() {
      const hoje = new Date().toISOString().substring(0, 10);
      this.editandoId = '';
      this.abrirFormulario = false;
      this.novaTarefa = {
        Titulo: '',
        Responsavel: '',
        DataInicio: hoje,
        DataLimite: '',
        Status: '',
        Etapa: '',
        Anotacoes: '',
        prioridade: ''
      };
    },

    async excluirTarefa(id) {
      if (confirm("Deseja excluir esta tarefa?")) {
        try {
          await deleteDoc(doc(db, 'tarefas', id));
          this.carregarDados();
        } catch (err) {
          console.error('Erro ao excluir tarefa:', err);
        }
      }
    },

    async atualizarStatus(tarefa) {
      try {
        const tarefaRef = doc(db, 'tarefas', tarefa.id);
        await updateDoc(tarefaRef, { Status: tarefa.Status });
      } catch (err) {
        console.error('Erro ao atualizar status da tarefa:', err);
      }
    },

    async onDropEvento(evento, novoStatus) {
      const tarefa = evento?.item?.context?.element;
      if (tarefa && tarefa.Status !== novoStatus) {
        tarefa.Status = novoStatus;
        try {
          await updateDoc(doc(db, 'tarefas', tarefa.id), { Status: novoStatus });
        } catch (err) {
          console.error('Erro ao atualizar status via drag and drop:', err);
        }
      }
    },

    formatarData(data) {
      if (!data) return '—';
      const d = new Date(data + 'T00:00:00');
      return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }
  },
  mounted() {
    if (this.organizacaoId && this.projetoAtivo && this.user?.uid) {
      this.carregarDados();
    }
  }
};
</script>

=======
<template>
  <div class="tarefas-view">
    <h2>Gestão de Tarefas</h2>

    <!-- Controles superiores -->
    <div class="topo-controles">
      <button class="botao-destaque" @click="abrirFormulario = true">➕ Nova Tarefa</button>
      <input type="text" v-model="filtroBusca" placeholder="Buscar tarefas..." class="campo-busca" />
      <select v-model="filtroEtapa">
        <option value="">Todas as Etapas</option>
        <option v-for="etapa in etapasDisponiveis" :key="etapa.id" :value="etapa.NomeEtapa">
          {{ etapa.NomeEtapa }}
        </option>
      </select>
      <select v-model="filtroPrioridade">
        <option value="">Todas</option>
        <option value="Alta">Somente Prioridade Alta</option>
        <option value="Vencida">Somente Vencidas</option>
        <option value="Normal">Somente Normais</option>
      </select>
    </div>

     <!-- Modal de formulário -->
    <div v-if="abrirFormulario" class="modal-overlay">
      <div class="modal">
        <h3>{{ editandoId ? 'Editar Tarefa' : 'Nova Tarefa' }}</h3>

        <div class="formulario-projeto">
          <div class="form-coluna">
            <label>Demanda</label>
            <input v-model="novaTarefa.Titulo" placeholder="Título da tarefa" required />
          </div>

          <div class="form-linha">
            <div class="form-coluna">
              <label>Data Início</label>
              <input type="date" v-model="novaTarefa.DataInicio" required />
            </div>
            <div class="form-coluna">
              <label>Data Limite</label>
              <input type="date" v-model="novaTarefa.DataLimite" required />
            </div>
            <div class="form-coluna">
              <label>Prioridade</label>
              <select v-model="novaTarefa.prioridade">
                <option value="">Normal</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>

          <div class="form-linha">
            <div class="form-coluna">
              <label>Etapa Relacionada</label>
              <select v-model="novaTarefa.Etapa" required>
                <option disabled value="">Selecione</option>
                <option v-for="etapa in etapasDisponiveis" :key="etapa.id" :value="etapa.NomeEtapa">
                  {{ etapa.NomeEtapa }}
                </option>
              </select>
            </div>
            <div class="form-coluna">
              <label>Responsável</label>
              <select v-model="novaTarefa.Responsavel" required>
                <option disabled value="">Selecione</option>
                <option v-for="f in funcionariosDisponiveis" :key="f.id" :value="f.Nome">
                  {{ f.Nome }}
                </option>
              </select>
            </div>
            <div class="form-coluna">
              <label>Status</label>
              <select v-model="novaTarefa.Status" required>
                <option disabled value="">Selecione</option>
                <option>Pendente</option>
                <option>Em Andamento</option>
                <option>Concluída</option>
              </select>
            </div>
          </div>

          <div class="form-coluna" style="flex: 1 1 100%; max-height: 100px;">
            <label>Anotações</label>
            <textarea v-model="novaTarefa.Anotacoes" rows="3" placeholder="Observações adicionais..."></textarea>
          </div>

          <div class="modal-actions">
            <button class="botao-destaque" @click="salvarTarefa">
              {{ editandoId ? 'Atualizar' : 'Adicionar' }} Tarefa
            </button>
            <button class="botao" @click="cancelarEdicao">Cancelar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Colunas Kanban -->
    <div class="kanban-container alinhado-esquerda">
      <div
        class="kanban-coluna"
        v-for="status in ['Pendente', 'Em Andamento', 'Concluída']"
        :key="status"
      >
        <div class="kanban-header">
          <h3>{{ status }}</h3>
          <span class="contador">({{ tarefasFiltradasPorStatus[status].length }})</span>
        </div>
        <draggable
          v-model="tarefasPorStatus[status]"
          group="kanban"
          item-key="id"
          class="kanban-list"
          @end="(evento) => onDropEvento(evento, status)"
        >
          <template #item="{ element: tarefa }">
            <div
              class="tarefa-card"
              :class="[
                tarefa.Status.toLowerCase().replace(/\\s/g, '-'),
                tarefa.prioridade === 'Alta' ? 'prioridade-alta' : '',
                new Date(tarefa.DataLimite) < new Date() ? 'vencida' : ''
              ]"
            >
              <h4>
                <span v-if="tarefa.Status === 'Pendente'">🕒</span>
                <span v-else-if="tarefa.Status === 'Em Andamento'">🚧</span>
                <span v-else-if="tarefa.Status === 'Concluída'">✅</span>
                {{ tarefa.Titulo }}
              </h4>
              <p><strong>Responsável:</strong> {{ tarefa.Responsavel }}</p>
              <p><strong>Início:</strong> {{ formatarData(tarefa.DataInicio) }}</p>
              <p><strong>Limite:</strong> {{ formatarData(tarefa.DataLimite) }}</p>
              <p><strong>Anotações:</strong> {{ tarefa.Anotacoes || '—' }}</p>
              <label :title="'Alterar status da tarefa'">Status:</label>
              <select v-model="tarefa.Status" @change="atualizarStatus(tarefa)">
                <option>Pendente</option>
                <option>Em Andamento</option>
                <option>Concluída</option>
              </select>
              <div class="acoes-wrapper">
                <button class="botao-editar" @click="editarTarefa(tarefa)">✏️</button>
                <button class="botao-excluir" @click="excluirTarefa(tarefa.id)">🗑️</button>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>



<script>
import { db } from '../firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc
} from 'firebase/firestore';
import draggable from 'vuedraggable';

export default {
  name: 'TarefasView',
  components: { draggable },
  props: {
    user: Object,
    organizacaoId: String,
    projetoAtivo: String
  },
  data() {
    const hoje = new Date().toISOString().substring(0, 10);
    return {
      tarefas: [],
      etapasDisponiveis: [],
      funcionariosDisponiveis: [],
      abrirFormulario: false,
      editandoId: '',
      filtroBusca: '',
      filtroEtapa: '',
      filtroPrioridade: '',
      novaTarefa: {
        Titulo: '',
        Responsavel: '',
        DataInicio: hoje,
        DataLimite: '',
        Status: '',
        Etapa: '',
        Anotacoes: '',
        prioridade: ''
      }
    };
  },
  computed: {
    tarefasFiltradas() {
      const termo = this.filtroBusca?.toLowerCase().trim();
      return this.tarefas.filter(t => {
        const porBusca = termo
          ? (t.Titulo || '').toLowerCase().includes(termo) ||
            (t.Anotacoes || '').toLowerCase().includes(termo) ||
            (t.Responsavel || '').toLowerCase().includes(termo)
          : true;

        const porEtapa = this.filtroEtapa ? t.Etapa === this.filtroEtapa : true;

        const porPrioridade = this.filtroPrioridade === 'Alta'
          ? t.prioridade === 'Alta'
          : this.filtroPrioridade === 'Vencida'
          ? new Date(t.DataLimite) < new Date()
          : this.filtroPrioridade === 'Normal'
          ? !t.prioridade || t.prioridade === ''
          : true;

        return porBusca && porEtapa && porPrioridade;
      });
    },
    tarefasPorStatus() {
      return {
        'Pendente': this.tarefasFiltradas.filter(t => t.Status === 'Pendente'),
        'Em Andamento': this.tarefasFiltradas.filter(t => t.Status === 'Em Andamento'),
        'Concluída': this.tarefasFiltradas.filter(t => t.Status === 'Concluída')
      };
    },
    tarefasFiltradasPorStatus() {
      return this.tarefasPorStatus;
    }
  },
  watch: {
    organizacaoId: 'carregarDados',
    projetoAtivo: 'carregarDados',
    user: {
      handler(novo) {
        if (novo?.uid && this.organizacaoId && this.projetoAtivo) {
          this.carregarDados();
        }
      },
      deep: true
    }
  },
  methods: {
    async carregarDados() {
      if (!this.organizacaoId || !this.user?.uid || !this.projetoAtivo) return;
      try {
        const [tarefasSnap, etapasSnap, funcionariosSnap] = await Promise.all([
          getDocs(collection(db, 'tarefas')),
          getDocs(collection(db, 'etapas')),
          getDocs(collection(db, 'funcionarios'))
        ]);

        const todasTarefas = tarefasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.tarefas = todasTarefas.filter(t =>
          t.organizacaoId === this.organizacaoId &&
          t.projetoId === this.projetoAtivo 
        );

        const todasEtapas = etapasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.etapasDisponiveis = todasEtapas
  .filter(e =>
    e.organizacaoId === this.organizacaoId &&
    e.ProjetosVinculados?.includes(this.projetoAtivo)
  )
  .sort((a, b) => (a.NomeEtapa || '').localeCompare(b.NomeEtapa || ''));

this.funcionariosDisponiveis = funcionariosSnap.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter(f => f.organizacaoId === this.organizacaoId)
  .sort((a, b) => (a.Nome || '').localeCompare(b.Nome || ''));


      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    },

    async salvarTarefa() {
      if (!this.organizacaoId || !this.user?.uid || !this.projetoAtivo) {
        alert("Organização, projeto ou usuário não definidos.");
        return;
      }

      const camposObrigatorios = ['Titulo', 'Responsavel', 'DataInicio', 'DataLimite', 'Status', 'Etapa'];
      const faltando = camposObrigatorios.filter(c => !this.novaTarefa[c]?.toString().trim());

      if (faltando.length) {
        alert("Preencha todos os campos obrigatórios antes de continuar.");
        return;
      }

      const dados = {
        ...this.novaTarefa,
        organizacaoId: this.organizacaoId,
        projetoId: this.projetoAtivo,
        criadoPor: this.user.uid,
        dataCriacao: new Date()
      };

      try {
        if (this.editandoId) {
          await updateDoc(doc(db, 'tarefas', this.editandoId), dados);
        } else {
          await addDoc(collection(db, 'tarefas'), dados);
        }
        this.cancelarEdicao();
        this.carregarDados();
      } catch (err) {
        console.error('Erro ao salvar tarefa:', err);
      }
    },

    editarTarefa(tarefa) {
      this.novaTarefa = { ...tarefa };
      this.editandoId = tarefa.id;
      this.abrirFormulario = true;
    },

    cancelarEdicao() {
      const hoje = new Date().toISOString().substring(0, 10);
      this.editandoId = '';
      this.abrirFormulario = false;
      this.novaTarefa = {
        Titulo: '',
        Responsavel: '',
        DataInicio: hoje,
        DataLimite: '',
        Status: '',
        Etapa: '',
        Anotacoes: '',
        prioridade: ''
      };
    },

    async excluirTarefa(id) {
      if (confirm("Deseja excluir esta tarefa?")) {
        try {
          await deleteDoc(doc(db, 'tarefas', id));
          this.carregarDados();
        } catch (err) {
          console.error('Erro ao excluir tarefa:', err);
        }
      }
    },

    async atualizarStatus(tarefa) {
      try {
        const tarefaRef = doc(db, 'tarefas', tarefa.id);
        await updateDoc(tarefaRef, { Status: tarefa.Status });
      } catch (err) {
        console.error('Erro ao atualizar status da tarefa:', err);
      }
    },

    async onDropEvento(evento, novoStatus) {
      const tarefa = evento?.item?.context?.element;
      if (tarefa && tarefa.Status !== novoStatus) {
        tarefa.Status = novoStatus;
        try {
          await updateDoc(doc(db, 'tarefas', tarefa.id), { Status: novoStatus });
        } catch (err) {
          console.error('Erro ao atualizar status via drag and drop:', err);
        }
      }
    },

    formatarData(data) {
      if (!data) return '—';
      const d = new Date(data + 'T00:00:00');
      return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }
  },
  mounted() {
    if (this.organizacaoId && this.projetoAtivo && this.user?.uid) {
      this.carregarDados();
    }
  }
};
</script>

>>>>>>> 9396cd378334692f8c2f504fe0827aa082427823
