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


    <!-- Seleção de Projeto -->
    <div class="sidebar-projeto">
      <select v-model="projetoSelecionado" @change="trocarProjeto">
        <option disabled value="">Selecione o Projeto</option>
        <option v-for="projeto in projetos" :key="projeto.id" :value="projeto.id">
          {{ projeto.NomeProjeto }}
        </option>
      </select>
    </div>

    <!-- Menu Principal -->
    <!-- CADASTROS -->
<ul class="menu-list">
  <li class="menu-separador">Cadastros</li>
  <li v-for="item in menuCadastros" :key="item.route" :class="{ active: $route.path === item.route }">
    <router-link :to="item.route">
      <button><span class="emoji">{{ item.icon }}</span> {{ item.name }}</button>
    </router-link>
  </li>
</ul>

<!-- LANÇAMENTOS -->
<ul class="menu-list">
  <li class="menu-separador">Lançamentos</li>
  <li v-for="item in menuLancamentos" :key="item.route" :class="{ active: $route.path === item.route }">
    <router-link :to="item.route">
      <button><span class="emoji">{{ item.icon }}</span> {{ item.name }}</button>
    </router-link>
  </li>
</ul>

<!-- RELATÓRIOS -->
<ul class="menu-list">
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
  props: ['user', 'projetoAtivo'],
  emits: ['trocar-projeto', 'logout', 'reset-password'],
  data() {
    return {
    menuCadastros: [
      { name: 'Projetos', route: '/projetos', icon: '📁' },
      { name: 'Itens', route: '/itens', icon: '📦' },
      { name: 'Fornecedores', route: '/fornecedores', icon: '🏷️' },
      { name: 'Funcionários', route: '/funcionarios', icon: '👷' }
    ],
    menuLancamentos: [
      { name: 'Etapas', route: '/etapas', icon: '📝' },
      { name: 'Execução', route: '/execucao', icon: '🔧' },
      { name: 'Diário de Obra', route: '/diario-obra', icon: '📖' },
      { name: 'Cronograma', route: '/cronograma', icon: '🗓️' }
    ],
    menuRelatorios: [

   
 { name: 'Relatórios', route: '/relatorios', icon: '📈' }
    ],
      projetos: [],
      projetoSelecionado: this.projetoAtivo || '',
      dropdownAberto: false,
    };
  },
  computed: {
    primeiroNome() {
      return this.user?.displayName?.split(' ')[0] || this.user?.email?.split('@')[0] || 'Usuário';
    }
  },
  watch: {
    projetoAtivo(novo) {
      this.projetoSelecionado = novo;
    }
  },
  methods: {
    async carregarProjetos() {
      try {
        const querySnapshot = await getDocs(collection(db, 'projetos'));
        this.projetos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => p.criadoPor === this.user.uid || (p.allowedUsers || []).includes(this.user.uid));

        if (this.projetos.length && !this.projetoSelecionado) {
          this.projetoSelecionado = this.projetoAtivo || this.projetos[0].id;
          this.$emit('trocar-projeto', this.projetoSelecionado);
        }
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
      }
    },
    trocarProjeto() {
      this.$emit('trocar-projeto', this.projetoSelecionado);
    },
    toggleDropdown() {
      this.dropdownAberto = !this.dropdownAberto;
    },
    abrirUsuario() {
      alert(`Nome: ${this.user.displayName || '---'}\nEmail: ${this.user.email}`);
    },
    abrirDuvidas() {
      alert("Para dúvidas, entre em contato com suporte@lasengenharia.com");
    },
    abrirConfiguracoes() {
      this.$router.push('/configuracoes');
    },
  },
  mounted() {
    if (this.user && this.user.uid) {
      this.carregarProjetos();
    } else {
      this.$watch('user', (novoUser) => {
        if (novoUser && novoUser.uid) {
          this.carregarProjetos();
        }
      }, { immediate: true });
    }
  }
};
</script>
