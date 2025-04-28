<template>
  <div class="configuracoes-container">
    <h2>Configurações Globais</h2>

    <!-- Seção: Categorias de Itens -->
    <section>
      <h3>Categorias de Itens</h3>
      <ul>
        <li v-for="(cat, index) in configuracoes.categoriasItens" :key="index">
          {{ cat }}
          <button @click="removerItem('categoriasItens', index)">Remover</button>
        </li>
      </ul>
      <input v-model="novoValor.categoriasItens" placeholder="Nova Categoria" />
      <button @click="adicionarItem('categoriasItens')">Adicionar Categoria</button>
    </section>

    <!-- Seção: Tipos de Itens -->
    <section>
      <h3>Tipos de Itens</h3>
      <ul>
        <li v-for="(tipo, index) in configuracoes.tiposItens" :key="index">
          {{ tipo }}
          <button @click="removerItem('tiposItens', index)">Remover</button>
        </li>
      </ul>
      <input v-model="novoValor.tiposItens" placeholder="Novo Tipo de Item" />
      <button @click="adicionarItem('tiposItens')">Adicionar Tipo</button>
    </section>

    <!-- Seção: Tipos de Projetos -->
    <section>
      <h3>Tipos de Projetos</h3>
      <ul>
        <li v-for="(tipo, index) in configuracoes.tiposProjetos" :key="index">
          {{ tipo }}
          <button @click="removerItem('tiposProjetos', index)">Remover</button>
        </li>
      </ul>
      <input v-model="novoValor.tiposProjetos" placeholder="Novo Tipo de Projeto" />
      <button @click="adicionarItem('tiposProjetos')">Adicionar Tipo</button>
    </section>

    <!-- Seção: Status de Etapas -->
    <section>
      <h3>Status de Etapas</h3>
      <ul>
        <li v-for="(status, index) in configuracoes.statusEtapas" :key="index">
          {{ status }}
          <button @click="removerItem('statusEtapas', index)">Remover</button>
        </li>
      </ul>
      <input v-model="novoValor.statusEtapas" placeholder="Novo Status" />
      <button @click="adicionarItem('statusEtapas')">Adicionar Status</button>
    </section>
  </div>
</template>

<script>
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default {
  data() {
    return {
      configuracoes: {
        categoriasItens: [],
        tiposItens: [],
        tiposProjetos: [],
        statusEtapas: [],
      },
      novoValor: {
        categoriasItens: '',
        tiposItens: '',
        tiposProjetos: '',
        statusEtapas: '',
      },
    };
  },
  methods: {
    async carregarConfiguracoes() {
      const docRef = doc(db, "configuracoesGlobais", "padrao");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        this.configuracoes = docSnap.data();
      } else {
        await setDoc(docRef, this.configuracoes); // inicializa
      }
    },
    async salvarConfiguracoes() {
      const docRef = doc(db, "configuracoesGlobais", "padrao");
      await setDoc(docRef, this.configuracoes);
    },
    async adicionarItem(tipo) {
      const valor = this.novoValor[tipo].trim();
      if (valor && !this.configuracoes[tipo].includes(valor)) {
        this.configuracoes[tipo].push(valor);
        this.novoValor[tipo] = '';
        await this.salvarConfiguracoes();
      } else {
        alert("Valor inválido ou já existente.");
      }
    },
    async removerItem(tipo, index) {
      this.configuracoes[tipo].splice(index, 1);
      await this.salvarConfiguracoes();
    },
  },
  mounted() {
    this.carregarConfiguracoes();
  },
};
</script>