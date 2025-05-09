<template>
  <div class="projetos-view">
    <h2>Meus Projetos</h2>

    <div class="topo-controles">
      <div style="display: flex; gap: 1rem; align-items: center; width: 100%;">
        <button class="botao-destaque" @click="abrirFormulario = true">➕ Adicionar Projeto</button>
        <input type="text" v-model="filtroBusca" placeholder="Buscar projetos..." class="campo-busca" />
      </div>
    </div>

    <div v-if="abrirFormulario" class="modal-overlay">
      <div class="modal">
        <h3>{{ editandoId ? 'Editar Projeto' : 'Novo Projeto' }}</h3>

        <div class="formulario-projeto" style="gap: 0.5rem; min-width: unset;">
          <div class="form-coluna" v-for="(campo, label) in camposTexto" :key="label" style="flex: 1 1 30%;">
            <label>{{ campo.label }}</label>
            <input v-model="novoProjeto[label]" :placeholder="campo.label" required />
          </div>

          <div class="form-coluna" style="flex: 1 1 30%;">
            <label>Estado</label>
            <select v-model="novoProjeto.Estado" @change="carregarCidades" required>
              <option disabled value="">Selecione o Estado</option>
              <option v-for="estado in estados" :key="estado">{{ estado }}</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 30%;">
            <label>Cidade</label>
            <select v-model="novoProjeto.Cidade" required>
              <option disabled value="">Selecione a Cidade</option>
              <option v-for="cidade in cidades" :key="cidade">{{ cidade }}</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Tipo de Projeto</label>
            <div class="grid-opcoes">
              <button
                v-for="tipo in tiposProjeto"
                :key="tipo"
                :class="{ selecionado: novoProjeto.TipoProjeto === tipo }"
                @click="novoProjeto.TipoProjeto = tipo"
              >
                {{ tipo }}
              </button>
            </div>
          </div>

          <div class="form-coluna" style="flex: 1 1 30%;">
            <label>Data de Início</label>
            <input type="date" v-model="novoProjeto.DataInicioPrevista" required />
          </div>

          <div class="form-coluna" style="flex: 1 1 30%;">
            <label>Data de Fim</label>
            <input type="date" v-model="novoProjeto.DataFimPrevista" required />
          </div>

          <div class="form-coluna" style="flex: 1 1 30%;">
            <label>Status do projeto</label>
            <select v-model="novoProjeto.Status" required>
              <option disabled value="">Selecione o Status</option>
              <option>Pendente</option>
              <option>Em andamento</option>
              <option>Finalizado</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 48%;">
            <label>Anotações</label>
            <textarea v-model="novoProjeto.Anotacoes" rows="2" placeholder="Anotações"></textarea>
          </div>

          <div class="form-coluna" style="flex: 1 1 48%;">
            <label>Arquivos</label>
            <ul v-if="novoProjeto.Arquivos && novoProjeto.Arquivos.length">
              <li v-for="(url, index) in novoProjeto.Arquivos" :key="index">
                <a :href="url" target="_blank">Arquivo {{ index + 1 }}</a>
                <button @click="removerArquivo(index)" class="botao-excluir">Remover</button>
              </li>
            </ul>
            <input type="file" multiple @change="handleUpload" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="botao-destaque" @click="salvarProjeto">
            {{ editandoId ? 'Atualizar' : 'Adicionar' }} Projeto
          </button>
          <button class="botao" @click="cancelarEdicao">Cancelar</button>
        </div>
      </div>
    </div>

    <div class="tabela-container">
      <div v-if="!projetosFiltrados.length" style="margin: 1rem 0; color: #a00;">
        ⚠️ Nenhum projeto encontrado.
      </div>

      <table v-else class="projetos-tabela">
        <thead>
          <tr>
            <th style="text-align: left;">Ações</th>
            <th>Projeto</th>
            <th>Cliente</th>
            <th>Tipo de Obra</th>
            <th>Status da Obra</th>
            <th>Data Início</th>
            <th>Data Fim</th>
            <th>Estado</th>
            <th>Cidade</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="projeto in projetosFiltrados"
            :key="projeto.id"
            :class="{ selecionado: projetoSelecionado === projeto.id }"
          >
            <td style="text-align: left;">
              <div class="acoes-wrapper">
                <button class="botao-editar" @click="editarProjeto(projeto)">✏️</button>
                <button class="botao-excluir" @click="excluirProjeto(projeto.id)">🗑️</button>
              </div>
            </td>
            <td>{{ projeto.NomeProjeto || '—' }}</td>
            <td>{{ projeto.Cliente || '—' }}</td>
            <td>{{ projeto.TipoProjeto || '—' }}</td>
            <td>{{ projeto.Status || '—' }}</td>
            <td>{{ formatarData(projeto.DataInicioPrevista) || '—' }}</td>
            <td>{{ formatarData(projeto.DataFimPrevista) || '—' }}</td>
            <td>{{ projeto.Estado || '—' }}</td>
            <td>{{ projeto.Cidade || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>






<script>
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import dayjs from 'dayjs';

export default {
  name: 'ProjetosView',
  props: {
    user: Object,
    projetoAtivo: String,
    organizacaoId: String
  },
  data() {
    return {
      projetos: [],
      projetoSelecionado: '',
      editandoId: '',
      abrirFormulario: false,
      filtroBusca: '',
      novoProjeto: {
        NomeProjeto: '',
        Cliente: '',
        Endereco: '',
        TipoProjeto: '',
        DataInicioPrevista: '',
        DataFimPrevista: '',
        Status: '',
        ResponsavelTecnico: '',
        ART: '',
        Alvara: '',
        Estado: '',
        Cidade: '',
        Anotacoes: '',
        Arquivos: []
      },
      tiposProjeto: ['Construção Residencial', 'Reforma', 'Ampliação', 'Industrial', 'Obra Pública'],
      estados: [],
      cidades: [],
      camposTexto: {
        NomeProjeto: { label: 'Nome do Projeto' },
        Cliente: { label: 'Cliente' },
        Endereco: { label: 'Endereço' },
        ResponsavelTecnico: { label: 'Responsável Técnico' },
        ART: { label: 'Nº da ART da Obra' },
        Alvara: { label: 'Nº do Alvará da Obra' }
      }
    };
  },
  computed: {
  projetosFiltrados() {
    const termo = this.filtroBusca?.toLowerCase().trim();
    if (!termo) return this.projetos;

    return this.projetos.filter(p => {
      try {
        return Object.entries(p).some(([k, v]) =>
          typeof v === 'string' && v.toLowerCase().includes(termo)
        );
      } catch (err) {
        console.warn('Erro ao filtrar projeto:', p, err);
        return false;
      }
    });
  }
},
  watch: {
    projetoAtivo(novo) {
      this.projetoSelecionado = novo;
    },
  organizacaoId(nova) {
    console.log('👀 Watch: organizacaoId mudou para:', nova);
    if (nova && this.user?.uid) {
      this.carregarProjetos();
    }
    },
    user: {
      handler(novo) {
        if (novo?.uid && this.organizacaoId) {
          this.carregarProjetos();
        }
      },
      deep: true
    }
  },
  methods: {
    async carregarEstados() {
      try {
        const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        this.estados = (await res.json()).map(e => e.sigla);
      } catch (err) {
        console.error('Erro ao carregar estados:', err);
      }
    },

    async carregarCidades() {
      this.novoProjeto.Cidade = '';
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${this.novoProjeto.Estado}/municipios`);
      this.cidades = (await res.json()).map(c => c.nome);
    },

async carregarProjetos() {
  if (!this.organizacaoId || !this.user?.uid || !this.user?.email) {
    console.warn('🚫 Organização, UID ou e-mail não definidos');
    return;
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'projetos'));
    const todosProjetos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    this.projetos = todosProjetos.filter(p => {
      const pertenceOrganizacao = p.organizacaoId === this.organizacaoId;
      const criadoPorUsuario = p.criadoPor === this.user.uid;
      const compartilhadoComUsuario = Array.isArray(p.allowedUsers) && p.allowedUsers.includes(this.user.email);
      return pertenceOrganizacao && (criadoPorUsuario || compartilhadoComUsuario);
    });

    console.log('✅ Projetos carregados:', this.projetos.length);
  } catch (err) {
    console.error('❌ Erro ao carregar projetos:', err);
  }
},



    async salvarProjeto() {
      const camposObrigatorios = [
        'NomeProjeto', 'Cliente', 'TipoProjeto', 'DataInicioPrevista',
        'DataFimPrevista', 'Status', 'ResponsavelTecnico', 'ART', 'Alvara',
        'Estado', 'Cidade'
      ];

      const faltando = camposObrigatorios.filter(c => !this.novoProjeto[c]?.toString().trim());

      if (faltando.length) {
        alert("Preencha todos os campos obrigatórios antes de continuar.");
        return;
      }

      if (!this.organizacaoId) {
        alert('Você deve selecionar uma organização antes de criar um projeto.');
        return;
      }

      try {
        if (this.editandoId) {
          const projetoRef = doc(db, 'projetos', this.editandoId);
          await updateDoc(projetoRef, this.novoProjeto);
        } else {
          await addDoc(collection(db, 'projetos'), {
            ...this.novoProjeto,
            organizacaoId: this.organizacaoId,
            criadoPor: this.user.uid,
            dataCriacao: new Date()
          });
        }

        this.cancelarEdicao();
        this.carregarProjetos();
      } catch (err) {
        console.error('Erro ao salvar projeto:', err);
      }
    },

    editarProjeto(projeto) {
      this.novoProjeto = { ...projeto };
      this.editandoId = projeto.id;
      this.abrirFormulario = true;
    },

    cancelarEdicao() {
      this.editandoId = '';
      this.abrirFormulario = false;
      this.novoProjeto = {
        NomeProjeto: '', Cliente: '', Endereco: '', TipoProjeto: '', DataInicioPrevista: '',
        DataFimPrevista: '', Status: '', ResponsavelTecnico: '', ART: '', Alvara: '',
        Estado: '', Cidade: '', Anotacoes: '', Arquivos: []
      };
    },

    async excluirProjeto(id) {
      if (confirm("Deseja excluir este projeto?")) {
        try {
          await deleteDoc(doc(db, 'projetos', id));
          this.carregarProjetos();
        } catch (err) {
          console.error('Erro ao excluir projeto:', err);
        }
      }
    },

    selecionarProjeto(id) {
      if (id !== this.projetoSelecionado) {
        this.projetoSelecionado = id;
        this.$emit('trocar-projeto', id);
      }
    },

    removerArquivo(index) {
      this.novoProjeto.Arquivos.splice(index, 1);
    },

    formatarData(data) {
      return data ? dayjs(data).format('DD/MM/YYYY') : '—';
    }
  },
mounted() {
  this.carregarEstados();

  // FORÇA CARREGAMENTO DE PROJETOS MESMO QUE WATCH NÃO DISPARAR
  if (this.user?.uid && this.organizacaoId) {
    console.log('⚡️ Executando carregarProjetos() manualmente no mounted()');
    this.carregarProjetos();
  } else {
    console.warn('❌ Não foi possível carregar projetos no mounted():', {
      uid: this.user?.uid,
      organizacaoId: this.organizacaoId
    });
  }
}
};
</script>



=======
<template>
  <div class="projetos-view">
    <h2>Meus Projetos</h2>

    <div class="topo-controles">
      <div style="display: flex; gap: 1rem; align-items: center; width: 100%;">
        <button class="botao-destaque" @click="abrirFormulario = true">➕ Adicionar Projeto</button>
        <input type="text" v-model="filtroBusca" placeholder="Buscar projetos..." class="campo-busca" />
      </div>
    </div>

    <div v-if="abrirFormulario" class="modal-overlay">
      <div class="modal">
        <h3>{{ editandoId ? 'Editar Projeto' : 'Novo Projeto' }}</h3>

        <div class="formulario-projeto" style="gap: 0.5rem; min-width: unset;">
          <div class="form-coluna" v-for="(campo, label) in camposTexto" :key="label" style="flex: 1 1 30%;">
            <label>{{ campo.label }}</label>
            <input v-model="novoProjeto[label]" :placeholder="campo.label" required />
          </div>

          <div class="form-coluna" style="flex: 1 1 30%;">
            <label>Estado</label>
            <select v-model="novoProjeto.Estado" @change="carregarCidades" required>
              <option disabled value="">Selecione o Estado</option>
              <option v-for="estado in estados" :key="estado">{{ estado }}</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 30%;">
            <label>Cidade</label>
            <select v-model="novoProjeto.Cidade" required>
              <option disabled value="">Selecione a Cidade</option>
              <option v-for="cidade in cidades" :key="cidade">{{ cidade }}</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Tipo de Projeto</label>
            <div class="grid-opcoes">
              <button
                v-for="tipo in tiposProjeto"
                :key="tipo"
                :class="{ selecionado: novoProjeto.TipoProjeto === tipo }"
                @click="novoProjeto.TipoProjeto = tipo"
              >
                {{ tipo }}
              </button>
            </div>
          </div>

          <div class="form-coluna" style="flex: 1 1 30%;">
            <label>Data de Início</label>
            <input type="date" v-model="novoProjeto.DataInicioPrevista" required />
          </div>

          <div class="form-coluna" style="flex: 1 1 30%;">
            <label>Data de Fim</label>
            <input type="date" v-model="novoProjeto.DataFimPrevista" required />
          </div>

          <div class="form-coluna" style="flex: 1 1 30%;">
            <label>Status do projeto</label>
            <select v-model="novoProjeto.Status" required>
              <option disabled value="">Selecione o Status</option>
              <option>Pendente</option>
              <option>Em andamento</option>
              <option>Finalizado</option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 48%;">
            <label>Anotações</label>
            <textarea v-model="novoProjeto.Anotacoes" rows="2" placeholder="Anotações"></textarea>
          </div>

          <div class="form-coluna" style="flex: 1 1 48%;">
            <label>Arquivos</label>
            <ul v-if="novoProjeto.Arquivos && novoProjeto.Arquivos.length">
              <li v-for="(url, index) in novoProjeto.Arquivos" :key="index">
                <a :href="url" target="_blank">Arquivo {{ index + 1 }}</a>
                <button @click="removerArquivo(index)" class="botao-excluir">Remover</button>
              </li>
            </ul>
            <input type="file" multiple @change="handleUpload" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="botao-destaque" @click="salvarProjeto">
            {{ editandoId ? 'Atualizar' : 'Adicionar' }} Projeto
          </button>
          <button class="botao" @click="cancelarEdicao">Cancelar</button>
        </div>
      </div>
    </div>

    <div class="tabela-container">
      <div v-if="!projetosFiltrados.length" style="margin: 1rem 0; color: #a00;">
        ⚠️ Nenhum projeto encontrado.
      </div>

      <table v-else class="projetos-tabela">
        <thead>
          <tr>
            <th style="text-align: left;">Ações</th>
            <th>Projeto</th>
            <th>Cliente</th>
            <th>Tipo de Obra</th>
            <th>Status da Obra</th>
            <th>Data Início</th>
            <th>Data Fim</th>
            <th>Estado</th>
            <th>Cidade</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="projeto in projetosFiltrados"
            :key="projeto.id"
            :class="{ selecionado: projetoSelecionado === projeto.id }"
          >
            <td style="text-align: left;">
              <div class="acoes-wrapper">
                <button class="botao-editar" @click="editarProjeto(projeto)">✏️</button>
                <button class="botao-excluir" @click="excluirProjeto(projeto.id)">🗑️</button>
              </div>
            </td>
            <td>{{ projeto.NomeProjeto || '—' }}</td>
            <td>{{ projeto.Cliente || '—' }}</td>
            <td>{{ projeto.TipoProjeto || '—' }}</td>
            <td>{{ projeto.Status || '—' }}</td>
            <td>{{ formatarData(projeto.DataInicioPrevista) || '—' }}</td>
            <td>{{ formatarData(projeto.DataFimPrevista) || '—' }}</td>
            <td>{{ projeto.Estado || '—' }}</td>
            <td>{{ projeto.Cidade || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>






<script>
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import dayjs from 'dayjs';

export default {
  name: 'ProjetosView',
  props: {
    user: Object,
    projetoAtivo: String,
    organizacaoId: String
  },
  data() {
    return {
      projetos: [],
      projetoSelecionado: '',
      editandoId: '',
      abrirFormulario: false,
      filtroBusca: '',
      novoProjeto: {
        NomeProjeto: '',
        Cliente: '',
        Endereco: '',
        TipoProjeto: '',
        DataInicioPrevista: '',
        DataFimPrevista: '',
        Status: '',
        ResponsavelTecnico: '',
        ART: '',
        Alvara: '',
        Estado: '',
        Cidade: '',
        Anotacoes: '',
        Arquivos: []
      },
      tiposProjeto: ['Construção Residencial', 'Reforma', 'Ampliação', 'Industrial', 'Obra Pública'],
      estados: [],
      cidades: [],
      camposTexto: {
        NomeProjeto: { label: 'Nome do Projeto' },
        Cliente: { label: 'Cliente' },
        Endereco: { label: 'Endereço' },
        ResponsavelTecnico: { label: 'Responsável Técnico' },
        ART: { label: 'Nº da ART da Obra' },
        Alvara: { label: 'Nº do Alvará da Obra' }
      }
    };
  },
  computed: {
  projetosFiltrados() {
    const termo = this.filtroBusca?.toLowerCase().trim();
    if (!termo) return this.projetos;

    return this.projetos.filter(p => {
      try {
        return Object.entries(p).some(([k, v]) =>
          typeof v === 'string' && v.toLowerCase().includes(termo)
        );
      } catch (err) {
        console.warn('Erro ao filtrar projeto:', p, err);
        return false;
      }
    });
  }
},
  watch: {
    projetoAtivo(novo) {
      this.projetoSelecionado = novo;
    },
  organizacaoId(nova) {
    console.log('👀 Watch: organizacaoId mudou para:', nova);
    if (nova && this.user?.uid) {
      this.carregarProjetos();
    }
    },
    user: {
      handler(novo) {
        if (novo?.uid && this.organizacaoId) {
          this.carregarProjetos();
        }
      },
      deep: true
    }
  },
  methods: {
    async carregarEstados() {
      try {
        const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        this.estados = (await res.json()).map(e => e.sigla);
      } catch (err) {
        console.error('Erro ao carregar estados:', err);
      }
    },

    async carregarCidades() {
      this.novoProjeto.Cidade = '';
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${this.novoProjeto.Estado}/municipios`);
      this.cidades = (await res.json()).map(c => c.nome);
    },

async carregarProjetos() {
  if (!this.organizacaoId || !this.user?.uid || !this.user?.email) {
    console.warn('🚫 Organização, UID ou e-mail não definidos');
    return;
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'projetos'));
    const todosProjetos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    this.projetos = todosProjetos.filter(p => {
      const pertenceOrganizacao = p.organizacaoId === this.organizacaoId;
      const criadoPorUsuario = p.criadoPor === this.user.uid;
      const compartilhadoComUsuario = Array.isArray(p.allowedUsers) && p.allowedUsers.includes(this.user.email);
      return pertenceOrganizacao && (criadoPorUsuario || compartilhadoComUsuario);
    });

    console.log('✅ Projetos carregados:', this.projetos.length);
  } catch (err) {
    console.error('❌ Erro ao carregar projetos:', err);
  }
},



    async salvarProjeto() {
      const camposObrigatorios = [
        'NomeProjeto', 'Cliente', 'TipoProjeto', 'DataInicioPrevista',
        'DataFimPrevista', 'Status', 'ResponsavelTecnico', 'ART', 'Alvara',
        'Estado', 'Cidade'
      ];

      const faltando = camposObrigatorios.filter(c => !this.novoProjeto[c]?.toString().trim());

      if (faltando.length) {
        alert("Preencha todos os campos obrigatórios antes de continuar.");
        return;
      }

      if (!this.organizacaoId) {
        alert('Você deve selecionar uma organização antes de criar um projeto.');
        return;
      }

      try {
        if (this.editandoId) {
          const projetoRef = doc(db, 'projetos', this.editandoId);
          await updateDoc(projetoRef, this.novoProjeto);
        } else {
          await addDoc(collection(db, 'projetos'), {
            ...this.novoProjeto,
            organizacaoId: this.organizacaoId,
            criadoPor: this.user.uid,
            dataCriacao: new Date()
          });
        }

        this.cancelarEdicao();
        this.carregarProjetos();
      } catch (err) {
        console.error('Erro ao salvar projeto:', err);
      }
    },

    editarProjeto(projeto) {
      this.novoProjeto = { ...projeto };
      this.editandoId = projeto.id;
      this.abrirFormulario = true;
    },

    cancelarEdicao() {
      this.editandoId = '';
      this.abrirFormulario = false;
      this.novoProjeto = {
        NomeProjeto: '', Cliente: '', Endereco: '', TipoProjeto: '', DataInicioPrevista: '',
        DataFimPrevista: '', Status: '', ResponsavelTecnico: '', ART: '', Alvara: '',
        Estado: '', Cidade: '', Anotacoes: '', Arquivos: []
      };
    },

    async excluirProjeto(id) {
      if (confirm("Deseja excluir este projeto?")) {
        try {
          await deleteDoc(doc(db, 'projetos', id));
          this.carregarProjetos();
        } catch (err) {
          console.error('Erro ao excluir projeto:', err);
        }
      }
    },

    selecionarProjeto(id) {
      if (id !== this.projetoSelecionado) {
        this.projetoSelecionado = id;
        this.$emit('trocar-projeto', id);
      }
    },

    removerArquivo(index) {
      this.novoProjeto.Arquivos.splice(index, 1);
    },

    formatarData(data) {
      return data ? dayjs(data).format('DD/MM/YYYY') : '—';
    }
  },
mounted() {
  this.carregarEstados();

  // FORÇA CARREGAMENTO DE PROJETOS MESMO QUE WATCH NÃO DISPARAR
  if (this.user?.uid && this.organizacaoId) {
    console.log('⚡️ Executando carregarProjetos() manualmente no mounted()');
    this.carregarProjetos();
  } else {
    console.warn('❌ Não foi possível carregar projetos no mounted():', {
      uid: this.user?.uid,
      organizacaoId: this.organizacaoId
    });
  }
}
};
</script>



>>>>>>> 9396cd378334692f8c2f504fe0827aa082427823
