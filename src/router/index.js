import { createRouter, createWebHistory } from 'vue-router'; // ou createWebHashHistory se for sua preferência
import { waitForAuthReady } from '../authReady';


import DashboardView from '../views/DashboardView.vue';
import ProjetosView from '../views/ProjetosView.vue';
import EtapasView from '../views/EtapasView.vue';
import FuncionariosView from '../views/FuncionariosView.vue';
import FornecedoresView from '../views/Fornecedores.vue';
import ItensView from '../views/ItensView.vue';
import ExecucaoView from '../views/ExecucaoView.vue';
import DiarioObraView from '../views/DiarioObraView.vue';
import RelatoriosView from '../views/RelatoriosView.vue';
import ConfiguracoesView from '../views/ConfiguracoesView.vue';
import TarefasView from '../views/TarefasView.vue';
import Fornecedores from '../views/Fornecedores.vue';




const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/projetos', component: ProjetosView, meta: { requiresAuth: true } },
  { path: '/etapas', component: EtapasView, meta: { requiresAuth: true } },
  { path: '/funcionarios', component: FuncionariosView, meta: { requiresAuth: true } },
  { path: '/itens', component: ItensView, meta: { requiresAuth: true } },
  { path: '/execucao', component: ExecucaoView, meta: { requiresAuth: true } },
  { path: '/diario-obra', component: DiarioObraView, meta: { requiresAuth: true } },
  { path: '/relatorios', component: RelatoriosView, meta: { requiresAuth: true } },
  { path: '/configuracoes', component: ConfiguracoesView, meta: { requiresAuth: true } },
  { path: '/tarefas', component: TarefasView, meta: { requiresAuth: true } },
{ path: '/fornecedores', component: FornecedoresView, meta: { requiresAuth: true } },


];


const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
