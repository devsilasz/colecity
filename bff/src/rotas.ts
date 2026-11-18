/**
 * Contrato app ↔ BFF (doc 08, seção 11): os caminhos espelham o doc 10, agrupados por recurso.
 * Converte o caminho que o app chama no caminho do domínio (sob `/api/v1`).
 * Devolve `null` para caminhos que o BFF não expõe (ex.: `/admin`).
 */
export function caminhoNoDominio(caminhoApp: string): string | null {
  const s = caminhoApp.split('/').filter((parte) => parte.length > 0);
  const [recurso, a, b, c] = s;
  if (s.some((parte) => parte === '..' || parte === '.')) return null;

  switch (recurso) {
    case 'usuarios':
      // /usuarios/me e /usuarios/me/ocorrencias
      return a === 'me' && s.length <= 3 ? s.join('/') : null;

    case 'ocorrencias':
      if (a === 'categorias' && s.length === 2) return 'categorias';
      if (a === 'mapa' && b && s.length === 3) return `mapa/${b}`;
      return s.join('/');

    case 'participacoes':
      // /participacoes/{id}/{afetado|apoio} → /ocorrencias/{id}/participacoes/{tipo}
      return a && (b === 'afetado' || b === 'apoio') && s.length === 3 ? `ocorrencias/${a}/participacoes/${b}` : null;

    case 'comentarios':
      if (a === 'denuncias' && s.length === 2) return 'denuncias';
      if (a === 'ocorrencia' && b && s.length === 3) return `ocorrencias/${b}/comentarios`;
      return a && s.length === 2 && c === undefined ? `comentarios/${a}` : null;

    case 'transporte':
      return s.join('/');

    default:
      return null;
  }
}
