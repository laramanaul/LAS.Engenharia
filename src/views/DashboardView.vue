<template>
  <div v-if="user && projetoAtivo && organizacaoId" class="dashboard">
    <h2>📊 Dashboard</h2>

    <!-- Controles de exibição dos widgets -->
    <div class="dashboard-controles">
      <label v-for="(ativo, chave) in visibilidadeWidgets" :key="chave">
        <input type="checkbox" v-model="visibilidadeWidgets[chave]" />
        {{ nomesWidgets[chave] }}
      </label>
    </div>

    <!-- Área dos widgets -->
    <div class="dashboard-widgets">
      <!-- Widget: Resumo Geral -->
      <div v-if="visibilidadeWidgets.resumo" class="widget-card">
        <div class="widget-header">
          <span>📊 Resumo Geral</span>
        </div>
        <ul>
          <li>Total de Projetos: {{ resumo.totalProjetos || 0 }}</li>
          <li>Em Andamento: {{ resumo.andamento || 0 }}</li>
          <li>Finalizados: {{ resumo.finalizados || 0 }}</li>
          <li>Itens Cadastrados: {{ resumo.totalItens || 0 }}</li>
          <li>Etapas: {{ resumo.etapasConcluidas || 0 }} / {{ resumo.etapasTotal || 0 }}</li>
          <li>Tarefas: {{ resumo.tarefasConcluidas || 0 }} / {{ resumo.tarefasTotal || 0 }}</li>
          <li>Valor Executado: R$ {{ (resumo.totalExecutado || 0).toFixed(2) }}</li>
        </ul>
      </div>

      <!-- Widget: Custos por Projeto -->
      <div v-if="visibilidadeWidgets.custos" class="widget-card">
        <div class="widget-header">
          <span>💰 Custos por Projeto</span>
        </div>
        <ul>
          <li v-for="(item, idx) in custosPorEtapa" :key="idx">
            <strong>{{ item.projeto }}</strong><br />
            ➕ Executado: R$ {{ (item.executado || 0).toFixed(2) }}<br />
            ➖ Pendente: R$ {{ (item.pendente || 0).toFixed(2) }}
          </li>
        </ul>
      </div>

      <!-- Widget: Alertas -->
      <div v-if="visibilidadeWidgets.alertas" class="widget-card">
        <div class="widget-header">
          <span>🚨 Alertas</span>
        </div>
        <ul>
          <li v-for="(a, idx) in alertas" :key="idx">
            {{ a.titulo }} - {{ a.responsavel }} (até {{ a.prazo }})
          </li>
        </ul>
      </div>

      <!-- Widget: Alterações Recentes -->
      <div v-if="visibilidadeWidgets.alteracoes" class="widget-card">
        <div class="widget-header">
          <span>📌 Alterações Recentes</span>
        </div>
        <ul>
          <li v-for="(alt, idx) in alteracoesRecentes" :key="idx">
            {{ alt.etapa }} - {{ alt.status }} (por {{ alt.modificadoPor }})
          </li>
        </ul>
      </div>

      <!-- Widget: Previsão do Tempo -->
      <div v-if="visibilidadeWidgets.previsao" class="widget-card">
        <div class="widget-header">
          <span>🌤️ Previsão do Tempo</span>
        </div>
        <p>Hoje: {{ previsaoTempo.hoje }}</p>
        <div>
          <h4>Próximos dias:</h4>
          <ul>
            <li v-for="(dia, idx) in previsaoTempo.diasFuturos" :key="idx">
              {{ dia.dia }} — {{ obterIconeTempo(dia.codigo) }} {{ dia.min }}° / {{ dia.max }}°
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export default {
  name: 'DashboardView',
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
        custos: 'Custos por Projeto',
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
      const dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
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

        const [projetosSnap, etapasSnap, execucoesSnap, tarefasSnap, itensSnap] = await Promise.all([
          getDocs(collection(db, 'projetos')),
          getDocs(collection(db, 'etapas')),
          getDocs(collection(db, 'execucoes')),
          getDocs(collection(db, 'tarefas')),
          getDocs(collection(db, 'itens'))
        ]);

        const projetos = projetosSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p =>
            p.organizacaoId === this.organizacaoId &&
            (p.criadoPor === this.user.uid || (p.allowedUsers || []).includes(this.user.uid))
          );

        const etapas = etapasSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(e =>
            e.organizacaoId === this.organizacaoId &&
            e.ProjetosVinculados?.includes(this.projetoAtivo)
          );

        const execucoes = execucoesSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(e =>
            e.organizacaoId === this.organizacaoId &&
            e.ProjetoID === this.projetoAtivo
          );

        const tarefas = tarefasSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(t =>
            t.organizacaoId === this.organizacaoId &&
            t.projetoId === this.projetoAtivo
          );

        const itens = itensSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(i => i.organizacaoId === this.organizacaoId);

        // Widget Resumo
        this.resumo = {
          totalProjetos: projetos.length,
          andamento: projetos.filter(p => p.Status === 'Em andamento').length,
          finalizados: projetos.filter(p => p.Status === 'Finalizado').length,
          totalItens: itens.length,
          etapasTotal: etapas.length,
          etapasConcluidas: etapas.filter(e => e.Status === 'Concluída').length,
          tarefasTotal: tarefas.length,
          tarefasConcluidas: tarefas.filter(t => t.Status === 'Concluída').length,
          totalExecutado: execucoes
            .filter(e => e.Status === 'Finalizada')
            .reduce((soma, e) => soma + (parseFloat(e.ValorReal) || 0), 0)
        };

        // Widget Alertas
        this.alertas = tarefas
          .filter(t => t.Status === 'Pendente')
          .slice(0, 5)
          .map(t => ({
            titulo: t.Titulo,
            responsavel: t.Responsavel,
            prazo: t.DataFim
          }));

        // Widget Alterações Recentes
        this.alteracoesRecentes = etapas
          .slice(0, 5)
          .map(e => ({
            etapa: e.NomeEtapa,
            status: e.Status,
            modificadoPor: e.modificadoPor || 'Usuário'
          }));

        // Widget Custos por Projeto
        const custos = {};
        execucoes.forEach(e => {
          const projetoId = e.ProjetoID;
          if (!custos[projetoId]) {
            const projeto = projetos.find(p => p.id === projetoId);
            custos[projetoId] = {
              projeto: projeto ? projeto.NomeProjeto : 'Projeto não encontrado',
              executado: 0,
              pendente: 0
            };
          }
          if (e.Status === 'Finalizada') {
            custos[projetoId].executado += parseFloat(e.ValorReal) || 0;
          } else {
            custos[projetoId].pendente += parseFloat(e.ValorCotado) || 0;
          }
        });

        this.custosPorEtapa = Object.values(custos);

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
        () => {
          this.previsaoTempo.hoje = 'Erro ao obter localização.';
        }
      );
    },

    async carregarPrevisaoDoTempo() {
      try {
        const { latitude, longitude } = this.localizacao;
        if (!latitude || !longitude) return;

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=America/Bahia`;
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
      } catch {
        this.previsaoTempo.hoje = 'Erro ao carregar previsão.';
      }
    },

    obterIconeTempo(codigo) {
      if ([0, 1].includes(codigo)) return '☀️';
      if ([2].includes(codigo)) return '⛅';
      if ([3].includes(codigo)) return '☁️';
      if ([45, 48].includes(codigo)) return '🌫️';
      if ([51, 53, 55, 56, 57].includes(codigo)) return '🌦️';
      if ([61, 63, 65, 66, 67].includes(codigo)) return '🌧️';
      if ([71, 73, 75, 77, 85, 86].includes(codigo)) return '❄️';
      if ([80, 81, 82].includes(codigo)) return '🌧️';
      if ([95, 96, 99].includes(codigo)) return '⛈️';
      return '❔';
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

<style scoped>
.dashboard {
  padding: 1rem;
}

.dashboard-controles {
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.dashboard-widgets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.widget-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 0 6px rgba(0,0,0,0.1);
  padding: 1rem;
}

.widget-header {
  font-weight: bold;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.3rem;
}
</style>
