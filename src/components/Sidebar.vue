<template>
  <div class="sidebar enhanced">
    <!-- Menu do Usuário -->
    <div class="sidebar-user" @click="toggleDropdown">
      <div class="usuario-menu">
        ⚙️ <span>{{ primeiroNome }}</span>
      </div>
      <div v-if="dropdownAberto" class="user-dropdown">
        <ul>
          <li @click="abrirUsuario">👤 Perfil</li>
          <li @click="abrirConfiguracoes">⚙️ Configurações</li>
          <li @click="abrirDuvidas">❓ Dúvidas</li>
          <li @click="$emit('reset-password', user.email)">🔑 Recuperar Senha</li>
          <li @click="$emit('logout')">🚪 Sair</li>
        </ul>
      </div>
    </div>

    <!-- Seleção de Organização -->
    <div class="sidebar-projeto">
      <label style="color: #bbb; font-size: 0.75rem;">Organização</label>
      <select v-model="organizacaoSelecionada" @change="emitirOrganizacao">
        <option disabled value="">Selecione a Organização</option>
        <option v-for="org in organizacoes" :key="org.id" :value="org.id">
          {{ org.Nome }}
        </option>
      </select>
    </div>

    <!-- Seleção de Projeto -->
    <div class="sidebar-projeto">
      <label style="color: #bbb; font-size: 0.75rem;">Projeto</label>
      <select v-model="projetoSelecionado" @change="onTrocarProjeto">
        <option disabled value="">Selecione o Projeto</option>
        <option v-for="projeto in projetos" :key="projeto.id" :value="projeto.id">
          {{ projeto.NomeProjeto }}
        </option>
      </select>
    </div>

    <!-- Menu Principal -->
    <ul class="menu-list">
      <li class="menu-separador">Dashboard</li>
      <li :class="{ active: $route.path === '/dashboard' }">
        <router-link to="/dashboard">
          <button><span class="emoji">📊</span> Dashboard</button>
        </router-link>
      </li>

      <li class="menu-separador">Cadastros</li>
      <li v-for="item in menuCadastros" :key="item.route" :class="{ active: $route.path === item.route }">
        <router-link :to="item.route">
          <button><span class="emoji">{{ item.icon }}</span> {{ item.name }}</button>
        </router-link>
      </li>

      <li class="menu-separador">Lançamentos</li>
      <li v-for="item in menuLancamentos" :key="item.route" :class="{ active: $route.path === item.route }">
        <router-link :to="item.route">
          <button><span class="emoji">{{ item.icon }}</span> {{ item.name }}</button>
        </router-link>
      </li>

      <li class="menu-separador">Relatórios</li>
      <li v-for="item in menuRelatorios" :key="item.route" :class="{ active: $route.path === item.route }">
        <router-link :to="item.route">
          <button><span class="emoji">{{ item.icon }}</span> {{ item.name }}</button>
        </router-link>
      </li>
    </ul>

    <div class="sidebar-footer">
      Desenvolvido por <strong>luamso@gmail.com</strong>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default {
  emits: ['trocar-organizacao', 'trocar-projeto', 'logout', 'reset-password'],
  props: ['user', 'projetoAtivo', 'organizacaoId'],
  data() {
    return {
      menuCadastros: [
        { name: 'Projetos', route: '/projetos', icon: '📁' },
        { name: 'Itens', route: '/itens', icon: '📦' },
        { name: 'Fornecedores', route: '/fornecedores', icon: '🏷️' },
        { name: 'Funcionários', route: '/funcionarios', icon: '👷' },

      ],
      menuLancamentos: [
        { name: 'Etapas', route: '/etapas', icon: '📝' },
      { name: 'Execução', route: '/execucao', icon: '🔧' },
        { name: 'Tarefas', route: '/tarefas', icon: '📝' },
          { name: 'Diário de Obra', route: '/diario-obra', icon: '📖' }


      ],
      menuRelatorios: [
          
{ name: 'Relatórios', route: '/relatorios', icon: '📈' }
      ],
      organizacoes: [],
      projetos: [],
      organizacaoSelecionada: '',
      projetoSelecionado: '',
      dropdownAberto: false
    };
  },
  computed: {
    primeiroNome() {
      return this.user?.displayName?.split(' ')[0] || this.user?.email?.split('@')[0] || 'Usuário';
    }
  },
  methods: {
    async carregarOrganizacoes() {
      const snapshot = await getDocs(collection(db, 'organizacoes'));
      this.organizacoes = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(org => org.usuarios.includes(this.user.email));

      if (this.organizacoes.length && !this.organizacaoSelecionada) {
        this.organizacaoSelecionada = this.organizacoes[0].id;
        this.emitirOrganizacao();
      }
    },

    async carregarProjetos() {
      if (!this.organizacaoSelecionada) return;

      const snapshot = await getDocs(collection(db, 'projetos'));
      this.projetos = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p =>
          p.organizacaoId === this.organizacaoSelecionada &&
          (p.criadoPor === this.user.uid || (p.allowedUsers || []).includes(this.user.uid))
        );

      this.projetos.sort((a, b) => a.NomeProjeto.localeCompare(b.NomeProjeto));

      const aindaExiste = this.projetos.find(p => p.id === this.projetoSelecionado);
      if (!aindaExiste && this.projetos.length) {
        this.projetoSelecionado = this.projetos[0].id;
        this.$emit('trocar-projeto', this.projetoSelecionado);
      }
    },

    emitirOrganizacao() {
      this.$emit('trocar-organizacao', this.organizacaoSelecionada);
      this.projetoSelecionado = '';
      this.$emit('trocar-projeto', '');
      this.carregarProjetos();
    },

    onTrocarProjeto() {
      this.$emit('trocar-projeto', this.projetoSelecionado);
    },

    toggleDropdown() {
      this.dropdownAberto = !this.dropdownAberto;
    },

    abrirUsuario() {
      alert(`Nome: ${this.user.displayName || '---'}\nEmail: ${this.user.email}`);
    },

    abrirDuvidas() {
      alert('Para dúvidas, entre em contato com suporte@lasengenharia.com');
    },

    abrirConfiguracoes() {
      this.$router.push('/configuracoes');
    }
  },
  watch: {
    organizacaoId: {
      handler(nova) {
        this.organizacaoSelecionada = nova;
        this.carregarProjetos();
      },
      immediate: true
    },
    projetoAtivo: {
      handler(novo) {
        this.projetoSelecionado = novo;
      },
      immediate: true
    }
  },
  mounted() {
    if (this.user?.email) {
      this.carregarOrganizacoes();
    }
  }
};
</script>



