import {
  Chip,
  Icon,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import CampoDataHora from "../../../props/campo-data-hora/CampoDataHora";
import TituloSecao from "../../../componentes/titulo-secao/TituloSecao";
import {
  alterarFim,
  alterarInicio,
  atalhosPeriodo,
  diasDoPeriodo,
  mesmoPeriodo,
  moverPeriodo,
  type Periodo,
} from "./periodo";

type PropFiltroPeriodo = {
  dataInicial: string; // FORMATO_DATA_HORA
  dataFinal: string;
  // as duas datas numa chamada só: os filtros vivem na URL, e duas escritas seguidas perderiam a primeira
  onChange: (inicio: string, fim: string) => void;
};

// Período do painel de filtros: cabeçalho "Período · N dias" com as setas, "De" e "Até"
// empilhados e atalhos. Cada mudança já vale (vai para a URL e dispara a busca).
const FiltroPeriodo: React.FC<PropFiltroPeriodo> = ({
  dataInicial,
  dataFinal,
  onChange,
}) => {
  const periodo = { inicio: dataInicial, fim: dataFinal };
  const aplicar = (p: Periodo) => onChange(p.inicio, p.fim);
  const dias = diasDoPeriodo(periodo);

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" sx={{ alignItems: "center" }}>
        <TituloSecao semRecuo>Período</TituloSecao>
        <Typography
          component="span"
          sx={{ flex: 1, ml: 0.75, fontSize: 13, color: "text.secondary" }}
        >
          · {dias} {dias === 1 ? "dia" : "dias"}
        </Typography>
        <Tooltip title="Período anterior">
          <IconButton
            size="small"
            aria-label="Período anterior"
            onClick={() => aplicar(moverPeriodo(periodo, -1))}
          >
            <Icon>chevron_left</Icon>
          </IconButton>
        </Tooltip>
        <Tooltip title="Próximo período">
          <IconButton
            size="small"
            aria-label="Próximo período"
            onClick={() => aplicar(moverPeriodo(periodo, 1))}
          >
            <Icon>chevron_right</Icon>
          </IconButton>
        </Tooltip>
      </Stack>

      <CampoDataHora
        rotulo="De"
        valor={dataInicial}
        setValor={(inicio) => aplicar(alterarInicio(periodo, inicio))}
      />
      <CampoDataHora
        rotulo="Até"
        valor={dataFinal}
        setValor={(fim) => aplicar(alterarFim(periodo, fim))}
      />

      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        {atalhosPeriodo().map((atalho) => {
          const ativo = mesmoPeriodo(atalho.periodo, periodo);
          return (
            <Chip
              key={atalho.rotulo}
              label={atalho.rotulo}
              color={ativo ? "primary" : "default"}
              variant={ativo ? "filled" : "outlined"}
              aria-pressed={ativo}
              onClick={() => aplicar(atalho.periodo)}
            />
          );
        })}
      </Stack>
    </Stack>
  );
};

export default FiltroPeriodo;
