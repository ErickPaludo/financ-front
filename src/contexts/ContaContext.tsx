import { createContext, useMemo, useState, type ReactNode } from "react";
import type { ContaBancaria } from "../models/contas-usuarios/GetContasBancarias";
import type { ContaUsuario } from "../models/contas-usuarios/GetContaUsuario";

type ContaContextType = {
  conta: ContaBancaria | null;
  // vínculo do usuário logado com a conta selecionada (permissão, expiração)
  usuario: ContaUsuario | null;
  setConta: (contaBancaria: ContaBancaria) => void;
  setContaUsuario: (contaUsuario: ContaUsuario) => void;
  limparConta: () => void;
  // muda quando alguma conta é alterada fora da conta selecionada (ex.: favoritar pelo card)
  versaoContas: number;
  contasAlteradas: () => void;
};

type ContaProviderProps = {
  children: ReactNode;
};

export const ContaContext = createContext({} as ContaContextType);

export function ContaProvider({ children }: ContaProviderProps) {
  const [conta, setContaObj] = useState<ContaBancaria | null>(null);
  const [usuario, setUsuarioObj] = useState<ContaUsuario | null>(null);
  const [versaoContas, setVersaoContas] = useState(0);

  // Funções estáveis (não mudam a cada render): as telas usam como dependência de
  // useCallback/useEffect, e recriá-las faria a busca que chama setConta rodar em loop.
  const acoes = useMemo(
    () => ({
      setConta: (contaBancaria: ContaBancaria) => setContaObj(contaBancaria),
      setContaUsuario: (contaUsuario: ContaUsuario) =>
        setUsuarioObj(contaUsuario),
      limparConta: () => setContaObj(null),
      contasAlteradas: () => setVersaoContas((v) => v + 1),
    }),
    [],
  );

  return (
    <ContaContext.Provider value={{ conta, usuario, versaoContas, ...acoes }}>
      {children}
    </ContaContext.Provider>
  );
}
