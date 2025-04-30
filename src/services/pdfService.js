import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { db } from '@/services/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

export async function gerarPDF(tipoRelatorio, filtros) {
  const doc = new jsPDF('p', 'pt');

  const dados = await obterDadosReais(tipoRelatorio, filtros);
  doc.text(`Relatório: ${tipoRelatorio.toUpperCase()}`, 40, 40);

  if (dados.length > 0 && doc.autoTable) {
    doc.autoTable({
      head: [Object.keys(dados[0])],
      body: dados.map(obj => Object.values(obj)),
      startY: 60,
      theme: 'grid',
      headStyles: { fillColor: [79, 172, 254] },
      styles: { fontSize: 10, cellPadding: 5 }
    });
  } else {
    doc.text('Nenhum dado encontrado.', 40, 100);
  }

  doc.save(`relatorio-${tipoRelatorio}.pdf`);
}

async function obterDadosReais(tipo, filtros) {
  let resultado = [];

  const dataInicio = filtros.dataInicio ? new Date(filtros.dataInicio) : null;
  const dataFim = filtros.dataFim ? new Date(filtros.dataFim) : null;
  const projetoId = filtros.projetoId;

  if (tipo === 'projetos') {
    let q = collection(db, "projetos");
    if (projetoId) {
      q = query(q, where('__name__', '==', projetoId));
    }
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      resultado.push({ nome: data.nome, status: data.status, custo: data.custoTotal });
    });
  }

  if (tipo === 'custos') {
    let q = collection(db, "projetos");
    if (projetoId) {
      q = query(q, where('__name__', '==', projetoId));
    }
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      data.etapas.forEach(etapa => {
        resultado.push({ projeto: data.nome, etapa: etapa.nome, custo: etapa.custo });
      });
    });
  }

  if (tipo === 'logs') {
    let q = collection(db, "logs");
    if (projetoId) {
      q = query(q, where("projetoId", "==", projetoId));
    }
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let dataLog = data.data ? new Date(data.data.seconds * 1000) : null;
      if ((!dataInicio || dataLog >= dataInicio) && (!dataFim || dataLog <= dataFim)) {
        resultado.push({ usuario: data.usuario, acao: data.acao, data: dataLog.toLocaleDateString() });
      }
    });
  }

  if (tipo === 'completo') {
    const projetos = await obterDadosReais('projetos', filtros);
    const custos = await obterDadosReais('custos', filtros);
    const logs = await obterDadosReais('logs', filtros);
    resultado.push(...projetos, ...custos, ...logs);
  }

  return resultado;
}
