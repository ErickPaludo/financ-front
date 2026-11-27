import { useEffect, useLayoutEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { IconButton, InputAdornment, Popover, TextField } from "@mui/material";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";

import { FORMATO_DATA_HORA } from "../../utils/formatacao";
import {
  editarDataHora,
  estaCompleto,
  lerDataHora,
  mascararDataHora,
  textoDaData,
  type Edicao,
} from "./textoDataHora";

type PropCampoDataHora = {
  rotulo: string;
  valor: string; // FORMATO_DATA_HORA
  setValor: (valor: string) => void;
  minimo?: string; // FORMATO_DATA_HORA
  maximo?: string;
};

// Campo de data e hora digitável, máscara fixa "dd/mm/aaaa hh:mm": cada dígito sobrescreve o
// lugar do cursor (ou da seleção), sem empurrar os outros. Ícone abre um calendário.
// Substituiu o DateTimePicker do MUI X, que às vezes não aceitava a digitação (relato do usuário).
// Só salva a data completa, que existe e dentro de minimo/maximo; ao sair, volta à última válida.
const CampoDataHora: React.FC<PropCampoDataHora> = ({
  rotulo,
  valor,
  setValor,
  minimo,
  maximo,
}) => {
  const [texto, setTexto] = useState(() => textoDaData(valor));
  // valor que o texto mostra: se a tela mudar o valor (atalho, seta), o texto acompanha
  const [valorVisto, setValorVisto] = useState(valor);
  const [ancora, setAncora] = useState<HTMLElement | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const cursor = useRef<number | null>(null);

  if (valor !== valorVisto) {
    setValorVisto(valor);
    setTexto(textoDaData(valor));
  }

  const foraDosLimites = (v: string) =>
    Boolean((minimo && v < minimo) || (maximo && v > maximo));
  const horaAtual = dayjs(valor).format("HH:mm");

  const mudarTexto = (novo: string, posicao: number | null) => {
    cursor.current = posicao;
    setTexto(novo);
    const data = lerDataHora(novo, horaAtual);
    if (data && !foraDosLimites(data) && data !== valor) {
      setValorVisto(data); // não reescreve o texto enquanto a pessoa digita
      setValor(data);
    }
  };

  // A edição é feita aqui, antes do navegador mexer no texto (evento nativo beforeinput, que
  // também vem do teclado do celular; o onKeyDown lá chega sem a tecla).
  const aoEditar = useRef<(e: InputEvent) => void>(() => {});
  // atualizado a cada render (lê valor/limites atuais); fora do render, como pede o lint
  useLayoutEffect(() => {
    aoEditar.current = (e: InputEvent) => {
      const campo = e.target as HTMLInputElement;
      let edicao: Edicao | null = null;
      if (e.inputType.startsWith("insert"))
        edicao = {
          tipo: "inserir",
          dados: e.data ?? e.dataTransfer?.getData("text") ?? "",
        };
      else if (e.inputType.startsWith("delete"))
        edicao = { tipo: "apagar", paraTras: e.inputType.includes("Backward") };
      if (!edicao) return; // desfazer/refazer: deixa o onChange remascarar
      e.preventDefault();
      const r = editarDataHora(
        campo.value,
        campo.selectionStart ?? 0,
        campo.selectionEnd ?? 0,
        edicao,
      );
      mudarTexto(r.texto, r.cursor);
    };
  });
  useEffect(() => {
    const campo = entrada.current;
    const ouvir = (e: Event) => aoEditar.current(e as InputEvent);
    campo?.addEventListener("beforeinput", ouvir);
    return () => campo?.removeEventListener("beforeinput", ouvir);
  }, []);
  useLayoutEffect(() => {
    if (cursor.current === null || !entrada.current) return;
    entrada.current.setSelectionRange(cursor.current, cursor.current);
    cursor.current = null;
  }, [texto]);

  const lido = lerDataHora(texto, horaAtual);
  const erro = !estaCompleto(texto)
    ? null
    : !lido
      ? "Data inválida"
      : foraDosLimites(lido)
        ? "Fora do período permitido"
        : null;

  return (
    <>
      <TextField
        fullWidth
        label={rotulo}
        value={texto}
        inputRef={entrada}
        error={erro !== null}
        helperText={erro}
        // só o que o beforeinput não pegou (autopreenchimento, desfazer)
        onChange={(e) => mudarTexto(mascararDataHora(e.target.value), null)}
        onBlur={() => setTexto(textoDaData(valor))}
        slotProps={{
          htmlInput: { inputMode: "numeric", autoComplete: "off" },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  aria-label="Abrir calendário"
                  onClick={(e) => setAncora(e.currentTarget)}
                >
                  <CalendarMonth />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <Popover
        open={Boolean(ancora)}
        anchorEl={ancora}
        onClose={() => setAncora(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <DateCalendar
          value={dayjs(valor)}
          minDate={minimo ? dayjs(minimo) : undefined}
          maxDate={maximo ? dayjs(maximo) : undefined}
          // muda só o dia; a hora continua a do campo
          onChange={(dia, estado) => {
            if (!dia) return;
            const hora = dayjs(valor);
            const novo = dia
              .hour(hora.hour())
              .minute(hora.minute())
              .format(FORMATO_DATA_HORA);
            if (foraDosLimites(novo)) return;
            setValorVisto(novo);
            setValor(novo);
            setTexto(textoDaData(novo));
            if (estado === "finish") setAncora(null);
          }}
        />
      </Popover>
    </>
  );
};

export default CampoDataHora;
