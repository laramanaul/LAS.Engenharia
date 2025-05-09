
<template>
  <div class="diario-view projetos-view">
    <h2>Diário de Obra</h2>

    <!-- Controles superiores -->
    <div class="topo-controles">
      <button class="botao-destaque" @click="abrirFormulario">➕ Novo Diário</button>
      <input type="text" v-model="filtro" placeholder="Buscar por data, texto ou etapa..." class="campo-busca" />
    </div>

    <!-- Modal de formulário -->
    <div v-if="formularioAberto" class="modal-overlay">
      <div class="modal">
        <h3>{{ diarioAtual.id ? 'Editar Diário' : 'Novo Diário' }}</h3>

        <div class="formulario-projeto">
          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Data do Diário</label>
            <input type="date" v-model="diarioAtual.DataEntrada" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Etapa</label>
            <select v-model="diarioAtual.EtapaID">
              <option disabled value="">Selecione a Etapa</option>
              <option v-for="etapa in etapas" :key="etapa.id" :value="etapa.id">
                {{ etapa.NomeEtapa }}
              </option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Anotações do Dia</label>
            <textarea v-model="diarioAtual.Texto" rows="5" placeholder="Digite as anotações do dia..."></textarea>
          </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Fotos</label>
            <input type="file" multiple @change="selecionarFotos" />
            <div v-if="diarioAtual.FotosRef.length" class="fotos-miniaturas">
              <img
                v-for="(foto, index) in diarioAtual.FotosRef"
                :key="index"
                :src="foto"
                @click="abrirVisualizador(diarioAtual.FotosRef, index)"
              />
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="botao-destaque" @click="salvarDiario">
            {{ diarioAtual.id ? 'Atualizar' : 'Salvar' }}
          </button>
          <button class="botao" @click="fecharFormulario">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal de Visualização de Fotos -->
    <div v-if="visualizadorAberto" class="modal-visualizador">
      <div class="visualizador-conteudo">
        <img :src="fotosParaVisualizar[fotoAtualIndex]" class="foto-grande" />
        <div class="controle-visualizacao">
          <button @click="anteriorFoto" :disabled="fotoAtualIndex === 0">←</button>
          <button @click="proximaFoto" :disabled="fotoAtualIndex === fotosParaVisualizar.length - 1">→</button>
          <button @click="fecharVisualizador">✖ Fechar</button>
        </div>
      </div>
    </div>

    <!-- Tabela de diários -->
    <div class="tabela-container">
      <table class="projetos-tabela">
        <thead>
          <tr>
            <th>Ações</th>
            <th>Data</th>
            <th>Etapa</th>
            <th>Anotações</th>
            <th>Fotos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="diario in diariosFiltrados" :key="diario.id">
            <td>
              <div class="acoes-wrapper">
                <button class="botao-editar" @click="editarDiario(diario)">✏️</button>
                <button class="botao-excluir" @click="excluirDiario(diario.id)">🗑️</button>
              </div>
            </td>
            <td>{{ formatarData(diario.DataEntrada) }}</td>
            <td>{{ nomeEtapa(diario.EtapaID) }}</td>
            <td>{{ resumoTexto(diario.Texto) }}</td>
            <td>
              <div class="fotos-miniaturas">
                <img
                  v-for="(foto, index) in diario.FotosRef"
                  :key="index"
                  :src="foto"
                  @click="abrirVisualizador(diario.FotosRef, index)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { db, storage } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export default {
  props: ['projetoAtivo', 'user', 'organizacaoId'],
  data() {
    return {
      diarios: [],
      etapas: [],
      filtro: '',
      formularioAberto: false,
      diarioAtual: {
        id: '',
        DataEntrada: '',
        Texto: '',
        FotosRef: [],
        ProjetoID: '',
        EtapaID: '',
        UsuarioID: '',
        TimestampCadastro: ''
      },
      novasFotos: [],
      visualizadorAberto: false,
      fotosParaVisualizar: [],
      fotoAtualIndex: 0
    };
  },
  computed: {
    diariosFiltrados() {
      const texto = this.filtro.toLowerCase();
      return this.diarios.filter(d =>
        (d.Texto || '').toLowerCase().includes(texto) ||
        (this.nomeEtapa(d.EtapaID) || '').toLowerCase().includes(texto) ||
        this.formatarData(d.DataEntrada).includes(texto)
      );
    }
  },
  methods: {
    async carregarDiarios() {
      if (!this.projetoAtivo) return;
      const querySnapshot = await getDocs(collection(db, 'diarios'));
      this.diarios = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(d => d.ProjetoID === this.projetoAtivo);
    },
    async carregarEtapas() {
      if (!this.projetoAtivo) return;
      const querySnapshot = await getDocs(collection(db, 'etapas'));
      this.etapas = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(e => e.ProjetosVinculados?.includes(this.projetoAtivo));
    },
    nomeEtapa(etapaId) {
      const etapa = this.etapas.find(e => e.id === etapaId);
      return etapa ? etapa.NomeEtapa : '---';
    },
    formatarData(timestamp) {
      if (!timestamp) return '';
      const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return data.toLocaleDateString();
    },
    resumoTexto(texto) {
      return texto?.length > 50 ? texto.substring(0, 50) + '...' : texto;
    },
    abrirFormulario() {
      this.formularioAberto = true;
      const hoje = new Date().toISOString().split('T')[0];
      this.diarioAtual = {
        id: '',
        DataEntrada: hoje,
        Texto: '',
        FotosRef: [],
        ProjetoID: this.projetoAtivo,
        EtapaID: '',
        UsuarioID: this.user?.uid || '',
        TimestampCadastro: Timestamp.now()
      };
      this.novasFotos = [];
    },
    fecharFormulario() {
      this.formularioAberto = false;
    },
    selecionarFotos(event) {
      this.novasFotos = Array.from(event.target.files);
    },
    async uploadFotos() {
      const urls = [];
      for (const foto of this.novasFotos) {
        const refPath = `diarios/${Date.now()}_${foto.name}`;
        const fotoRef = storageRef(storage, refPath);
        const snapshot = await uploadBytes(fotoRef, foto);
        const url = await getDownloadURL(snapshot.ref);
        urls.push(url);
      }
      return urls;
    },
    async salvarDiario() {
      if (!this.projetoAtivo || !this.user?.uid) {
        alert('Projeto ou usuário não definido.');
        return;
      }

      const fotosUpload = await this.uploadFotos();

      const diarioParaSalvar = {
        DataEntrada: Timestamp.fromDate(new Date(this.diarioAtual.DataEntrada)),
        Texto: this.diarioAtual.Texto,
        FotosRef: [...this.diarioAtual.FotosRef, ...fotosUpload],
        ProjetoID: this.projetoAtivo,
        EtapaID: this.diarioAtual.EtapaID,
        UsuarioID: this.user.uid,
        TimestampCadastro: Timestamp.now(),
        organizacaoId: this.organizacaoId
      };

      try {
        if (this.diarioAtual.id) {
          await updateDoc(doc(db, 'diarios', this.diarioAtual.id), diarioParaSalvar);
        } else {
          await addDoc(collection(db, 'diarios'), diarioParaSalvar);
        }
        this.fecharFormulario();
        this.carregarDiarios();
      } catch (err) {
        console.error('Erro ao salvar diário:', err);
        alert('Erro ao salvar diário.');
      }
    },
    editarDiario(diario) {
      this.diarioAtual = {
        id: diario.id,
        DataEntrada: diario.DataEntrada?.toDate().toISOString().split('T')[0] || '',
        Texto: diario.Texto || '',
        FotosRef: diario.FotosRef || [],
        ProjetoID: diario.ProjetoID,
        EtapaID: diario.EtapaID || '',
        UsuarioID: diario.UsuarioID || '',
        TimestampCadastro: diario.TimestampCadastro
      };
      this.formularioAberto = true;
      this.novasFotos = [];
    },
    async excluirDiario(id) {
      try {
        await deleteDoc(doc(db, 'diarios', id));
        this.carregarDiarios();
      } catch (err) {
        console.error('Erro ao excluir diário:', err);
      }
    },
    abrirVisualizador(fotos, index) {
      this.fotosParaVisualizar = fotos;
      this.fotoAtualIndex = index;
      this.visualizadorAberto = true;
    },
    fecharVisualizador() {
      this.visualizadorAberto = false;
      this.fotosParaVisualizar = [];
      this.fotoAtualIndex = 0;
    },
    anteriorFoto() {
      if (this.fotoAtualIndex > 0) {
        this.fotoAtualIndex--;
      }
    },
    proximaFoto() {
      if (this.fotoAtualIndex < this.fotosParaVisualizar.length - 1) {
        this.fotoAtualIndex++;
      }
    }
  },
  watch: {
    projetoAtivo() {
      this.carregarDiarios();
      this.carregarEtapas();
    }
  },
  mounted() {
    this.carregarDiarios();
    this.carregarEtapas();
  }
};
</script>
=======
<template>
  <div class="diario-view projetos-view">
    <h2>Diário de Obra</h2>

    <!-- Controles superiores -->
    <div class="topo-controles">
      <button class="botao-destaque" @click="abrirFormulario">➕ Novo Diário</button>
      <input type="text" v-model="filtro" placeholder="Buscar por data, texto ou etapa..." class="campo-busca" />
    </div>

    <!-- Modal de formulário -->
    <div v-if="formularioAberto" class="modal-overlay">
      <div class="modal">
        <h3>{{ diarioAtual.id ? 'Editar Diário' : 'Novo Diário' }}</h3>

        <div class="formulario-projeto">
          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Data do Diário</label>
            <input type="date" v-model="diarioAtual.DataEntrada" />
          </div>

          <div class="form-coluna" style="flex: 1 1 45%;">
            <label>Etapa</label>
            <select v-model="diarioAtual.EtapaID">
              <option disabled value="">Selecione a Etapa</option>
              <option v-for="etapa in etapas" :key="etapa.id" :value="etapa.id">
                {{ etapa.NomeEtapa }}
              </option>
            </select>
          </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Anotações do Dia</label>
            <textarea v-model="diarioAtual.Texto" rows="5" placeholder="Digite as anotações do dia..."></textarea>
          </div>

          <div class="form-coluna" style="flex: 1 1 100%;">
            <label>Fotos</label>
            <input type="file" multiple @change="selecionarFotos" />
            <div v-if="diarioAtual.FotosRef.length" class="fotos-miniaturas">
              <img
                v-for="(foto, index) in diarioAtual.FotosRef"
                :key="index"
                :src="foto"
                @click="abrirVisualizador(diarioAtual.FotosRef, index)"
              />
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="botao-destaque" @click="salvarDiario">
            {{ diarioAtual.id ? 'Atualizar' : 'Salvar' }}
          </button>
          <button class="botao" @click="fecharFormulario">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal de Visualização de Fotos -->
    <div v-if="visualizadorAberto" class="modal-visualizador">
      <div class="visualizador-conteudo">
        <img :src="fotosParaVisualizar[fotoAtualIndex]" class="foto-grande" />
        <div class="controle-visualizacao">
          <button @click="anteriorFoto" :disabled="fotoAtualIndex === 0">←</button>
          <button @click="proximaFoto" :disabled="fotoAtualIndex === fotosParaVisualizar.length - 1">→</button>
          <button @click="fecharVisualizador">✖ Fechar</button>
        </div>
      </div>
    </div>

    <!-- Tabela de diários -->
    <div class="tabela-container">
      <table class="projetos-tabela">
        <thead>
          <tr>
            <th>Ações</th>
            <th>Data</th>
            <th>Etapa</th>
            <th>Anotações</th>
            <th>Fotos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="diario in diariosFiltrados" :key="diario.id">
            <td>
              <div class="acoes-wrapper">
                <button class="botao-editar" @click="editarDiario(diario)">✏️</button>
                <button class="botao-excluir" @click="excluirDiario(diario.id)">🗑️</button>
              </div>
            </td>
            <td>{{ formatarData(diario.DataEntrada) }}</td>
            <td>{{ nomeEtapa(diario.EtapaID) }}</td>
            <td>{{ resumoTexto(diario.Texto) }}</td>
            <td>
              <div class="fotos-miniaturas">
                <img
                  v-for="(foto, index) in diario.FotosRef"
                  :key="index"
                  :src="foto"
                  @click="abrirVisualizador(diario.FotosRef, index)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { db, storage } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export default {
  props: ['projetoAtivo', 'user', 'organizacaoId'],
  data() {
    return {
      diarios: [],
      etapas: [],
      filtro: '',
      formularioAberto: false,
      diarioAtual: {
        id: '',
        DataEntrada: '',
        Texto: '',
        FotosRef: [],
        ProjetoID: '',
        EtapaID: '',
        UsuarioID: '',
        TimestampCadastro: ''
      },
      novasFotos: [],
      visualizadorAberto: false,
      fotosParaVisualizar: [],
      fotoAtualIndex: 0
    };
  },
  computed: {
    diariosFiltrados() {
      const texto = this.filtro.toLowerCase();
      return this.diarios.filter(d =>
        (d.Texto || '').toLowerCase().includes(texto) ||
        (this.nomeEtapa(d.EtapaID) || '').toLowerCase().includes(texto) ||
        this.formatarData(d.DataEntrada).includes(texto)
      );
    }
  },
  methods: {
    async carregarDiarios() {
      if (!this.projetoAtivo) return;
      const querySnapshot = await getDocs(collection(db, 'diarios'));
      this.diarios = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(d => d.ProjetoID === this.projetoAtivo);
    },
    async carregarEtapas() {
      if (!this.projetoAtivo) return;
      const querySnapshot = await getDocs(collection(db, 'etapas'));
      this.etapas = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(e => e.ProjetosVinculados?.includes(this.projetoAtivo));
    },
    nomeEtapa(etapaId) {
      const etapa = this.etapas.find(e => e.id === etapaId);
      return etapa ? etapa.NomeEtapa : '---';
    },
    formatarData(timestamp) {
      if (!timestamp) return '';
      const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return data.toLocaleDateString();
    },
    resumoTexto(texto) {
      return texto?.length > 50 ? texto.substring(0, 50) + '...' : texto;
    },
    abrirFormulario() {
      this.formularioAberto = true;
      const hoje = new Date().toISOString().split('T')[0];
      this.diarioAtual = {
        id: '',
        DataEntrada: hoje,
        Texto: '',
        FotosRef: [],
        ProjetoID: this.projetoAtivo,
        EtapaID: '',
        UsuarioID: this.user?.uid || '',
        TimestampCadastro: Timestamp.now()
      };
      this.novasFotos = [];
    },
    fecharFormulario() {
      this.formularioAberto = false;
    },
    selecionarFotos(event) {
      this.novasFotos = Array.from(event.target.files);
    },
    async uploadFotos() {
      const urls = [];
      for (const foto of this.novasFotos) {
        const refPath = `diarios/${Date.now()}_${foto.name}`;
        const fotoRef = storageRef(storage, refPath);
        const snapshot = await uploadBytes(fotoRef, foto);
        const url = await getDownloadURL(snapshot.ref);
        urls.push(url);
      }
      return urls;
    },
    async salvarDiario() {
      if (!this.projetoAtivo || !this.user?.uid) {
        alert('Projeto ou usuário não definido.');
        return;
      }

      const fotosUpload = await this.uploadFotos();

      const diarioParaSalvar = {
        DataEntrada: Timestamp.fromDate(new Date(this.diarioAtual.DataEntrada)),
        Texto: this.diarioAtual.Texto,
        FotosRef: [...this.diarioAtual.FotosRef, ...fotosUpload],
        ProjetoID: this.projetoAtivo,
        EtapaID: this.diarioAtual.EtapaID,
        UsuarioID: this.user.uid,
        TimestampCadastro: Timestamp.now(),
        organizacaoId: this.organizacaoId
      };

      try {
        if (this.diarioAtual.id) {
          await updateDoc(doc(db, 'diarios', this.diarioAtual.id), diarioParaSalvar);
        } else {
          await addDoc(collection(db, 'diarios'), diarioParaSalvar);
        }
        this.fecharFormulario();
        this.carregarDiarios();
      } catch (err) {
        console.error('Erro ao salvar diário:', err);
        alert('Erro ao salvar diário.');
      }
    },
    editarDiario(diario) {
      this.diarioAtual = {
        id: diario.id,
        DataEntrada: diario.DataEntrada?.toDate().toISOString().split('T')[0] || '',
        Texto: diario.Texto || '',
        FotosRef: diario.FotosRef || [],
        ProjetoID: diario.ProjetoID,
        EtapaID: diario.EtapaID || '',
        UsuarioID: diario.UsuarioID || '',
        TimestampCadastro: diario.TimestampCadastro
      };
      this.formularioAberto = true;
      this.novasFotos = [];
    },
    async excluirDiario(id) {
      try {
        await deleteDoc(doc(db, 'diarios', id));
        this.carregarDiarios();
      } catch (err) {
        console.error('Erro ao excluir diário:', err);
      }
    },
    abrirVisualizador(fotos, index) {
      this.fotosParaVisualizar = fotos;
      this.fotoAtualIndex = index;
      this.visualizadorAberto = true;
    },
    fecharVisualizador() {
      this.visualizadorAberto = false;
      this.fotosParaVisualizar = [];
      this.fotoAtualIndex = 0;
    },
    anteriorFoto() {
      if (this.fotoAtualIndex > 0) {
        this.fotoAtualIndex--;
      }
    },
    proximaFoto() {
      if (this.fotoAtualIndex < this.fotosParaVisualizar.length - 1) {
        this.fotoAtualIndex++;
      }
    }
  },
  watch: {
    projetoAtivo() {
      this.carregarDiarios();
      this.carregarEtapas();
    }
  },
  mounted() {
    this.carregarDiarios();
    this.carregarEtapas();
  }
};
</script>
>>>>>>> 9396cd378334692f8c2f504fe0827aa082427823
