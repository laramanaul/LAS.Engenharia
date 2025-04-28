// App.vue com import de CSS modularizado
<template>
  <div :class="classeApp">
    <div v-if="carregando" class="loading">
      Carregando...
    </div>

    <LoginScreen 
      v-else-if="!user" 
      @login="setUser" 
      @google-login="loginWithGoogle"
      @email-login="loginWithEmail"
      @register="registerUser"
      @recover-password="recoverPassword"
    />

    <AppLayout
      v-else
      :user="user"
      :projetoAtivo="projetoAtivo"
      @trocar-projeto="trocarProjeto"
      @logout="logout"
      @reset-password="recoverPassword"
    />
  </div>
</template>

<script>
import { onAuthStateChanged, signOut, sendPasswordResetEmail, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, provider } from './firebase';
import LoginScreen from './components/LoginScreen.vue';
import AppLayout from './components/AppLayout.vue';


export default {
  name: 'App',
  components: {
    LoginScreen,
    AppLayout,
  },
  data() {
    return {
      user: null,
      projetoAtivo: '',
      carregando: true,
    };
  },
  created() {
    onAuthStateChanged(auth, (user) => {
      this.user = user;
      this.carregando = false;

      if (user) {
        console.log("Usuário logado:", user.uid);
      } else {
        console.log("Nenhum usuário logado.");
      }
    });
  },
  computed: {
    classeApp() {
      return this.user ? 'modo-logado' : 'modo-login';
    }
  },
  methods: {
    setUser(user) {
      this.user = user;
    },

    async loginWithGoogle() {
      try {
        const result = await signInWithPopup(auth, provider);
        this.setUser(result.user);
      } catch (error) {
        console.error("Erro Google Login:", error);
        alert("Erro ao logar com Google.");
      }
    },

    async loginWithEmail(email, password) {
      if (!email.includes('@')) {
        alert("Email inválido.");
        return;
      }
      if (password.length < 6) {
        alert("Senha deve ter no mínimo 6 caracteres.");
        return;
      }

      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        this.setUser(result.user);
      } catch (error) {
        console.error("Erro Email Login:", error);
        alert("Erro ao logar com e-mail/senha.");
      }
    },

    async registerUser({ email, password, name, phone, state, city }) {
      if (!email.includes('@')) {
        alert("Email inválido.");
        return;
      }
      if (password.length < 6) {
        alert("Senha deve ter no mínimo 6 caracteres.");
        return;
      }

      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        this.setUser(result.user);
      } catch (error) {
        console.error("Erro Registro:", error);
        alert("Erro ao registrar.");
      }
    },

    trocarProjeto(novoProjetoId) {
      this.projetoAtivo = novoProjetoId;
    },

    async logout() {
      await signOut(auth);
      this.user = null;
      this.projetoAtivo = '';
    },

    async recoverPassword(email) {
      if (!email) {
        alert("Email não fornecido.");
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        alert("E-mail de recuperação enviado!");
      } catch (error) {
        console.error("Erro ao enviar recuperação:", error);
        alert("Erro ao enviar e-mail de recuperação.");
      }
    },
  },
};
</script>


// main.js atualizado sem imports globais desnecessários
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { auth } from './firebase';
import './assets/css/index.css';

let app;

auth.onAuthStateChanged(user => {
  if (!app) {
    app = createApp(App);
    app.use(router).mount('#app');
  }
});
