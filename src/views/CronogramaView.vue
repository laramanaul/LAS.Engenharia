
<template>
  <div class="cronograma-view">
    <CronogramaGantt
      :dados="dados"
      :tipoSelecionado="tipoSelecionado"
      :filtroInicio="filtroInicio"
      :filtroFim="filtroFim"
      :zoom="zoom"
      @update:tipoSelecionado="tipoSelecionado = $event"
      @update:filtroInicio="filtroInicio = $event"
      @update:filtroFim="filtroFim = $event"
      @update:zoom="zoom = $event"
    />
  </div>
</template>

<script>
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import CronogramaGantt from '@/components/CronogramaGantt.vue';
import dayjs from 'dayjs';

export default {
  name: 'CronogramaView',
  components: { CronogramaGantt },
  props: {
    user: Object,
    projetoAtivo: String,
    organizacaoId: String
  },
  data() {
    return {
      dados: [],
      tipoSelecionado: 'etapas',
      filtroInicio: '',
      filtroFim: '',
      zoom: 'month'
    };
  },
  watch: {
    tipoSelecionado: 'carregarDados',
    filtroInicio: 'carregarDados',
    filtroFim: 'carregarDados',
    zoom: 'carregarDados',
    projetoAtivo(novo) {
      if (novo) this.preencherPeriodoDoProjeto(novo);
      this.carregarDados();
    },
    organizacaoId(novo) {
      if (novo) this.carregarDados();
    }
  },
  methods: {
    async preencherPeriodoDoProjeto(projetoId) {
      try {
        const docSnap = await getDoc(doc(db, 'projetos', projetoId));
        if (docSnap.exists()) {
          const projeto = docSnap.data();
          this.filtroInicio = projeto.dataInicio || '';
          this.filtroFim = projeto.dataFim || '';
        }
      } catch (e) {
        console.warn('Erro ao carregar dados do projeto:', e);
      }
    },
    async carregarDados() {
      if (!this.organizacaoId || !this.user?.uid || !this.tipoSelecionado) return;

      try {
        const colRef = collection(db, this.tipoSelecionado);
        const snapshot = await getDocs(colRef);

        const registros = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => {
            const permitido = item.organizacaoId === this.organizacaoId &&
              (item.UsuarioID === this.user.uid || (item.allowedUsers || []).includes(this.user.uid) || (this.user.email && (item.usuarios || []).includes(this.user.email)));

            const hasDates = item.dataInicio && item.dataFim;
            const pertenceProjeto = !this.projetoAtivo || item.ProjetoID === this.projetoAtivo;
            return permitido && hasDates && pertenceProjeto;
          });

        const inicioFiltro = this.filtroInicio ? dayjs(this.filtroInicio) : null;
        const fimFiltro = this.filtroFim ? dayjs(this.filtroFim) : null;

        const dadosFiltrados = registros.filter(item => {
          const inicioItem = dayjs(item.dataInicio);
          const fimItem = dayjs(item.dataFim);
          return (!inicioFiltro || fimItem.isAfter(inicioFiltro.subtract(1, 'day')))
              && (!fimFiltro || inicioItem.isBefore(fimFiltro.add(1, 'day')));
        });

        this.dados = dadosFiltrados.map(item => ({
          ...item,
          ProjetoNome: item.NomeProjeto || item.ProjetoNome || '',
          EtapaNome: item.NomeEtapa || item.EtapaNome || ''
        }));
      } catch (e) {
        console.error('Erro ao carregar dados do cronograma:', e);
      }
    }
  },
  mounted() {
    if (this.projetoAtivo) this.preencherPeriodoDoProjeto(this.projetoAtivo);
    this.carregarDados();
  }
};
</script>

<style scoped>
.cronograma-view {
  padding: 1rem;
  background-color: #f9fafb;
  min-height: 100vh;
}
</style>

<style scoped>
.cronograma-gantt-view {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.filtros-barra {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.filtros-barra label {
  font-size: 0.85rem;
  font-weight: 600;
  margin-right: 0.25rem;
}
.filtros-barra select,
.filtros-barra input[type="date"] {
  font-size: 0.8rem;
  padding: 0.2rem 0.3rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  max-width: 140px;
}
.gantt-wrapper {
  width: 100%;
  height: 60vh;
  max-height: 600px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  background: #fff;
}
.detalhes-modal {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  z-index: 999;
  max-width: 300px;
  transition: all 0.3s ease;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
=======
<template>
  <div class="cronograma-view">
    <CronogramaGantt
      :dados="dados"
      :tipoSelecionado="tipoSelecionado"
      :filtroInicio="filtroInicio"
      :filtroFim="filtroFim"
      :zoom="zoom"
      @update:tipoSelecionado="tipoSelecionado = $event"
      @update:filtroInicio="filtroInicio = $event"
      @update:filtroFim="filtroFim = $event"
      @update:zoom="zoom = $event"
    />
  </div>
</template>

<script>
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import CronogramaGantt from '@/components/CronogramaGantt.vue';
import dayjs from 'dayjs';

export default {
  name: 'CronogramaView',
  components: { CronogramaGantt },
  props: {
    user: Object,
    projetoAtivo: String,
    organizacaoId: String
  },
  data() {
    return {
      dados: [],
      tipoSelecionado: 'etapas',
      filtroInicio: '',
      filtroFim: '',
      zoom: 'month'
    };
  },
  watch: {
    tipoSelecionado: 'carregarDados',
    filtroInicio: 'carregarDados',
    filtroFim: 'carregarDados',
    zoom: 'carregarDados',
    projetoAtivo(novo) {
      if (novo) this.preencherPeriodoDoProjeto(novo);
      this.carregarDados();
    },
    organizacaoId(novo) {
      if (novo) this.carregarDados();
    }
  },
  methods: {
    async preencherPeriodoDoProjeto(projetoId) {
      try {
        const docSnap = await getDoc(doc(db, 'projetos', projetoId));
        if (docSnap.exists()) {
          const projeto = docSnap.data();
          this.filtroInicio = projeto.dataInicio || '';
          this.filtroFim = projeto.dataFim || '';
        }
      } catch (e) {
        console.warn('Erro ao carregar dados do projeto:', e);
      }
    },
    async carregarDados() {
      if (!this.organizacaoId || !this.user?.uid || !this.tipoSelecionado) return;

      try {
        const colRef = collection(db, this.tipoSelecionado);
        const snapshot = await getDocs(colRef);

        const registros = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => {
            const permitido = item.organizacaoId === this.organizacaoId &&
              (item.UsuarioID === this.user.uid || (item.allowedUsers || []).includes(this.user.uid) || (this.user.email && (item.usuarios || []).includes(this.user.email)));

            const hasDates = item.dataInicio && item.dataFim;
            const pertenceProjeto = !this.projetoAtivo || item.ProjetoID === this.projetoAtivo;
            return permitido && hasDates && pertenceProjeto;
          });

        const inicioFiltro = this.filtroInicio ? dayjs(this.filtroInicio) : null;
        const fimFiltro = this.filtroFim ? dayjs(this.filtroFim) : null;

        const dadosFiltrados = registros.filter(item => {
          const inicioItem = dayjs(item.dataInicio);
          const fimItem = dayjs(item.dataFim);
          return (!inicioFiltro || fimItem.isAfter(inicioFiltro.subtract(1, 'day')))
              && (!fimFiltro || inicioItem.isBefore(fimFiltro.add(1, 'day')));
        });

        this.dados = dadosFiltrados.map(item => ({
          ...item,
          ProjetoNome: item.NomeProjeto || item.ProjetoNome || '',
          EtapaNome: item.NomeEtapa || item.EtapaNome || ''
        }));
      } catch (e) {
        console.error('Erro ao carregar dados do cronograma:', e);
      }
    }
  },
  mounted() {
    if (this.projetoAtivo) this.preencherPeriodoDoProjeto(this.projetoAtivo);
    this.carregarDados();
  }
};
</script>

<style scoped>
.cronograma-view {
  padding: 1rem;
  background-color: #f9fafb;
  min-height: 100vh;
}
</style>

<style scoped>
.cronograma-gantt-view {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.filtros-barra {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.filtros-barra label {
  font-size: 0.85rem;
  font-weight: 600;
  margin-right: 0.25rem;
}
.filtros-barra select,
.filtros-barra input[type="date"] {
  font-size: 0.8rem;
  padding: 0.2rem 0.3rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  max-width: 140px;
}
.gantt-wrapper {
  width: 100%;
  height: 60vh;
  max-height: 600px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  background: #fff;
}
.detalhes-modal {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  z-index: 999;
  max-width: 300px;
  transition: all 0.3s ease;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
>>>>>>> 9396cd378334692f8c2f504fe0827aa082427823
