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
      
<div class="formulario-projeto">

  <div class="form-coluna">
    <label>Nome do Projeto</label>
    <input v-model="novoProjeto.NomeProjeto" placeholder="Nome do Projeto" />
  </div>

  <div class="form-coluna">
    <label>Cliente</label>
    <input v-model="novoProjeto.Cliente" placeholder="Cliente" />
  </div>

  <div class="form-coluna">
    <label>Endereço</label>
    <input v-model="novoProjeto.Endereco" placeholder="Endereço" />
  </div>

<div class="form-coluna">
    <label>Estado</label>
    <select v-model="novoProjeto.Estado" @change="carregarCidades">
      <option disabled value="">Selecione o Estado</option>
      <option v-for="estado in estados" :key="estado">{{ estado }}</option>
    </select>
  </div>

  <div class="form-coluna">
    <label>Cidade</label>
    <select v-model="novoProjeto.Cidade">
      <option disabled value="">Selecione a Cidade</option>
      <option v-for="cidade in cidades" :key="cidade">{{ cidade }}</option>
    </select>
  </div>
 

  <div class="form-coluna">
    <label>Status</label>
    <select v-model="novoProjeto.Status">
      <option disabled value="">Selecione o Status</option>
      <option>Pendente</option>
      <option>Em andamento</option>
      <option>Finalizado</option>
    </select>
  </div>

  <div class="form-coluna">
    <label>Responsável Técnico</label>
    <input v-model="novoProjeto.ResponsavelTecnico" placeholder="Responsável Técnico" />
  </div>

  <div class="form-coluna">
    <label>Nº da ART da Obra</label>
    <input v-model="novoProjeto.ART" placeholder="Nº da ART da Obra" />
  </div>

  <div class="form-coluna">
    <label>Nº do Alvará da Obra</label>
    <input v-model="novoProjeto.Alvara" placeholder="Nº do Alvará da Obra" />
  </div>

  <!-- Grid de seleção do tipo de projeto -->
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

 <div class="form-coluna">
    <label>Data de Início</label>
    <input type="date" v-model="novoProjeto.DataInicioPrevista" />
  </div>

  <div class="form-coluna">
    <label>Data de Fim</label>
    <input type="date" v-model="novoProjeto.DataFimPrevista" />
  </div>

  

  <div class="form-coluna" style="flex: 1 1 100%;">
    <label>Anotações</label>
    <textarea v-model="novoProjeto.Anotacoes" rows="2" placeholder="Anotações"></textarea>
  </div>

  <div class="form-coluna" style="flex: 1 1 100%;">
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
      <table class="projetos-tabela">
        <thead>
          <tr>
            <th style="text-align: left;">Ações</th>
            <th>Nome</th>
            <th>Cliente</th>
            <th>Endereço</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Responsável</th>
            <th>Estado</th>
            <th>Cidade</th>
            <th>Arquivos</th>
            </tr>
        </thead>
        <tbody>
          

<tr v-for="projeto in projetosFiltrados" :key="projeto.id" :class="{ selecionado: projetoSelecionado === projeto.id }">
  <td style="text-align: left;">
    <div class="acoes-wrapper">
      <button class="botao-selecionar" @click="selecionarProjeto(projeto.id)" :disabled="projetoSelecionado === projeto.id">
        {{ projetoSelecionado === projeto.id ? '✔' : 'Selecionar' }}
      </button>
      <button class="botao-editar" @click="editarProjeto(projeto)">✏️</button>
      <button class="botao-excluir" @click="excluirProjeto(projeto.id)">🗑️</button>
    </div>
  </td>
  <td>{{ projeto.NomeProjeto }}</td>
  <td>{{ projeto.Cliente }}</td>
  <td>{{ projeto.Endereco }}</td>
  <td>{{ projeto.TipoProjeto }}</td>
  <td>{{ projeto.Status }}</td>
  <td>{{ projeto.DataInicioPrevista }}</td>
  <td>{{ projeto.DataFimPrevista }}</td>
  <td>{{ projeto.ResponsavelTecnico }}</td>
  <td>{{ projeto.Estado }}</td>
  <td>{{ projeto.Cidade }}</td>
  <td>
    <ul v-if="projeto.Arquivos && projeto.Arquivos.length">
      <li v-for="(url, index) in projeto.Arquivos" :key="index">
        <a :href="url" target="_blank">Arquivo {{ index + 1 }}</a>
      </li>
    </ul>
    <span v-else>Nenhum</span>
  </td>
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
  name: 'ProjetosView',
  props: {
    user: Object,
    projetoAtivo: String
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
tiposProjeto: ['Residencial - Construção nova', 'Residencial - Reforma', 'Comercial', 'Industrial', 'Obra Pública'],
estados: [],
cidades: [],
    };
  },
  computed: {
    projetosFiltrados() {
      if (!this.filtroBusca) return this.projetos;
      const termo = this.filtroBusca.toLowerCase();
      return this.projetos.filter(p =>
        Object.values(p).some(v =>
          typeof v === 'string' && v.toLowerCase().includes(termo)
        )
      );
    }
  },
  watch: {
    projetoAtivo: {
      immediate: true,
      handler(novoId) {
        if (novoId) {
          this.projetoSelecionado = novoId;
        }
      }
    }
  },
methods: {
  async carregarCidades() {
    this.novoProjeto.Cidade = '';
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${this.novoProjeto.Estado}/municipios`);
    this.cidades = (await res.json()).map(c => c.nome);
  },
  async carregarProjetos() {
    try {
      const querySnapshot = await getDocs(collection(db, 'projetos'));
      this.projetos = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => p.criadoPor === this.user.uid || (p.allowedUsers || []).includes(this.user.uid));
    } catch (err) {
      console.error('Erro ao carregar projetos:', err);
    }
  },
  async salvarProjeto() {
    const { NomeProjeto, Cliente, Endereco } = this.novoProjeto;
    if (!NomeProjeto || !Cliente || !Endereco) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    try {
      if (this.editandoId) {
        const projetoRef = doc(db, 'projetos', this.editandoId);
        await updateDoc(projetoRef, this.novoProjeto);
      } else {
        await addDoc(collection(db, 'projetos'), {
          ...this.novoProjeto,
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
  }
},

// ✅ Agora fora dos methods:
async mounted() {
  if (this.user?.uid) {
    const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
    this.estados = (await res.json()).map(e => e.sigla);
    this.carregarProjetos();
  }
}
};

</script>

