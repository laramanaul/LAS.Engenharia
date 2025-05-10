<template>
  <div class="convite-confirmacao-view">
    <h2>Confirmação de Convite</h2>
    <p v-if="status === 'pendente'">Verificando convite...</p>
    <div v-else-if="status === 'valido'" class="mensagem-sucesso">
      <p>Convite válido para entrar na organização <strong>{{ nomeOrganizacao }}</strong>.</p>
      <button class="botao-destaque" @click="aceitarConvite">✅ Aceitar Convite</button>
    </div>
    <div v-else class="mensagem-erro">
      <p>⚠️ Convite inválido ou expirado.</p>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export default {
  props: ['user'],
  data() {
    return {
      status: 'pendente',
      organizacaoId: '',
      nomeOrganizacao: ''
    };
  },
  async mounted() {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const orgId = params.get('org');
    this.organizacaoId = orgId;

    if (!email || !orgId) {
      this.status = 'invalido';
      return;
    }

    const ref = doc(db, 'organizacoes', orgId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data.usuarios?.includes(email)) {
        this.status = 'valido';
        this.nomeOrganizacao = data.Nome || '';
      } else {
        this.status = 'invalido';
      }
    } else {
      this.status = 'invalido';
    }
  },
  methods: {
    async aceitarConvite() {
      if (!this.user?.email) return;
      try {
        const ref = doc(db, 'organizacoes', this.organizacaoId);
        await updateDoc(ref, {
          usuarios: arrayUnion(this.user.email)
        });
        alert('Você foi adicionado à organização com sucesso!');
        this.$router.push('/');
      } catch (err) {
        console.error('Erro ao aceitar convite:', err);
        alert('Erro ao processar o convite.');
      }
    }
  }
};
</script>

<style scoped>
.convite-confirmacao-view {
  max-width: 600px;
  margin: auto;
  padding: 2rem;
  text-align: center;
}
.mensagem-sucesso {
  color: #155724;
}
.mensagem-erro {
  color: #a94442;
}
</style>