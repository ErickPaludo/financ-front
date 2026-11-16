import logoFnc from "../../assets/Logo.svg";
import SubtitleText from "../../props/subtitle-text/SubtitleText";
import TitleText from "../../props/title-text/TitleText";
import "./CarregamentoStyle.css";
const Carregamento = () => {
  return (
    <>
      <div className="fnc-ctn-loader">
        <img className="fnc-loader" src={logoFnc} alt="Carregamento" />
        <TitleText text={"Estamos preparando tudo para você!"} />
        <SubtitleText text={"Carregando . . ."} />
      </div>
    </>
  );
};

export default Carregamento;
