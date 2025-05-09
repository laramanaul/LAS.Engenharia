<template>
  <div class="login-container">
    <div class="login-content">
      <h1 class="login-title">
        <span class="gear-inline">⚙️</span> LAS Engenharia
      </h1>

      <div v-if="modoCadastro">
        <input v-model="nome" type="text" placeholder="Nome Completo" class="login-input" />
        <input v-model="telefone" type="tel" placeholder="Telefone" class="login-input" />
        
        <select v-model="estado" @change="buscarCidades" class="login-input">
          <option value="">Selecione o Estado</option>
          <option v-for="uf in estados" :key="uf.id" :value="uf.sigla">{{ uf.nome }}</option>
        </select>

        <select v-model="cidade" class="login-input">
          <option value="">Selecione a Cidade</option>
          <option v-for="c in cidades" :key="c.id" :value="c.nome">{{ c.nome }}</option>
        </select>

        <input v-model="email" type="email" placeholder="Email" class="login-input" />
        <input v-model="password" type="password" placeholder="Senha" class="login-input" />

        <button @click="cadastrar" class="login-button">Criar Conta</button>

        <div class="recover-group">
          <div @click="alternarModo" class="recover-password">Já tem conta? Fazer login</div>
        </div>
      </div>

      <div v-else>
        <input v-model="email" type="email" placeholder="Email" class="login-input" />
        <input v-model="password" type="password" placeholder="Senha" class="login-input" />

        <button @click="login" class="login-button">Entrar</button>

        <button @click="loginWithGoogle" class="gsi-material-button">
          <div class="gsi-material-button-content-wrapper">
            <img class="gsi-material-button-icon" src="https://developers.google.com/identity/images/g-logo.png" />
            <span class="gsi-material-button-contents">Entrar com Google</span>
            <span class="gsi-material-button-state"></span>
          </div>
        </button>

        <div class="recover-group">
          <div @click="recoverPassword" class="recover-password">Esqueceu a senha?</div>
          <div @click="alternarModo" class="recover-password">Não tem conta? Criar acesso</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      password: '',
      nome: '',
      telefone: '',
      estado: '',
      cidade: '',
      estados: [],
      cidades: [],
      modoCadastro: false,
    };
  },
  created() {
    this.buscarEstados();
  },
  methods: {
    login() {
      this.$emit('email-login', this.email, this.password);
    },
    loginWithGoogle() {
      this.$emit('google-login');
    },
    recoverPassword() {
      this.$emit('recover-password', this.email);
    },
    cadastrar() {
      this.$emit('register', {
        email: this.email,
        password: this.password,
        name: this.nome,
        phone: this.telefone,
        state: this.estado,
        city: this.cidade,
      });
    },
    alternarModo() {
      this.modoCadastro = !this.modoCadastro;
    },
    async buscarEstados() {
      const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
      this.estados = await res.json();
    },
    async buscarCidades() {
      if (this.estado) {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${this.estado}/municipios`);
        this.cidades = await res.json();
      }
    }
  },
};
</script>

<style scoped>
@import '../assets/css/LoginScreen.css';
</style>
