<template>
  <div class="dashboard-view">
    <h2>Dashboard</h2>

    <!-- Controles para Exibir/Ocultar Widgets -->
    <div class="dashboard-controles">
      <label v-for="(visivel, chave) in visibilidadeWidgets" :key="chave">
        <input type="checkbox" v-model="visibilidadeWidgets[chave]" />
        {{ nomesWidgets[chave] }}
      </label>
    </div>

    <!-- Widgets dinâmicos -->
    <DashboardWidgets
      :exibir="visibilidadeWidgets"
      :alertas="alertas"
      :contagemProjetos="resumo"
      :logsRecentes="logsRecentes"
      :alteracoesRecentes="alteracoesRecentes"
      :custosPorEtapa="custosPorEtapa"
      :localizacaoProjeto="localizacaoProjeto"
      :previsaoTexto="previsaoTexto"
      :projetos="projetosResumo"
      :etapas="etapasResumo"
    />
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import DashboardWidgets from '../components/DashboardWidgets.vue';

export default {
  name: 'DashboardView',
  components: { DashboardWidgets },
  props: {
    user: Object,
    projetoAtivo: String,
    organizacaoId: String
  },
  data() {
    return {
      visibilidadeWidgets: {
        alertas: true,
        projetos: true,
        logs: true,
        alteracoes: true,
        custos: true,
        tempo: true,
        status: true,
        progresso: true,
        atividades: true
      },
      nomesWidgets: {
        alertas: 'Alertas',
        projetos: 'Projetos',
        logs: 'Logs',
        alteracoes: 'Alterações',
        custos: 'Custos',
        tempo: 'Tempo',
        status: 'Status dos Projetos',
        progresso: 'Progresso',
        atividades: 'Atividades'
      },
      resumo: {
        total: 0,
        andamento: 0,
        finalizados: 0,
        itens: 0,
        etapasTotal: 0,
        etapasConcluidas: 0,
        totalExecutado: 0,
        tarefasTotal: 0,
        tarefasConcluidas: 0
      },
      alertas: [],
      logsRecentes: [],
      alteracoesRecentes: [],
      custosPorEtapa: [],
      localizacaoProjeto: { cidade: 'Teixeira de Freitas', estado: 'BA' },
      previsaoTexto: 'Carregando...',
      projetosResumo: [],
      etapasResumo: []
    };
  },
  watch: {
    projetoAtivo: 'carregarResumo',
    organizacaoId: 'carregarResumo'
  },
  methods: {
    async carregarResumo() {
      if (!this.organizacaoId || !this.projetoAtivo || !this.user?.uid) return;

      try {
        const [projetosSnap, itensSnap, etapasSnap, execucoesSnap, tarefasSnap] = await Promise.all([
          getDocs(collection(db, 'projetos')),
          getDocs(collection(db, 'itens')),
          getDocs(collection(db, 'etapas')),
          getDocs(collection(db, 'execucoes')),
          getDocs(collection(db, 'tarefas'))
        ]);

        const projetos = projetosSnap.docs.filter(doc => doc.data().organizacaoId === this.organizacaoId);
        const andamento = projetos.filter(p => p.data().Status === 'Em andamento').length;
        const finalizados = projetos.filter(p => p.data().Status === 'Finalizado').length;

        const itens = itensSnap.docs.filter(doc => doc.data().organizacaoId === this.organizacaoId);
        const etapas = etapasSnap.docs.filter(doc =>
          doc.data().organizacaoId === this.organizacaoId &&
          doc.data().ProjetosVinculados?.includes(this.projetoAtivo)
        );
        const execucoes = execucoesSnap.docs.filter(doc =>
          doc.data().organizacaoId === this.organizacaoId &&
          doc.data().projetoId === this.projetoAtivo
        );
        const tarefas = tarefasSnap.docs.filter(doc =>
          doc.data().organizacaoId === this.organizacaoId &&
          doc.data().projetoId === this.projetoAtivo
        );

        const etapasConcluidas = etapas.filter(e => e.data().Status === 'Concluída').length;
        const tarefasConcluidas = tarefas.filter(t => t.data().Status === 'Concluída').length;
        const totalExecutado = execucoes.reduce((soma, e) => soma + (parseFloat(e.data().valorReal) || 0), 0);

        this.resumo = {
          total: projetos.length,
          andamento,
          finalizados,
          itens: itens.length,
          etapasTotal: etapas.length,
          etapasConcluidas,
          totalExecutado,
          tarefasTotal: tarefas.length,
          tarefasConcluidas
        };

        this.projetosResumo = projetos.map(p => ({ nome: p.data().NomeProjeto || 'Projeto' }));
        this.etapasResumo = etapas.map(e => ({ etapa: e.data().NomeEtapa, progresso: e.data().Progresso || 0 }));
        this.logsRecentes = tarefas.slice(0, 5).map(t => ({ usuario: 'Usuário', acao: 'Atualizou tarefa', data: 'Hoje' }));
        this.alteracoesRecentes = etapas.slice(0, 5).map(e => ({ usuario: 'Usuário', campo: 'Etapa', data: 'Ontem' }));
        this.custosPorEtapa = execucoes.map(e => ({ etapa: e.data().etapa || 'Desconhecida', valor: e.data().valorReal || 0 }));
        this.previsaoTexto = 'Ensolarado, 28°C';
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      }
    }
  },
  mounted() {
    this.carregarResumo();
  }
};
</script>

<style scoped>
.dashboard-view {
  padding: .2rem;
  max-width: 80%;
}
.dashboard-controles {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  background: #f9f9f9;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
</style>
