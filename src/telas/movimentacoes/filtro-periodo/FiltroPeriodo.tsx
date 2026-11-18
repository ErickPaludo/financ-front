import { useState } from "react";
import dayjs from "dayjs";
import { Box, Button, ButtonGroup, Icon, Tooltip } from "@mui/material";

import CampoDataHora from "../../../props/campo-data-hora/CampoDataHora";
import { periodoDoMes } from "../../../utils/formatacao";

type PropFiltroPeriodo = {
  dataInicial: string; // FORMATO_DATA_HORA
  dataFinal: string;
  // as duas datas numa chamada só: os filtros vivem na URL, e duas escritas seguidas perderiam a primeira
  setPeriodo: (inicio: string, fim: string) => void;
};

// Filtro de período das movimentações: "[data inicial] [data final] [‹|›] [Pesquisar]".
// Editar as datas só muda o rascunho: a busca acontece no "Pesquisar" (ou Enter), não a cada
// tecla. As setas levam o período ao mês inteiro anterior/seguinte e já pesquisam.
const FiltroPeriodo: React.FC<PropFiltroPeriodo> = ({
  dataInicial,
  dataFinal,
  setPeriodo,
}) => {
  const [rascunho, setRascunho] = useState({
    inicio: dataInicial,
    fim: dataFinal,
  });
  // ajuste durante o render: o período aplicado mudou por fora (setas, URL) → o rascunho acompanha
  const [aplicado, setAplicado] = useState({
    inicio: dataInicial,
    fim: dataFinal,
  });
  if (aplicado.inicio !== dataInicial || aplicado.fim !== dataFinal) {
    setAplicado({ inicio: dataInicial, fim: dataFinal });
    setRascunho({ inicio: dataInicial, fim: dataFinal });
  }
  const alterado =
    rascunho.inicio !== dataInicial || rascunho.fim !== dataFinal;

  // do dia 1 às 00:00 ao último dia às 23:59, partindo do mês da data inicial (do rascunho)
  const moverMes = (meses: number) => {
    const { inicio, fim } = periodoDoMes(
      dayjs(rascunho.inicio).add(meses, "month"),
    );
    setPeriodo(inicio, fim);
  };

  const pesquisar = (e: React.FormEvent) => {
    e.preventDefault();
    if (alterado) setPeriodo(rascunho.inicio, rascunho.fim);
  };

  return (
    <Box
      component="form"
      onSubmit={pesquisar}
      sx={{
        // grade: as duas datas ficam em colunas 1fr, sempre com a mesma largura.
        // Celular: datas e setas numa linha, Pesquisar abaixo (à esquerda). Maior: tudo numa linha.
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr auto", sm: "1fr 1fr auto auto" },
        gridTemplateAreas: {
          xs: '"inicial final setas" "pesquisar pesquisar pesquisar"',
          sm: '"inicial final setas pesquisar"',
        },
        alignItems: "end", // pelo pé: os rótulos ficam acima dos campos, as setas não têm rótulo
        gap: 1,
        width: { xs: "100%", sm: "auto" },
        // versão compacta do campo do tema (que tem ~48px de altura)
        "& .MuiPickersOutlinedInput-root": {
          height: 36, // os chips de filtro usam a mesma altura
          pl: 1.25,
          pr: 0.5,
          fontSize: 13,
        },
        "& .MuiPickersSectionList-root": { py: 0.75 },
        "& .MuiPickersInputBase-root .MuiIconButton-root": { p: 0.5, mr: 0 },
        "& .MuiPickersInputBase-root .MuiSvgIcon-root": { fontSize: 18 },
      }}
    >
      <Box sx={{ gridArea: "inicial", minWidth: 0 }}>
        <CampoDataHora
          rotulo="Data inicial"
          valor={rascunho.inicio}
          setValor={(inicio) => setRascunho({ ...rascunho, inicio })}
          maximo={rascunho.fim}
        />
      </Box>
      <Box sx={{ gridArea: "final", minWidth: 0 }}>
        <CampoDataHora
          rotulo="Data final"
          valor={rascunho.fim}
          setValor={(fim) => setRascunho({ ...rascunho, fim })}
          minimo={rascunho.inicio}
        />
      </Box>
      <ButtonGroup
        variant="outlined"
        aria-label="Navegar entre meses"
        sx={{
          gridArea: "setas",
          justifySelf: "start",
          height: 36, // a altura dos campos compactos
          "& .MuiButton-root": {
            height: "100%",
            minWidth: 34,
            px: 0.5,
            bgcolor: "var(--fnc-tx-superficie)",
            borderColor: "var(--fnc-tx-botao-borda)",
            color: "var(--fnc-tx-chip-texto)",
            "&:hover": {
              bgcolor: "var(--fnc-tx-chip-fundo)",
              borderColor: "var(--fnc-tx-botao-borda)",
            },
          },
        }}
      >
        <Tooltip title="Mês anterior">
          <Button aria-label="Mês anterior" onClick={() => moverMes(-1)}>
            <Icon>chevron_left</Icon>
          </Button>
        </Tooltip>
        <Tooltip title="Próximo mês">
          <Button aria-label="Próximo mês" onClick={() => moverMes(1)}>
            <Icon>chevron_right</Icon>
          </Button>
        </Tooltip>
      </ButtonGroup>
      {/* destacado só quando há datas novas para pesquisar */}
      <Button
        type="submit"
        variant={alterado ? "contained" : "outlined"}
        disabled={!alterado}
        startIcon={<Icon>search</Icon>}
        sx={{
          gridArea: "pesquisar",
          justifySelf: "start",
          height: 36,
          px: 1.5,
          whiteSpace: "nowrap",
          "&.Mui-disabled": {
            color: "var(--fnc-tx-apoio)",
            borderColor: "var(--fnc-tx-botao-borda)",
          },
        }}
      >
        Pesquisar
      </Button>
    </Box>
  );
};

export default FiltroPeriodo;
