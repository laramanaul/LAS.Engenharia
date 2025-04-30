import * as XLSX from 'xlsx';
import { db } from '@/services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function gerarExcel(tipoRelatorio, filtros) {
  const dados = await obterDadosReais(tipoRelatorio, filtros);

  const worksheet = XLSX.utils.json_to_sheet(dados);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');

  XLSX.writeFile(workbook, `relatorio-${tipoRelatorio}.xlsx`);
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
