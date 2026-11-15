/** Validações compartilhadas entre telas e mock (doc 07). */

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** RN-CON-02. */
export function emailValido(email: string): boolean {
  return REGEX_EMAIL.test(email.trim());
}

/** RN-CON-03: mínimo 8 caracteres, com letras e números. */
export function senhaValida(senha: string): boolean {
  return senha.length >= 8 && /[A-Za-zÀ-ÿ]/.test(senha) && /\d/.test(senha);
}

/** Doc 10, `PUT /usuarios/me`: nome de 2 a 80 caracteres. */
export function nomeValido(nome: string): boolean {
  const tamanho = nome.trim().length;
  return tamanho >= 2 && tamanho <= 80;
}

export const LIMITES = {
  descricaoMin: 10,
  descricaoMax: 500,
  comentarioMin: 1,
  comentarioMax: 500,
  feedbackMax: 500,
  fotosMax: 3,
  /** RN-REG-03: data do ocorrido até 30 dias atrás. */
  diasOcorridoMax: 30,
  /** RN-ACO-07: reabertura em até 7 dias. */
  diasReabertura: 7,
} as const;

export function descricaoValida(descricao: string): boolean {
  const tamanho = descricao.trim().length;
  return tamanho >= LIMITES.descricaoMin && tamanho <= LIMITES.descricaoMax;
}

export function comentarioValido(texto: string): boolean {
  const tamanho = texto.trim().length;
  return tamanho >= LIMITES.comentarioMin && tamanho <= LIMITES.comentarioMax;
}

/** RN-REG-03: não futura e no máximo 30 dias atrás. */
export function dataOcorridoValida(iso: string, agora: Date = new Date()): boolean {
  const data = new Date(iso).getTime();
  const limite = agora.getTime() - LIMITES.diasOcorridoMax * 24 * 60 * 60 * 1000;
  return data <= agora.getTime() && data >= limite;
}
