import { baixarArquivo } from "../../../utils/download";
import { nomeArquivo, type DadosExportacao } from "./colunasExportacao";
import { gerarCsv } from "./exportacaoCsv";
import { conteudoRelatorio, gerarPdf } from "./exportacaoPdf";

// BOM: sem ele o Excel lê o UTF-8 como outra codificação e estraga os acentos.
export const exportarCsv = (dados: DadosExportacao) =>
  baixarArquivo(
    new Blob(["﻿" + gerarCsv(dados.movimentacoes)], {
      type: "text/csv;charset=utf-8",
    }),
    nomeArquivo(dados, "csv"),
  );

// Pode falhar (ex.: offline, sem baixar a biblioteca do PDF): quem chama mostra o erro.
export const exportarPdf = async (dados: DadosExportacao, urlLogo: string) =>
  baixarArquivo(
    await gerarPdf(conteudoRelatorio(dados), urlLogo),
    nomeArquivo(dados, "pdf"),
  );
