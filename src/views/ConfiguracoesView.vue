<template>
  <div class="configuracoes-view">
    <h2>⚙️ Configurações</h2>

    <!-- Abas -->
    <div class="abas-config">
      <button :class="{ ativo: abaAtiva === 'organizacao' }" @click="abaAtiva = 'organizacao'">🧹 Organização</button>
      <button :class="{ ativo: abaAtiva === 'usuarios' }" @click="abaAtiva = 'usuarios'">👥 Usuários</button>
      <button :class="{ ativo: abaAtiva === 'projetos' }" @click="abaAtiva = 'projetos'">🏗️ Permissões por Projeto</button>
      <button :class="{ ativo: abaAtiva === 'compartilhados' }" @click="abaAtiva = 'compartilhados'">📥 Compartilhados Comigo</button>
    </div>

    <!-- Organização -->
    <div v-if="abaAtiva === 'organizacao'" class="card-config">
      <h3>🧹 Organização</h3>
      <div class="formulario-projeto">
        <label>Nome</label>
        <input v-model="organizacao.Nome" placeholder="Nome da Organização" />
        <label>Descrição</label>
        <textarea v-model="organizacao.Descricao" rows="2" />
      </div>
      <div class="grupo-botoes">
        <button class="botao-destaque" @click="salvarOrganizacao">📎 Salvar Alterações</button>
        <button class="botao-perigo" @click="excluirOrganizacao">🗑️ Excluir Organização</button>
      </div>
    </div>

    <!-- Usuários da Organização -->
    <div v-if="abaAtiva === 'usuarios'" class="card-config">
      <h3>👥 Usuários da Organização</h3>
      <div class="formulario-projeto">
        <label>Email para Adicionar</label>
        <input v-model="novoUsuario" placeholder="email@exemplo.com" />
        <button class="botao" @click="adicionarUsuario">➕ Adicionar Usuário</button>
      </div>

      <ul class="lista-usuarios">
        <li v-for="(user, index) in organizacao.usuarios" :key="user">
          <span>{{ user }}</span>
          <div class="acoes-email">
            <button @click="editarUsuario(index)">✏️</button>
            <button @click="removerUsuario(index)">🔚</button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Permissões por Projeto -->
    <div v-if="abaAtiva === 'projetos'" class="card-config">
      <h3>🏗️ Permissões por Projeto</h3>
      <select v-model="projetoSelecionado" class="select-projeto">
        <option disabled value="">Selecione um projeto</option>
        <option v-for="p in projetosDisponiveis" :key="p.id" :value="p.id">{{ p.NomeProjeto }}</option>
      </select>

      <div class="formulario-projeto">
        <label>Email do Usuário</label>
        <input v-model="novoUsuarioProjeto" placeholder="email@exemplo.com" />
        <button class="botao" @click="adicionarUsuarioProjeto">➕ Adicionar ao Projeto</button>
      </div>

      <div v-if="usuariosProjeto.length" class="bloco-projeto">
        <h4>Usuários do Projeto Selecionado</h4>
        <ul class="lista-usuarios">
          <li v-for="(email, idx) in usuariosProjeto" :key="idx">
            <span>{{ email }}</span>
            <div class="acoes-email">
              <button @click="removerUsuarioProjeto(email)">🔚</button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Compartilhados comigo -->
    <div v-if="abaAtiva === 'compartilhados'" class="card-config">
      <h3>📥 Projetos Compartilhados Comigo</h3>
      <ul class="lista-projetos">
        <li v-for="projeto in projetosCompartilhados" :key="projeto.id">
          <div class="info-projeto">
            <strong>{{ projeto.NomeProjeto }}</strong>
            <small>Organização: {{ projeto.organizacaoId }}</small>
          </div>
          <button class="botao-perigo" @click="sairDoProjeto(projeto.id)">🚪 Sair do Projeto</button>
        </li>
      </ul>
      <div v-if="projetosCompartilhados.length === 0">
        <p>Nenhum projeto compartilhado com você ainda.</p>
      </div>
    </div>

    <!-- Alerta -->
    <div v-if="mensagem" :class="mensagemErro ? 'alerta-erro' : 'alerta-sucesso'">
      {{ mensagem }}
    </div>
  </div>
</template>


<script>
import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  updateDoc,
  collection
} from 'firebase/firestore';

export default {
  props: ['user'],
  data() {
    return {
      abaAtiva: 'organizacao',

      organizacao: { id: '', Nome: '', Descricao: '', usuarios: [] },
      novoUsuario: '',
      novoUsuarioProjeto: '',
      projetoSelecionado: '',

      projetosDisponiveis: [],
      usuariosProjeto: [],
      projetosCompartilhados: [],

      mensagem: '',
      mensagemErro: false
    };
  },
  methods: {
    async carregarOrganizacao() {
      const ref = doc(db, 'organizacoes', this.user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        this.organizacao = { id: ref.id, ...snap.data() };
      }
    },

    async salvarOrganizacao() {
      if (!this.organizacao.Nome || !this.organizacao.Descricao) {
        this.exibirMensagem('Preencha todos os campos.', true);
        return;
      }
      try {
        const ref = doc(db, 'organizacoes', this.user.uid);
        await setDoc(ref, {
          Nome: this.organizacao.Nome,
          Descricao: this.organizacao.Descricao,
          usuarios: this.organizacao.usuarios
        });
        this.exibirMensagem('Organização salva com sucesso.');
      } catch (e) {
        this.exibirMensagem('Erro ao salvar organização.', true);
      }
    },

    async excluirOrganizacao() {
      if (confirm('Deseja excluir esta organização?')) {
        const ref = doc(db, 'organizacoes', this.user.uid);
        await setDoc(ref, {});
        this.organizacao = { id: '', Nome: '', Descricao: '', usuarios: [] };
        this.exibirMensagem('Organização excluída.');
      }
    },

    adicionarUsuario() {
      if (this.novoUsuario && !this.organizacao.usuarios.includes(this.novoUsuario)) {
        this.organizacao.usuarios.push(this.novoUsuario);
        this.novoUsuario = '';
        this.salvarOrganizacao();
        this.exibirMensagem('Usuário adicionado à organização.');
      }
    },

    editarUsuario(index) {
      const novoEmail = prompt('Editar e-mail:', this.organizacao.usuarios[index]);
      if (novoEmail && novoEmail.includes('@')) {
        this.organizacao.usuarios[index] = novoEmail;
        this.salvarOrganizacao();
        this.exibirMensagem('E-mail atualizado.');
      }
    },

    removerUsuario(index) {
      if (confirm('Remover este usuário?')) {
        this.organizacao.usuarios.splice(index, 1);
        this.salvarOrganizacao();
        this.exibirMensagem('Usuário removido da organização.');
      }
    },

    async carregarProjetos() {
      const snap = await getDocs(collection(db, 'projetos'));
      const todosProjetos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Projetos da organização que o usuário criou ou foi adicionado
      this.projetosDisponiveis = todosProjetos.filter(p =>
        p.organizacaoId === this.organizacao.id &&
        (p.UsuarioID === this.user.uid || (p.allowedUsers || []).includes(this.user.email))
      );

      // Projetos compartilhados com este usuário (não necessariamente da org dele)
      this.projetosCompartilhados = todosProjetos.filter(p =>
        (p.allowedUsers || []).includes(this.user.email)
      );
    },

    async carregarUsuariosProjeto() {
      if (!this.projetoSelecionado) return;
      const ref = doc(db, 'projetos', this.projetoSelecionado);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const dados = snap.data();
        this.usuariosProjeto = dados.allowedUsers || [];
      }
    },

    async adicionarUsuarioProjeto() {
      if (!this.novoUsuarioProjeto || !this.projetoSelecionado) return;
      const ref = doc(db, 'projetos', this.projetoSelecionado);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const dados = snap.data();
        const lista = dados.allowedUsers || [];
        if (!lista.includes(this.novoUsuarioProjeto)) {
          lista.push(this.novoUsuarioProjeto);
          await updateDoc(ref, { allowedUsers: lista });
          this.novoUsuarioProjeto = '';
          this.carregarUsuariosProjeto();
          this.exibirMensagem('Usuário adicionado ao projeto.');
        }
      }
    },

    async removerUsuarioProjeto(email) {
      const ref = doc(db, 'projetos', this.projetoSelecionado);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        let lista = snap.data().allowedUsers || [];
        lista = lista.filter(u => u !== email);
        await updateDoc(ref, { allowedUsers: lista });
        this.carregarUsuariosProjeto();
        this.exibirMensagem('Usuário removido do projeto.');
      }
    },

    async sairDoProjeto(projetoId) {
      if (!confirm('Tem certeza que deseja sair deste projeto?')) return;

      const ref = doc(db, 'projetos', projetoId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        let lista = snap.data().allowedUsers || [];
        lista = lista.filter(u => u !== this.user.email);
        await updateDoc(ref, { allowedUsers: lista });
        this.carregarProjetos();
        this.exibirMensagem('Você saiu do projeto.');
      }
    },

    exibirMensagem(msg, erro = false) {
      this.mensagem = msg;
      this.mensagemErro = erro;
      setTimeout(() => (this.mensagem = ''), 4000);
    }
  },
  watch: {
    projetoSelecionado(novo) {
      if (novo) this.carregarUsuariosProjeto();
    }
  },
  mounted() {
    if (this.user?.uid) {
      this.carregarOrganizacao().then(() => this.carregarProjetos());
    }
  }
};
</script>
