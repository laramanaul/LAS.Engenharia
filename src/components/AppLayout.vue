<template>
  <div class="main-layout com-sidebar">
    <Sidebar
      :user="user"
      :projetoAtivo="projetoAtivo"
      @trocar-projeto="atualizarProjeto"
      @trocar-organizacao="atualizarOrganizacao"
      @logout="$emit('logout')"
      @reset-password="$emit('reset-password', $event)"
    />

    <div class="main-content">
      <router-view
        :user="user"
        :projetoAtivo="projetoAtivo"
        :organizacaoId="organizacaoId"
      />
    </div>
  </div>
</template>

<script>
import Sidebar from './Sidebar.vue';

export default {
  name: 'AppLayout',
  components: {
    Sidebar
  },
  props: {
    user: Object
  },
  data() {
    return {
      projetoAtivo: '',
      organizacaoId: ''
    };
  },
methods: {
  atualizarProjeto(novoProjetoId) {
    console.log('🔄 Projeto ativo atualizado:', novoProjetoId);
    this.projetoAtivo = novoProjetoId;
  },
  atualizarOrganizacao(novaOrganizacaoId) {
    console.log('🔄 Organização ativa atualizada:', novaOrganizacaoId);
    this.organizacaoId = novaOrganizacaoId;
    this.projetoAtivo = '';
  }
}

};
</script>
