<template>
  <div class="calendario-container">
    <FullCalendar
      :events="eventosFormatados"
      :plugins="[dayGridPlugin, interactionPlugin]"
      initial-view="dayGridMonth"
      @dateClick="handleDateClick"
      @eventClick="handleEventClick"
    />
  </div>
</template>

<script>
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default {
  props: ['dados'],
  emits: ['excluirItem', 'editarItem'],
  methods: {
    handleDateClick(info) {
      const novoItem = {
        nome: '',
        dataInicio: info.dateStr,
        dataFim: info.dateStr,
        id: null
      };
      this.$emit('editarItem', novoItem); // abre modal para adicionar
    },
    handleEventClick(info) {
      const item = this.dados.find(d => d.id === info.event.id);
      if (item) {
        this.$emit('editarItem', { ...item }); // abre modal para editar
      }
    }
  },
  computed: {
    eventosFormatados() {
      return this.dados.map(item => ({
        id: item.id,
        title: item.nome,
        start: item.dataInicio,
        end: item.dataFim
      }));
    }
  }
};
</script>
