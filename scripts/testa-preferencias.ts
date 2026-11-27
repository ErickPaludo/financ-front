// Rode com: node --experimental-strip-types scripts/testa-preferencias.ts
import assert from "node:assert/strict";

// localStorage falso: as chaves são propriedades enumeráveis, como no navegador (Object.keys)
const armazenamento: Record<string, string> = {};
Object.defineProperties(armazenamento, {
  getItem: { value: (k: string) => (k in armazenamento ? armazenamento[k] : null) },
  setItem: { value: (k: string, v: string) => { armazenamento[k] = String(v); } },
  removeItem: { value: (k: string) => { delete armazenamento[k]; } },
});
(globalThis as unknown as { localStorage: unknown }).localStorage = armazenamento;
const ls = armazenamento as unknown as Storage;

const { guardarPreferencias, restaurarPreferencias } = await import(
  "../src/utils/preferencias.ts"
);

// logout: guarda tudo menos a sessão; versaoVista fica solta
ls.setItem("user", '{"id":"1"}');
ls.setItem("modoCor", "claro");
ls.setItem("ordemContas:1", "[3,1]");
ls.setItem("versaoVista", "1.0.4-alpha");
guardarPreferencias("Ana@Email.com ");
assert.deepEqual(Object.keys(armazenamento).sort(), ["preferencias:ana@email.com", "versaoVista"]);

// outro usuário entra e sai: não vê nem apaga as da Ana
restaurarPreferencias("bia@email.com");
assert.equal(ls.getItem("modoCor"), null);
ls.setItem("modoCor", "escuro");
guardarPreferencias("bia@email.com");
assert.equal(ls.getItem("modoCor"), null);

// login da Ana (e-mail com outra caixa): volta tudo e o pacote sai
restaurarPreferencias("ana@email.com");
assert.equal(ls.getItem("modoCor"), "claro");
assert.equal(ls.getItem("ordemContas:1"), "[3,1]");
assert.equal(ls.getItem("user"), null);
assert.equal(ls.getItem("preferencias:ana@email.com"), null);
assert.ok(ls.getItem("preferencias:bia@email.com"));

// sem e-mail (sessão sem usuário): só limpa, como antes
guardarPreferencias(undefined);
assert.equal(ls.getItem("modoCor"), null);

// pacote corrompido: entra com o padrão, sem erro
ls.setItem("preferencias:ana@email.com", "{quebrado");
restaurarPreferencias("ana@email.com");
assert.equal(ls.getItem("modoCor"), null);

console.log("preferências: ok");
