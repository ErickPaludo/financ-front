import React, { useState } from "react";
import { Alert, Box, Button, Stack, Icon, Typography } from "@mui/material";

import ListaPesquisa from "../../componentes/lista-pesquisa/ListaPesquisa";
import ChipCategoria from "../../componentes/chip-categoria/ChipCategoria";
import Conecta from "../../services/api/apiConnect";
import type { Categoria } from "../../models/categorias/Categorias";
import CampoTexto from "../../props/campo-texto/CampoTexto";
import SeletorCor from "../../props/seletor-cor/SeletorCor";
import { existeCampoVazio } from "../../props/campo-texto/validacoes";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import { useCategorias } from "../../hooks/useCategorias";
import { normalizarNome } from "../../utils/formatacao";
import { CORES_CATEGORIA } from "../../utils/corCategoria";
import NovaCategoriaForm from "./nova-categoria/NovaCategoriaForm";

const COR_INICIAL = CORES_CATEGORIA[0].valor;

interface PropCategorias {
  idConta: number;
  buscaMovimentacoes: () => void;
}

// Conteúdo da gaveta de categorias: "+ Nova" abre o card de cadastro no topo; clicar numa
// categoria da lista edita/exclui.
const Categorias: React.FC<PropCategorias> = ({
  idConta,
  buscaMovimentacoes,
}) => {
  const { categorias, buscarCategorias } = useCategorias(idConta);
  const [selecionada, setSelecionada] = useState<Categoria | null>(null);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(COR_INICIAL);
  const [criando, setCriando] = useState(false);
  // nome da última criada, para destacá-la na lista (a API não devolve o id)
  const [criada, setCriada] = useState<string | null>(null);
  const idCriada = criada
    ? categorias.find((c) => normalizarNome(c.nome) === normalizarNome(criada))
        ?.idCategoria
    : undefined;

  const selecionar = (categoria: Categoria | null) => {
    setSelecionada(categoria);
    setCriada(null);
    if (categoria) setCriando(false);
    setNome(categoria?.nome ?? "");
    setCor(categoria?.cor ?? COR_INICIAL);
  };

  const concluir = () => {
    selecionar(null);
    buscarCategorias();
    buscaMovimentacoes();
  };

  const criar = async (corpo: { nome: string; cor: string }) => {
    const resposta = await Conecta<string>(
      `/Contas/${idConta}/Categorias`,
      "POST",
      corpo,
    );
    if (!resposta.sucesso)
      return resposta.erro ?? "Não foi possível criar a categoria";
    setCriando(false);
    concluir();
    setCriada(corpo.nome);
  };

  const salvar = async () => {
    if (existeCampoVazio(nome)) return "Informe o nome da categoria";

    const resposta = await Conecta<string>(
      `/Contas/Categorias/${selecionada!.idCategoria}/Alterar`,
      "PATCH",
      { nome: nome.trim(), cor },
    );
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

  return (
    <Stack spacing={2.5} sx={{ flex: 1 }}>
      {criando ? (
        <NovaCategoriaForm
          categorias={categorias}
          onCriar={criar}
          onCancelar={() => setCriando(false)}
        />
      ) : (
        <Button
          variant="outlined"
          startIcon={<Icon>add</Icon>}
          onClick={() => {
            selecionar(null);
            setCriando(true);
          }}
          sx={{ alignSelf: "flex-end", minHeight: 44 }}
        >
          Nova
        </Button>
      )}

      {/* fora do <form>: Enter na pesquisa não pode cadastrar */}
      <Stack spacing={1}>
        <ListaPesquisa
          itens={categorias}
          chave={(c) => c.idCategoria}
          texto={(c) => c.nome}
          placeholder="Pesquisar categoria"
          mensagemVazia="Nenhuma categoria cadastrada"
          selecionado={selecionada?.idCategoria ?? idCriada}
          onSelecionar={selecionar}
          item={(c, marcada) => (
            <>
              <ChipCategoria nome={c.nome} cor={c.cor} />
              <Box sx={{ flex: 1 }} />
              <Icon
                fontSize="small"
                sx={{ color: marcada ? "primary.main" : "text.secondary" }}
              >
                {marcada ? "check" : "edit"}
              </Icon>
            </>
          )}
        />
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Clique numa categoria para editar
        </Typography>
      </Stack>

      {selecionada && (
        <Stack
          component="form"
          onSubmit={envio.enviar}
          noValidate
          spacing={2.5}
          sx={{ flex: 1 }}
        >
          {/* prévia de como a categoria vai ficar */}
          <Box>
            <ChipCategoria
              nome={nome.trim() || "Minha categoria"}
              cor={cor}
              tamanho="medium"
            />
          </Box>

          <CampoTexto
            label="Nome da categoria"
            placeholder="Ex: Alimentação"
            valor={nome}
            setValor={setNome}
          />

          <SeletorCor
            rotulo="Cor da categoria"
            valor={cor}
            setValor={setCor}
            cores={CORES_CATEGORIA}
            personalizada={false}
          />

          {erro && <Alert severity="error">{erro}</Alert>}

          <Box sx={{ flex: 1 }} />

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
        </Stack>
      )}
    </Stack>
  );
};

export default Categorias;
