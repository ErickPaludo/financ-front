import { useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Icon,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import type { Categoria } from "../../../models/categorias/Categorias";
import ChipCategoria from "../../../componentes/chip-categoria/ChipCategoria";
import CampoTexto from "../../../props/campo-texto/CampoTexto";
import SeletorCor from "../../../props/seletor-cor/SeletorCor";
import { useEnvioFormulario } from "../../../hooks/useEnvioFormulario";
import { normalizarNome } from "../../../utils/formatacao";
import { CORES_CATEGORIA } from "../../../utils/corCategoria";

const TAMANHO_MAXIMO = 40;

type PropNovaCategoriaForm = {
  categorias: Categoria[]; // existentes: nome repetido e cor ainda livre
  // devolve a mensagem de erro da API, ou nada quando deu certo
  onCriar: (dados: { nome: string; cor: string }) => Promise<string | void>;
  onCancelar: () => void;
};

// Card "Nova categoria" no topo da gaveta de categorias: prévia, nome (sem repetir) e cor.
const NovaCategoriaForm: React.FC<PropNovaCategoriaForm> = ({
  categorias,
  onCriar,
  onCancelar,
}) => {
  const [nome, setNome] = useState("");
  // começa na primeira cor que nenhuma categoria usa ainda
  const [cor, setCor] = useState(() => {
    const usadas = new Set(categorias.map((c) => c.cor.toLowerCase()));
    return (
      CORES_CATEGORIA.find((c) => !usadas.has(c.valor)) ?? CORES_CATEGORIA[0]
    ).valor;
  });

  const nomeLimpo = nome.trim();
  const repetido =
    nomeLimpo !== "" &&
    categorias.some((c) => normalizarNome(c.nome) === normalizarNome(nome));

  const envio = useEnvioFormulario(async () => {
    const erro = await onCriar({ nome: nomeLimpo, cor });
    if (erro) return erro; // mantém o que foi digitado
    setNome("");
  });
  const podeCriar = nomeLimpo !== "" && !repetido && !envio.enviando;

  return (
    <Paper
      component="form"
      variant="outlined"
      noValidate
      onSubmit={(e: React.FormEvent) =>
        podeCriar ? envio.enviar(e) : e.preventDefault()
      }
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Escape" && !envio.enviando) {
          e.stopPropagation(); // fecha só o card, não a gaveta
          onCancelar();
        }
      }}
      sx={{
        p: 2.25,
        borderRadius: "16px",
        borderColor: "primary.main",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}
      >
        <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
          Nova categoria
        </Typography>
        <ChipCategoria nome={nomeLimpo || "Prévia"} cor={cor} />
      </Stack>

      <CampoTexto
        label="Nome"
        placeholder="Ex.: Mercado, Uber, Salário"
        autoFocus
        disabled={envio.enviando}
        valor={nome}
        setValor={setNome}
        validar={() =>
          repetido ? "Já existe uma categoria com esse nome" : null
        }
        mostrarErro
        helperText={nomeLimpo ? "Nenhuma com esse nome" : " "}
        slotProps={{ htmlInput: { maxLength: TAMANHO_MAXIMO } }}
      />

      <SeletorCor
        rotulo="Cor"
        valor={cor}
        setValor={setCor}
        cores={CORES_CATEGORIA}
        personalizada={false}
      />

      {envio.erro && <Alert severity="error">{envio.erro}</Alert>}

      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        <Button
          variant="outlined"
          disabled={envio.enviando}
          onClick={onCancelar}
          sx={{ minHeight: 44 }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!podeCriar}
          startIcon={
            envio.enviando ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <Icon>check</Icon>
            )
          }
          sx={{ minHeight: 44 }}
        >
          Criar categoria
        </Button>
      </Stack>
    </Paper>
  );
};

export default NovaCategoriaForm;
