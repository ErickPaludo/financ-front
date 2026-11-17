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

// Filtro de período das movimentações: "[data inicial] [data final] [‹|›]".
// As setas levam o período ao mês inteiro anterior/seguinte; as datas também podem ser editadas.
const FiltroPeriodo: React.FC<PropFiltroPeriodo> = ({
  dataInicial,
  dataFinal,
  setPeriodo,
}) => {
  // do dia 1 às 00:00 ao último dia às 23:59, partindo do mês da data inicial
  const moverMes = (meses: number) => {
    const { inicio, fim } = periodoDoMes(dayjs(dataInicial).add(meses, "month"));
    setPeriodo(inicio, fim);
  };

  return (
    <Box
      sx={{
        // grade: as duas datas ficam em colunas 1fr, sempre com a mesma largura.
        // Celular: uma data por linha, setas ao lado da final. Maior: tudo numa linha.
        display: "grid",
        gridTemplateColumns: { xs: "1fr auto", sm: "1fr 1fr auto" },
        gridTemplateAreas: {
          xs: '"inicial ." "final setas"',
          sm: '"inicial final setas"',
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
          valor={dataInicial}
          setValor={(inicio) => setPeriodo(inicio, dataFinal)}
          maximo={dataFinal}
        />
      </Box>
      <Box sx={{ gridArea: "final", minWidth: 0 }}>
        <CampoDataHora
          rotulo="Data final"
          valor={dataFinal}
          setValor={(fim) => setPeriodo(dataInicial, fim)}
          minimo={dataInicial}
        />
      </Box>
      <ButtonGroup
        variant="outlined"
        aria-label="Navegar entre meses"
        sx={{
          gridArea: "setas",
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
    </Box>
  );
};

export default FiltroPeriodo;
