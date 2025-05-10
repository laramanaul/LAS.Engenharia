<template>
  <div v-if="user && projetoAtivo && organizacaoId" class="dashboard">
    <h2>📊 Dashboard</h2>

    <!-- Controles de exibição -->
    <div class="dashboard-controles">
      <label v-for="(ativo, chave) in visibilidadeWidgets" :key="chave">
        <input type="checkbox" v-model="visibilidadeWidgets[chave]" />
        {{ nomesWidgets[chave] }}
      </label>
    </div>

    <!-- Widgets -->
    <DashboardWidgets
      :visibilidade="visibilidadeWidgets"
      :resumo="resumo"
      :custosPorEtapa="custosPorEtapa"
      :alertas="alertas"
      :alteracoes="alteracoesRecentes"
      :previsao="previsaoTempo"
    />
  </div>
</template>


<script>
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
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
        resumo: true,
        custos: true,
        alertas: true,
        alteracoes: true,
        previsao: true
      },
      nomesWidgets: {
        resumo: 'Resumo Geral',
        custos: 'Custos por Etapa',
        alertas: 'Alertas',
        alteracoes: 'Alterações Recentes',
        previsao: 'Previsão do Tempo'
      },
      resumo: {},
      custosPorEtapa: [],
      alertas: [],
      alteracoesRecentes: [],
      previsaoTempo: {
        hoje: 'Carregando...',
        diasFuturos: []
      },
      localizacao: {
        cidade: '',
        estado: '',
        latitude: null,
        longitude: null
      },
      organizacao: {}
    };
  },
methods: {
  formatarDiaSemana(dataStr, ehHoje) {
    const dias = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
    const data = new Date(dataStr);
    const nome = dias[data.getDay()];
    return ehHoje ? `HOJE (${nome})` : nome;
  },

  async carregarOrganizacao() {
    const ref = doc(db, 'organizacoes', this.organizacaoId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      this.organizacao = snap.data();
    }
  },

    async carregarResumo() {
  if (!this.user?.uid || !this.organizacaoId || !this.projetoAtivo) return;

  try {
    await this.carregarOrganizacao();

    const [projetosSnap, itensSnap, etapasSnap, execucoesSnap, tarefasSnap] = await Promise.all([
      getDocs(collection(db, 'projetos')),
      getDocs(collection(db, 'itens')),
      getDocs(collection(db, 'etapas')),
      getDocs(collection(db, 'execucoes')),
      getDocs(collection(db, 'tarefas'))
    ]);

    // FILTROS
    const projetos = projetosSnap.docs.filter(doc => {
      const p = doc.data();
      return (
        p.organizacaoId === this.organizacaoId &&
        (p.criadoPor === this.user.uid ||
          (p.allowedUsers || []).includes(this.user.uid) ||
          (this.organizacao.usuarios || []).includes(this.user.email))
      );
    });

    const execucoes = execucoesSnap.docs.filter(doc =>
      doc.data().organizacaoId === this.organizacaoId &&
      doc.data().projetoId === this.projetoAtivo
    );

    const tarefas = tarefasSnap.docs.filter(doc =>
      doc.data().organizacaoId === this.organizacaoId &&
      doc.data().projetoId === this.projetoAtivo
    );

    const etapas = etapasSnap.docs.filter(doc =>
      doc.data().organizacaoId === this.organizacaoId &&
      doc.data().ProjetosVinculados?.includes(this.projetoAtivo)
    );

    const itens = itensSnap.docs.filter(doc =>
      doc.data().organizacaoId === this.organizacaoId
    );

    // CONTAGEM DE RESUMO
    const andamento = projetos.filter(p => p.data().Status === 'Em andamento').length;
    const finalizados = projetos.filter(p => p.data().Status === 'Finalizado').length;
    const etapasConcluidas = etapas.filter(e => e.data().Status === 'Concluída').length;
    const tarefasConcluidas = tarefas.filter(t => t.data().Status === 'Concluída').length;

    const totalExecutadoResumo = execucoes.reduce((soma, e) => soma + (parseFloat(e.data().ValorReal) || 0), 0);

    this.resumo = {
      totalProjetos: projetos.length,
      andamento,
      finalizados,
      totalItens: itens.length,
      etapasTotal: etapas.length,
      etapasConcluidas,
      tarefasTotal: tarefas.length,
      tarefasConcluidas,
      totalExecutado: totalExecutadoResumo
    };

    // ALERTAS
    this.alertas = tarefas
      .filter(t => t.data().Status === 'Pendente')
      .slice(0, 5)
      .map(t => ({
        titulo: t.data().Titulo,
        responsavel: t.data().Responsavel,
        prazo: t.data().DataFim
      }));

    // ALTERAÇÕES
    this.alteracoesRecentes = etapas
      .slice(0, 5)
      .map(e => ({
        etapa: e.data().NomeEtapa,
        status: e.data().Status,
        modificadoPor: e.data().modificadoPor || 'Usuário'
      }));

    // CUSTOS: EXECUTADOS VS PENDENTES
    let totalExecutado = 0;
    let totalPendente = 0;

    execucoes.forEach(e => {
      const d = e.data();
      const valor = parseFloat(d.ValorReal) || 0;
      if (d.Status === 'Finalizada') {
        totalExecutado += valor;
      } else {
        totalPendente += valor;
      }
    });

    this.custosPorEtapa = [
      { tipo: 'Executado', valor: totalExecutado },
      { tipo: 'Pendente', valor: totalPendente }
    ];

  } catch (err) {
    console.error('Erro ao carregar dados do dashboard:', err);
  }
},


    async obterLocalizacao() {
    if (!navigator.geolocation) {
      this.previsaoTempo.hoje = 'Localização não suportada.';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        this.localizacao.latitude = pos.coords.latitude;
        this.localizacao.longitude = pos.coords.longitude;
        this.carregarPrevisaoDoTempo();
      },
      err => {
        this.previsaoTempo.hoje = 'Erro ao obter localização.';
      }
    );
  },

  async carregarPrevisaoDoTempo() {
    try {
      const lat = this.localizacao.latitude;
      const lon = this.localizacao.longitude;
      if (!lat || !lon) return;

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=America/Bahia`;
      const resposta = await fetch(url);
      const dados = await resposta.json();

      this.previsaoTempo.hoje = `${dados.current_weather.temperature}°C - ${dados.current_weather.weathercode}`;
      this.previsaoTempo.diasFuturos = dados.daily.time.map((data, i) => {
        const diaSemana = this.formatarDiaSemana(data, i === 0);
        return {
          dia: diaSemana,
          max: dados.daily.temperature_2m_max[i],
          min: dados.daily.temperature_2m_min[i],
          codigo: dados.daily.weathercode[i]
        };
      });
    } catch (e) {
      this.previsaoTempo.hoje = 'Erro ao carregar previsão.';
    }
  }
},

  watch: {
    projetoAtivo: 'carregarResumo',
    organizacaoId: 'carregarResumo'
  },
  mounted() {
    this.carregarResumo();
    this.obterLocalizacao();
  }
};
</script>
