import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import TabelaPesquisa from "../../componentes/tabela-pesquisa/TabelaPesquisa";

import Conecta from "../../services/api/apiConnect";
import type {
  Categoria,
  CategoriaResponse,
} from "../../models/categorias/Categorias";
import CampoTexto from "../../props/campo-texto/CampoTexto";
import SeletorCor from "../../props/seletor-cor/SeletorCor";
import { existeCampoVazio } from "../../props/campo-texto/validacoes";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";

const COR_INICIAL = "#314158";

type Aba = "nova" | "editar";

interface PropCategorias {
  idConta: number;
  buscaMovimentacoes: () => void;
}

// Conteúdo da gaveta de categorias: clicar numa categoria edita/exclui; sem seleção, cadastra.
const Categorias: React.FC<PropCategorias> = ({
  idConta,
  buscaMovimentacoes,
}) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selecionada, setSelecionada] = useState<Categoria | null>(null);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(COR_INICIAL);
  const [aba, setAba] = useState<Aba>("nova");

  const buscaCategorias = useCallback(
    () =>
      Conecta<CategoriaResponse>(`/Contas/${idConta}/Categorias`, "GET").then(
        (resposta) => {
          if (resposta.sucesso && resposta.dados)
            setCategorias(resposta.dados.conteudo);
        },
      ),
    [idConta],
  );

  useEffect(() => {
    buscaCategorias();
  }, [buscaCategorias]);

  const selecionar = (categoria: Categoria | null) => {
    setSelecionada(categoria);
    setNome(categoria?.nome ?? "");
    setCor(categoria?.cor ?? COR_INICIAL);
  };

  const concluir = () => {
    selecionar(null);
    buscaCategorias();
    buscaMovimentacoes();
  };

  const salvar = async () => {
    if (existeCampoVazio(nome)) return "Informe o nome da categoria";

    const corpo = { nome: nome.trim(), cor };
    const resposta = selecionada
      ? await Conecta<string>(
          `/Contas/Categorias/${selecionada.idCategoria}/Alterar`,
          "PATCH",
          corpo,
        )
      : await Conecta<string>(`/Contas/${idConta}/Categorias`, "POST", corpo);
    if (!resposta.sucesso)
      return resposta.erro ?? "Não foi possível salvar a categoria";

    concluir();
  };

  const excluir = async () => {
    const resposta = await Conecta<string>(
      `/Contas/Categorias/${selecionada!.idCategoria}/Remover`,
      "DELETE",
      undefined,
    );
    if (!resposta.sucesso)
      return resposta.erro ?? "Não foi possível excluir a categoria";

    concluir();
  };

  const envio = useEnvioFormulario(salvar);
  const exclusao = useEnvioFormulario(excluir);
  const ocupado = envio.enviando || exclusao.enviando;
  const erro = envio.erro ?? exclusao.erro;

  const trocarAba = (nova: Aba) => {
    setAba(nova);
    selecionar(null);
  };

  return (
    <Stack spacing={2.5} sx={{ flex: 1 }}>
      <Tabs
        value={aba}
        onChange={(_, nova: Aba) => trocarAba(nova)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="nova" label="Nova categoria" />
        <Tab value="editar" label="Editar" />
      </Tabs>

      {/* fora do <form>: Enter na pesquisa não pode cadastrar */}
      {aba === "editar" && (
        <Stack spacing={1}>
          <TabelaPesquisa
            itens={categorias}
            chave={(c) => c.idCategoria}
            texto={(c) => c.nome}
            titulo="Categoria"
            placeholder="Pesquisar categoria"
            mensagemVazia="Nenhuma categoria cadastrada"
            selecionado={selecionada?.idCategoria}
            onSelecionar={selecionar}
            celula={(c) => (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    bgcolor: c.cor,
                    flexShrink: 0,
                  }}
                />
                {c.nome}
              </Box>
            )}
          />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Clique numa categoria para editar
          </Typography>
        </Stack>
      )}

      {(aba === "nova" || selecionada) && (
        <Stack
          component="form"
          onSubmit={envio.enviar}
          noValidate
          spacing={2.5}
          sx={{ flex: 1 }}
        >
          {/* prévia de como a categoria vai ficar */}
          <Box>
            <Chip
              label={nome.trim() || "Minha categoria"}
              sx={{
                bgcolor: cor,
                color: (t) => t.palette.getContrastText(cor),
              }}
            />
          </Box>

          <CampoTexto
            label="Nome da categoria"
            placeholder="Ex: Alimentação"
            valor={nome}
            setValor={setNome}
          />

          <SeletorCor rotulo="Cor da categoria" valor={cor} setValor={setCor} />

          {erro && <Alert severity="error">{erro}</Alert>}

          <Box sx={{ flex: 1 }} />

          {selecionada ? (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                disabled={ocupado}
                onClick={() => selecionar(null)}
                sx={{ flex: 1 }}
              >
                Cancelar
              </Button>
              <Button
                variant="outlined"
                color="error"
                disabled={ocupado}
                onClick={exclusao.enviar}
                sx={{ flex: 1 }}
              >
                {exclusao.enviando ? "Excluindo..." : "Excluir"}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={ocupado}
                sx={{ flex: 1 }}
              >
                {envio.enviando ? "Salvando..." : "Salvar"}
              </Button>
            </Stack>
          ) : (
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={ocupado}
            >
              {envio.enviando ? "Cadastrando..." : "Cadastrar"}
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default Categorias;
