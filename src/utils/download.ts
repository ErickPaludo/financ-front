// Baixa um arquivo gerado no navegador (CSV, PDF) com o nome dado.
export const baixarArquivo = (arquivo: Blob, nome: string) => {
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
};
