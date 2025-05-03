<template>
  <div class="configuracoes-view">
    <h2>Configurações da Organização</h2>

    <!-- Sessão de Organização -->
    <div class="bloco-config">
      <h3>🧩 Organização</h3>
      <div class="formulario-projeto">
        <label>Nome da Organização</label>
        <input v-model="organizacao.Nome" placeholder="Nome da Organização" />

        <label>Descrição</label>
        <textarea v-model="organizacao.Descricao" rows="2" placeholder="Descrição da organização..."></textarea>
      </div>
      <button class="botao-destaque" @click="salvarOrganizacao">💾 Salvar Organização</button>
    </div>

    <!-- Sessão de Usuários -->
    <div class="bloco-config">
      <h3>👥 Usuários da Organização</h3>
      <ul>
        <li v-for="user in organizacao.usuarios" :key="user">{{ user }}</li>
      </ul>
      <div class="formulario-projeto">
        <label>Adicionar Novo Usuário (email)</label>
        <input v-model="novoUsuario" placeholder="email@exemplo.com" />
      </div>
      <button class="botao" @click="adicionarUsuario">➕ Adicionar Usuário</button>
    </div>

    <!-- Sessão Tipos de Etapa -->
    <div class="bloco-config">
      <h3>📌 Tipos de Etapa</h3>
      <div class="formulario-projeto">
        <label>Nova Etapa</label>
        <input v-model="novaEtapa" placeholder="Nome da Etapa" />
      </div>
      <button class="botao" @click="adicionarTipoEtapa">➕ Adicionar Etapa</button>
      <ul>
        <li v-for="etapa in tiposEtapa" :key="etapa">{{ etapa }}</li>
      </ul>
    </div>

    <!-- Sessão Tipos de Item -->
    <div class="bloco-config">
      <h3>🏷️ Tipos de Item</h3>
      <div class="formulario-projeto">
        <label>Novo Tipo de Item</label>
        <input v-model="novoTipoItem" placeholder="Tipo de Item" />
      </div>
      <button class="botao" @click="adicionarTipoItem">➕ Adicionar Tipo</button>
      <ul>
        <li v-for="tipo in tiposItem" :key="tipo">{{ tipo }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export default {
  props: ['user'],
  data() {
    return {
      organizacao: {
        Nome: '',
        Descricao: '',
        usuarios: []
      },
      novoUsuario: '',
      novaEtapa: '',
      novoTipoItem: '',
      tiposEtapa: [],
      tiposItem: []
    };
  },
  methods: {
    async carregarOrganizacao() {
      try {
        const docRef = doc(db, 'organizacoes', this.user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const dados = docSnap.data();
          this.organizacao = {
            Nome: dados.Nome || '',
            Descricao: dados.Descricao || '',
            usuarios: dados.usuarios || []
          };
          this.tiposEtapa = dados.tiposEtapa || [];
          this.tiposItem = dados.tiposItem || [];
        }
      } catch (error) {
        console.error('Erro ao carregar organização:', error);
      }
    },


async salvarOrganizacao() {
  if (!this.organizacao.Nome || !this.organizacao.Descricao) {
    alert("Preencha todos os campos da organização.");
    return;
  }

  try {
    const ref = doc(db, 'organizacoes', this.user.uid);
    await setDoc(ref, {
      Nome: this.organizacao.Nome,
      Descricao: this.organizacao.Descricao,
      usuarios: this.organizacao.usuarios.length
        ? this.organizacao.usuarios
        : [this.user.email],
      tiposEtapa: this.tiposEtapa,
      tiposItem: this.tiposItem
    });

    alert("Organização salva com sucesso.");
  } catch (err) {
    console.error('Erro ao salvar organização:', err);
    alert("Erro ao salvar organização.");
  }
},

    async adicionarUsuario() {
      if (this.novoUsuario && !this.organizacao.usuarios.includes(this.novoUsuario)) {
        this.organizacao.usuarios.push(this.novoUsuario);
        this.novoUsuario = '';
        this.salvarOrganizacao();
      }
    },




    async adicionarTipoEtapa() {
      if (this.novaEtapa && !this.tiposEtapa.includes(this.novaEtapa)) {
        this.tiposEtapa.push(this.novaEtapa);
        this.novaEtapa = '';
        this.salvarOrganizacao();
      }
    },

    async adicionarTipoItem() {
      if (this.novoTipoItem && !this.tiposItem.includes(this.novoTipoItem)) {
        this.tiposItem.push(this.novoTipoItem);
        this.novoTipoItem = '';
        this.salvarOrganizacao();
      }
    }
  },
  mounted() {
    if (this.user?.uid) {
      this.carregarOrganizacao();
    }
  }
};
</script>
