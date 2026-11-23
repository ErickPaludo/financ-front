import dayjs from "dayjs";

import { formatarMoeda } from "../../../utils/formatacao.ts";
import {
  colunasExportacao,
  type DadosExportacao,
} from "./colunasExportacao.ts";

// As fontes padrão do PDF (Helvetica) não têm o sinal de menos tipográfico do valorComSinal.
const moeda = (valor: number) =>
  `${valor < 0 ? "-" : "+"}${formatarMoeda(Math.abs(valor))}`;

// O texto do relatório, separado do desenho do PDF (testável no Node).
export const conteudoRelatorio = ({
  conta,
  inicio,
  fim,
  movimentacoes,
}: DadosExportacao) => {
  const colunas = colunasExportacao(moeda);
  const soma = (tipo: number) =>
    movimentacoes
      .filter((m) => m.tipo === tipo)
      .reduce((total, m) => total + m.valor, 0);
  const entradas = soma(0);
  const saidas = soma(1);
  const de = dayjs(inicio).format("DD/MM/YYYY");
  const ate = dayjs(fim).format("DD/MM/YYYY");
  return {
    conta,
    periodo: `Transações de ${de} a ${ate}`,
    totais: `${movimentacoes.length} ${movimentacoes.length === 1 ? "transação" : "transações"} · Entradas ${formatarMoeda(entradas)} · Saídas ${formatarMoeda(saidas)} · Saldo do período ${moeda(entradas - saidas)}`,
    cabecalho: colunas.map(([titulo]) => titulo),
    linhas: movimentacoes.map((mov) => colunas.map(([, valor]) => valor(mov))),
    gerado: `Gerado em ${dayjs().format("DD/MM/YYYY HH:mm")}`,
  };
};

// SVG não entra no jsPDF: desenha a logo num canvas e passa como PNG.
const logoPng = async (url: string) => {
  const imagem = new Image();
  imagem.src = url;
  await imagem.decode();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 240; // ~3x o tamanho no papel: fica nítida
  canvas.getContext("2d")!.drawImage(imagem, 0, 0, 240, 240);
  return canvas.toDataURL("image/png");
};

// Gera o PDF (A4 paisagem, papel branco). A biblioteca só carrega aqui, ao exportar.
export const gerarPdf = async (
  conteudo: ReturnType<typeof conteudoRelatorio>,
  urlLogo: string,
) => {
  const [{ jsPDF }, { autoTable }, logo] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    logoPng(urlLogo),
  ]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const largura = doc.internal.pageSize.getWidth();
  const margem = 12;

  // cabeçalho: logo + PldProjects à esquerda; conta e período à direita
  doc.addImage(logo, "PNG", margem, 9, 14, 14);
  doc.setFont("helvetica", "bold").setFontSize(15);
  doc.text("PldProjects", margem + 17, 18);
  doc.setFontSize(13);
  doc.text(conteudo.conta, largura - margem, 15, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(9);
  doc.text(conteudo.periodo, largura - margem, 20, { align: "right" });
  doc.setLineWidth(0.5).line(margem, 25, largura - margem, 25);
  doc.setTextColor(70).text(conteudo.totais, margem, 31);

  const iValor = conteudo.cabecalho.indexOf("Valor");
  autoTable(doc, {
    startY: 35,
    margin: { left: margem, right: margem, bottom: 14 },
    head: [conteudo.cabecalho],
    body: conteudo.linhas,
    styles: { fontSize: 8, cellPadding: 1.5, textColor: 20 },
    headStyles: { fillColor: 235, textColor: 20, fontStyle: "bold" },
    columnStyles: { [iValor]: { halign: "right", cellWidth: 26 } },
    // rodapé de cada página: data de geração e número da página
    didDrawPage: () => {
      doc.setFontSize(8).setTextColor(110);
      const altura = doc.internal.pageSize.getHeight();
      doc.text(conteudo.gerado, margem, altura - 7);
      doc.text(
        `Página ${doc.getNumberOfPages()}`,
        largura - margem,
        altura - 7,
        {
          align: "right",
        },
      );
    },
  });

  return doc.output("blob");
};
