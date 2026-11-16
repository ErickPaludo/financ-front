import dayjs from "dayjs";
import { Box, Button, ButtonGroup, Icon, Stack, Tooltip } from "@mui/material";

import CampoDataHora from "../../../props/campo-data-hora/CampoDataHora";
import { FORMATO_DATA_HORA } from "../../../utils/formatacao";

type PropFiltroPeriodo = {
  dataInicial: string; // FORMATO_DATA_HORA
  setDataInicial: (valor: string) => void;
  dataFinal: string;
  setDataFinal: (valor: string) => void;
};

// Filtro de período das movimentações: "[data inicial] [data final] [‹|›]".
// As setas levam o período ao mês inteiro anterior/seguinte; as datas também podem ser editadas.
const FiltroPeriodo: React.FC<PropFiltroPeriodo> = ({
  dataInicial,
  setDataInicial,
  dataFinal,
  setDataFinal,
}) => {
  // do dia 1 às 00:00 ao último dia às 23:59, partindo do mês da data inicial
  const moverMes = (meses: number) => {
    const mes = dayjs(dataInicial).add(meses, "month");
    setDataInicial(mes.startOf("month").format(FORMATO_DATA_HORA));
    setDataFinal(mes.endOf("month").format(FORMATO_DATA_HORA));
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        flexWrap: "wrap",
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
      {/* largura do conteúdo: sem sobra entre a data e o ícone */}
      <Box sx={{ width: "fit-content" }}>
        <CampoDataHora
          label="Data inicial"
          valor={dataInicial}
          setValor={setDataInicial}
          maximo={dataFinal}
        />
      </Box>
      <Box sx={{ width: "fit-content" }}>
        {/* com acoes, o rótulo fica por fora e os botões ficam da altura do campo */}
        <CampoDataHora
          label="Data final"
          valor={dataFinal}
          setValor={setDataFinal}
          minimo={dataInicial}
          acoes={
            <ButtonGroup
              variant="outlined"
              aria-label="Navegar entre meses"
              sx={{
                "& .MuiButton-root": {
                  height: "auto", // o tema fixa 40px; aqui acompanha o campo
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
          }
        />
      </Box>
    </Stack>
  );
};

export default FiltroPeriodo;
