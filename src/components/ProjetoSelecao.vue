<template>
  <div class="projeto-selecao" v-if="projetos && projetos.length">
    <label for="projeto">Projeto:</label>
    <select id="projeto" v-model="projetoSelecionado" @change="trocarProjeto">
      <option disabled value="">Selecione</option>
      <option v-for="projeto in projetos" :key="projeto.id" :value="projeto.id">
        {{ projeto.NomeProjeto }}
      </option>
    </select>
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default {
  props: ['user', 'projetoAtivo'],
  emits: ['trocar-projeto'],
  data() {
    return {
      projetos: [],
      projetoSelecionado: '',
      carregando: false,  // Novo estado para controle de carregamento
    };
  },
  methods: {
    async carregarProjetos() {
      if (!this.user || !this.user.uid) {
        console.warn("Usuário ainda não disponível.");
        return;
      }

      this.carregando = true;  // Iniciar o carregamento

      try {
        const q = query(collection(db, "projetos"), where("allowedUsers", "array-contains", this.user.uid));
        const querySnapshot = await getDocs(q);
        this.projetos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log("Projetos carregados:", this.projetos);

        if (this.projetos.length > 0) {
          // Atribuindo o primeiro projeto como selecionado, se nenhum estiver selecionado
          if (!this.projetoSelecionado) {
            this.projetoSelecionado = this.projetos[0].id;
          }
          this.$emit('trocar-projeto', this.projetoSelecionado);
        } else {
          console.warn("Nenhum projeto encontrado.");
        }
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
      } finally {
        this.carregando = false;  // Finalizar carregamento
      }
    },

    trocarProjeto() {
      // Emitir evento de troca de projeto apenas quando houver alteração no projetoSelecionado
      if (this.projetoSelecionado) {
        this.$emit('trocar-projeto', this.projetoSelecionado);
      }
    },
  },

  watch: {
    projetoAtivo(newVal) {
      if (newVal !== this.projetoSelecionado) {
        this.projetoSelecionado = newVal;
      }
    },

    user(newUser) {
      if (newUser && newUser.uid) {
        this.carregarProjetos();
      }
    },
  },

  mounted() {
    // Evitar que o componente tente carregar projetos sem um usuário
    if (this.user && this.user.uid) {
      this.carregarProjetos();
    }
  },
};
</script>
