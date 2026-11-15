import type { Categoria, TipoOcorrencia } from '@/types/categoria';
import type { MotivoConclusao } from '@/types/ocorrencia';

/**
 * Sementes das ocorrências do mock: bairros reais de São Paulo, todas as categorias e estados.
 * Datas são relativas ao momento em que o banco mock é criado.
 * O estado é derivado das regras (RN-ACO-02, RN-ACO-09): não é informado aqui.
 */
export interface ComentarioSemente {
  /** Índice em USUARIOS_SEMENTE. */
  autor: number;
  texto: string;
  horasAtras: number;
}

export interface OcorrenciaSemente {
  categoria: Categoria;
  tipo: TipoOcorrencia;
  rua: string;
  bairro: string;
  lat: number;
  lng: number;
  /** Totais exibidos (incluem o autor como afetado, RN-REG-08). */
  afetados: number;
  apoios: number;
  criadaDiasAtras: number;
  atividadeHorasAtras: number;
  descricao: string;
  /** Índice em USUARIOS_SEMENTE (0 = conta de demonstração). */
  autor: number;
  linha?: string;
  fotos?: number;
  /** A conta de demonstração marcou "Também estou sendo afetado" / "Apoiar". */
  demoAfetado?: boolean;
  demoApoio?: boolean;
  ocorridoHorasAtras?: number;
  concluida?: { diasAtras: number; motivo: MotivoConclusao; feedback?: string; fotos?: number };
  comentarios?: ComentarioSemente[];
}

export const OCORRENCIAS_SEMENTE: OcorrenciaSemente[] = [
  // ───────────── Água ─────────────
  {
    categoria: 'AGUA', tipo: 'FALTA_ABASTECIMENTO', rua: 'Rua Taquari', bairro: 'Mooca',
    lat: -23.5512, lng: -46.5998, afetados: 37, apoios: 12, criadaDiasAtras: 2, atividadeHorasAtras: 1,
    autor: 1, demoAfetado: true, fotos: 1,
    descricao: 'Sem água desde ontem às 18h em todo o quarteirão. A Sabesp não deu previsão de retorno.',
    comentarios: [
      { autor: 2, texto: 'Aqui no nº 300 também está sem água desde ontem.', horasAtras: 20 },
      { autor: 0, texto: 'Liguei no 195 e disseram que há manutenção na rede. Protocolo aberto.', horasAtras: 9 },
      { autor: 3, texto: 'Ainda sem água na altura do nº 450.', horasAtras: 1 },
    ],
  },
  {
    categoria: 'AGUA', tipo: 'VAZAMENTO_VIA', rua: 'Rua dos Pinheiros', bairro: 'Pinheiros',
    lat: -23.5667, lng: -46.685, afetados: 8, apoios: 21, criadaDiasAtras: 4, atividadeHorasAtras: 6,
    autor: 0, fotos: 2,
    descricao: 'Vazamento forte no meio da rua, a água escorre até a esquina há dias e já abriu o asfalto.',
    comentarios: [
      { autor: 4, texto: 'Passei hoje cedo e continua vazando muito.', horasAtras: 6 },
    ],
  },
  {
    categoria: 'AGUA', tipo: 'BAIXA_PRESSAO', rua: 'Avenida Marechal Tito', bairro: 'São Miguel Paulista',
    lat: -23.4935, lng: -46.444, afetados: 14, apoios: 3, criadaDiasAtras: 3, atividadeHorasAtras: 14,
    autor: 5,
    descricao: 'A água chega muito fraca à noite, não enche a caixa. Acontece todos os dias depois das 20h.',
  },
  {
    categoria: 'AGUA', tipo: 'AGUA_APARENCIA_ALTERADA', rua: 'Avenida Belmira Marin', bairro: 'Grajaú',
    lat: -23.748, lng: -46.696, afetados: 2, apoios: 5, criadaDiasAtras: 1, atividadeHorasAtras: 10,
    autor: 6, fotos: 1,
    descricao: 'Água saindo amarelada da torneira desde ontem de manhã, com cheiro forte de cloro.',
  },
  {
    categoria: 'AGUA', tipo: 'FALTA_ABASTECIMENTO', rua: 'Rua Silva Bueno', bairro: 'Ipiranga',
    lat: -23.593, lng: -46.602, afetados: 19, apoios: 4, criadaDiasAtras: 9, atividadeHorasAtras: 60,
    autor: 7, demoAfetado: true,
    descricao: 'Faltou água por dois dias seguidos em vários prédios da rua.',
    concluida: { diasAtras: 2, motivo: 'AUTOR', feedback: 'A Sabesp consertou a adutora e a água voltou ao normal.', fotos: 1 },
  },

  // ───────────── Energia ─────────────
  {
    categoria: 'ENERGIA', tipo: 'FALTA_ENERGIA', rua: 'Avenida Itaquera', bairro: 'Itaquera',
    lat: -23.5405, lng: -46.456, afetados: 112, apoios: 34, criadaDiasAtras: 1, atividadeHorasAtras: 0.5,
    autor: 2, demoApoio: true, fotos: 1,
    descricao: 'Sem luz desde a chuva de ontem à tarde. Vários quarteirões apagados e comércio fechado.',
    comentarios: [
      { autor: 5, texto: 'Aqui na travessa também. Já são mais de 20 horas sem energia.', horasAtras: 5 },
      { autor: 8, texto: 'A Enel informou previsão para hoje às 22h.', horasAtras: 2 },
      { autor: 9, texto: 'Tem um poste com transformador queimado na esquina.', horasAtras: 0.5 },
    ],
  },
  {
    categoria: 'ENERGIA', tipo: 'ILUMINACAO_PUBLICA_APAGADA', rua: 'Rua Harmonia', bairro: 'Vila Madalena',
    lat: -23.556, lng: -46.69, afetados: 6, apoios: 18, criadaDiasAtras: 6, atividadeHorasAtras: 30,
    autor: 3, demoApoio: true,
    descricao: 'Três postes seguidos apagados há quase uma semana. A rua fica completamente escura à noite.',
  },
  {
    categoria: 'ENERGIA', tipo: 'FIACAO_EXPOSTA_CAIDA', rua: 'Rua Tuiuti', bairro: 'Tatuapé',
    lat: -23.54, lng: -46.576, afetados: 4, apoios: 27, criadaDiasAtras: 0.5, atividadeHorasAtras: 3,
    autor: 0, fotos: 2,
    descricao: 'Fio caído na calçada em frente à padaria, soltando faísca. Isolaram com cones, mas segue lá.',
    comentarios: [
      { autor: 6, texto: 'Cuidado, crianças passam por aí indo para a escola.', horasAtras: 3 },
    ],
  },
  {
    categoria: 'ENERGIA', tipo: 'OSCILACAO', rua: 'Rua Voluntários da Pátria', bairro: 'Santana',
    lat: -23.5025, lng: -46.626, afetados: 1, apoios: 2, criadaDiasAtras: 2, atividadeHorasAtras: 40,
    autor: 4,
    descricao: 'A energia oscila várias vezes por dia e já queimou aparelhos em casa.',
  },

  // ───────────── Vias ─────────────
  {
    categoria: 'VIAS', tipo: 'BURACO', rua: 'Avenida Vital Brasil', bairro: 'Butantã',
    lat: -23.5718, lng: -46.7085, afetados: 23, apoios: 41, criadaDiasAtras: 12, atividadeHorasAtras: 8,
    autor: 5, demoAfetado: true, demoApoio: true, fotos: 2,
    descricao: 'Buraco enorme na faixa da direita, sentido centro. Já vi dois carros com pneu estourado.',
    comentarios: [
      { autor: 7, texto: 'Quase caí de moto ali ontem à noite. Não tem sinalização.', horasAtras: 30 },
      { autor: 0, texto: 'Registrei no 156 também. Protocolo aberto.', horasAtras: 8 },
    ],
  },
  {
    categoria: 'VIAS', tipo: 'ALAGAMENTO', rua: 'Rua Guaicurus', bairro: 'Lapa',
    lat: -23.5225, lng: -46.701, afetados: 56, apoios: 15, criadaDiasAtras: 1, atividadeHorasAtras: 2,
    autor: 8, fotos: 1,
    descricao: 'A rua alaga toda vez que chove. Hoje a água entrou nas lojas e parou o trânsito.',
    comentarios: [
      { autor: 1, texto: 'O bueiro da esquina está entupido há meses.', horasAtras: 2 },
    ],
  },
  {
    categoria: 'VIAS', tipo: 'SEMAFORO_SINALIZACAO_DEFEITO', rua: 'Rua Domingos de Morais', bairro: 'Vila Mariana',
    lat: -23.589, lng: -46.635, afetados: 9, apoios: 11, criadaDiasAtras: 0.3, atividadeHorasAtras: 1.5,
    autor: 9,
    descricao: 'Semáforo do cruzamento em amarelo piscante desde cedo. Trânsito confuso e perigoso.',
  },
  {
    categoria: 'VIAS', tipo: 'CALCADA_DANIFICADA', rua: 'Rua Galvão Bueno', bairro: 'Liberdade',
    lat: -23.557, lng: -46.635, afetados: 2, apoios: 9, criadaDiasAtras: 15, atividadeHorasAtras: 100,
    autor: 0,
    descricao: 'Calçada quebrada e com desnível grande. Cadeirantes e idosos precisam ir pela rua.',
  },
  {
    categoria: 'VIAS', tipo: 'BURACO', rua: 'Avenida Sapopemba', bairro: 'Sapopemba',
    lat: -23.602, lng: -46.51, afetados: 11, apoios: 6, criadaDiasAtras: 20, atividadeHorasAtras: 200,
    autor: 0, fotos: 1,
    descricao: 'Cratera perto do ponto de ônibus, os coletivos desviavam pela contramão.',
    concluida: { diasAtras: 3, motivo: 'AUTOR', feedback: 'A Prefeitura tampou o buraco. Ficou bom!', fotos: 1 },
  },

  // ───────────── Árvores ─────────────
  {
    categoria: 'ARVORES', tipo: 'ARVORE_CAIDA', rua: 'Rua Cardoso de Almeida', bairro: 'Perdizes',
    lat: -23.536, lng: -46.677, afetados: 17, apoios: 8, criadaDiasAtras: 1, atividadeHorasAtras: 4,
    autor: 6, demoAfetado: true, fotos: 2,
    descricao: 'Árvore grande caiu com o vento e bloqueia a rua inteira. Ninguém passa de carro.',
    comentarios: [
      { autor: 3, texto: 'Os bombeiros vieram, mas disseram que a remoção é com a subprefeitura.', horasAtras: 4 },
    ],
  },
  {
    categoria: 'ARVORES', tipo: 'GALHO_RISCO_QUEDA', rua: 'Rua Augusta', bairro: 'Consolação',
    lat: -23.554, lng: -46.657, afetados: 3, apoios: 14, criadaDiasAtras: 5, atividadeHorasAtras: 50,
    autor: 7,
    descricao: 'Galho grosso rachado sobre a calçada, pendurado em cima do ponto de ônibus.',
  },
  {
    categoria: 'ARVORES', tipo: 'ARVORE_SOBRE_FIACAO', rua: 'Avenida Engenheiro Armando de Arruda Pereira', bairro: 'Jabaquara',
    lat: -23.646, lng: -46.641, afetados: 1, apoios: 4, criadaDiasAtras: 3, atividadeHorasAtras: 70,
    autor: 8, fotos: 1,
    descricao: 'Árvore encostada nos fios de alta tensão, faísca quando venta.',
  },

  // ───────────── Transporte ─────────────
  {
    categoria: 'TRANSPORTE', tipo: 'ATRASO_INTERVALO_EXCESSIVO', rua: 'Avenida Corifeu de Azevedo Marques', bairro: 'Butantã',
    lat: -23.548, lng: -46.749, afetados: 64, apoios: 22, criadaDiasAtras: 3, atividadeHorasAtras: 1,
    autor: 9, linha: '8700-10', demoAfetado: true,
    descricao: 'O 8700 está demorando mais de 40 minutos no horário de pico. Ponto lotado todos os dias.',
    comentarios: [
      { autor: 2, texto: 'Hoje esperei 50 minutos na Corifeu.', horasAtras: 12 },
      { autor: 4, texto: 'De manhã passaram três juntos e depois nada por quase uma hora.', horasAtras: 1 },
    ],
  },
  {
    categoria: 'TRANSPORTE', tipo: 'ALTERACAO_ROTA_SEM_AVISO', rua: 'Avenida Rebouças', bairro: 'Pinheiros',
    lat: -23.564, lng: -46.679, afetados: 12, apoios: 7, criadaDiasAtras: 1, atividadeHorasAtras: 5,
    autor: 1, linha: '702U-10',
    descricao: 'O 702U não passou pela Rebouças hoje, desviou pela Henrique Schaumann sem nenhum aviso.',
  },
  {
    categoria: 'TRANSPORTE', tipo: 'SUPERLOTACAO', rua: 'Estrada de Itapecerica', bairro: 'Capão Redondo',
    lat: -23.659, lng: -46.77, afetados: 88, apoios: 19, criadaDiasAtras: 6, atividadeHorasAtras: 3,
    autor: 2, linha: '5119-10',
    descricao: 'Ônibus saem do terminal já lotados. É impossível embarcar nos pontos seguintes de manhã.',
    comentarios: [
      { autor: 6, texto: 'Fico uns 3 ônibus esperando conseguir subir.', horasAtras: 3 },
    ],
  },
  {
    categoria: 'TRANSPORTE', tipo: 'PONTO_ESTACAO_DANIFICADO', rua: 'Avenida Adolfo Pinheiro', bairro: 'Santo Amaro',
    lat: -23.65, lng: -46.707, afetados: 5, apoios: 13, criadaDiasAtras: 8, atividadeHorasAtras: 90,
    autor: 3, fotos: 1,
    descricao: 'Cobertura do ponto de ônibus quebrada e banco arrancado. Quando chove não há onde se abrigar.',
  },
  {
    categoria: 'TRANSPORTE', tipo: 'LINHA_ESTACAO_FORA_OPERACAO', rua: 'Avenida dos Metalúrgicos', bairro: 'Cidade Tiradentes',
    lat: -23.59, lng: -46.401, afetados: 31, apoios: 9, criadaDiasAtras: 10, atividadeHorasAtras: 150,
    autor: 4, linha: '4313-10',
    descricao: 'A linha ficou dois dias sem circular e ninguém avisou os passageiros.',
    concluida: { diasAtras: 5, motivo: 'INATIVIDADE' },
  },

  // ───────────── Segurança (agrupamento na República → Zona de atenção) ─────────────
  {
    categoria: 'SEGURANCA', tipo: 'ASSALTO_ROUBO', rua: 'Praça da República', bairro: 'República',
    lat: -23.5436, lng: -46.6424, afetados: 1, apoios: 6, criadaDiasAtras: 2, atividadeHorasAtras: 48,
    autor: 1, ocorridoHorasAtras: 52,
    descricao: 'Levaram meu celular na saída do metrô por volta das 19h. Estava bem movimentado.',
  },
  {
    categoria: 'SEGURANCA', tipo: 'FURTO', rua: 'Avenida Ipiranga', bairro: 'República',
    lat: -23.5442, lng: -46.6431, afetados: 1, apoios: 3, criadaDiasAtras: 5, atividadeHorasAtras: 120,
    autor: 2, ocorridoHorasAtras: 124,
    descricao: 'Furtaram minha carteira dentro do ônibus parado no ponto da Ipiranga.',
  },
  {
    categoria: 'SEGURANCA', tipo: 'ASSALTO_ROUBO', rua: 'Rua Barão de Itapetininga', bairro: 'República',
    lat: -23.5431, lng: -46.6418, afetados: 1, apoios: 8, criadaDiasAtras: 8, atividadeHorasAtras: 190,
    autor: 3, ocorridoHorasAtras: 195,
    descricao: 'Assalto no calçadão no começo da noite. Levaram mochila e celular.',
  },
  {
    categoria: 'SEGURANCA', tipo: 'LOCAL_MAL_ILUMINADO_ERMO', rua: 'Rua Sete de Abril', bairro: 'República',
    lat: -23.5447, lng: -46.642, afetados: 1, apoios: 11, criadaDiasAtras: 12, atividadeHorasAtras: 280,
    autor: 4,
    descricao: 'Trecho muito escuro e deserto depois que o comércio fecha. Evito passar a pé.',
  },
  {
    categoria: 'SEGURANCA', tipo: 'FURTO', rua: 'Rua Vinte e Quatro de Maio', bairro: 'República',
    lat: -23.5439, lng: -46.6437, afetados: 1, apoios: 2, criadaDiasAtras: 16, atividadeHorasAtras: 380,
    autor: 5, ocorridoHorasAtras: 390,
    descricao: 'Celular furtado da mão enquanto eu atendia uma ligação na calçada.',
  },
  {
    categoria: 'SEGURANCA', tipo: 'ASSALTO_ROUBO', rua: 'Rua do Arouche', bairro: 'República',
    lat: -23.5428, lng: -46.6428, afetados: 1, apoios: 4, criadaDiasAtras: 21, atividadeHorasAtras: 500,
    autor: 0, ocorridoHorasAtras: 506,
    descricao: 'Fui abordada na saída do trabalho. Relato feito depois, de outro aparelho.',
  },
  {
    categoria: 'SEGURANCA', tipo: 'LOCAL_MAL_ILUMINADO_ERMO', rua: 'Rua do Gasômetro', bairro: 'Brás',
    lat: -23.545, lng: -46.617, afetados: 1, apoios: 5, criadaDiasAtras: 4, atividadeHorasAtras: 96,
    autor: 6,
    descricao: 'Passagem sob o viaduto sem nenhuma iluminação. Muita gente passa por ali à noite.',
  },

  // ───────────── Riscos e infraestrutura (agrupamento no Jardim Ângela → Zona de atenção) ─────────────
  {
    categoria: 'RISCOS_INFRAESTRUTURA', tipo: 'RISCO_DESLIZAMENTO', rua: "Estrada do M'Boi Mirim", bairro: 'Jardim Ângela',
    lat: -23.692, lng: -46.773, afetados: 28, apoios: 17, criadaDiasAtras: 7, atividadeHorasAtras: 6,
    autor: 7, fotos: 2,
    descricao: 'Barranco atrás das casas com rachaduras grandes depois das chuvas. A terra já está cedendo.',
    comentarios: [
      { autor: 8, texto: 'A Defesa Civil veio e interditou duas casas.', horasAtras: 26 },
      { autor: 9, texto: 'Choveu de novo e desceu mais terra essa madrugada.', horasAtras: 6 },
    ],
  },
  {
    categoria: 'RISCOS_INFRAESTRUTURA', tipo: 'RISCO_DESLIZAMENTO', rua: 'Rua Agamenon Pereira da Silva', bairro: 'Jardim Ângela',
    lat: -23.6927, lng: -46.7738, afetados: 9, apoios: 5, criadaDiasAtras: 6, atividadeHorasAtras: 40,
    autor: 8,
    descricao: 'Muro de arrimo inclinado e com água minando por baixo.',
  },
  {
    categoria: 'RISCOS_INFRAESTRUTURA', tipo: 'ESTRUTURA_RISCO_QUEDA', rua: 'Rua Simão Caetano Nunes', bairro: 'Jardim Ângela',
    lat: -23.6914, lng: -46.7722, afetados: 4, apoios: 6, criadaDiasAtras: 10, atividadeHorasAtras: 110,
    autor: 9, fotos: 1,
    descricao: 'Casa abandonada com a laje cedendo sobre a viela onde passam os moradores.',
  },
  {
    categoria: 'RISCOS_INFRAESTRUTURA', tipo: 'CORREGO_TRANSBORDANDO', rua: 'Rua Abílio César', bairro: 'Jardim Ângela',
    lat: -23.6931, lng: -46.7725, afetados: 15, apoios: 8, criadaDiasAtras: 3, atividadeHorasAtras: 20,
    autor: 1,
    descricao: 'O córrego transborda a cada chuva forte e invade as casas da parte baixa.',
  },
  {
    categoria: 'RISCOS_INFRAESTRUTURA', tipo: 'RISCO_DESLIZAMENTO', rua: 'Rua Ângelo Tarchi', bairro: 'Jardim Ângela',
    lat: -23.6912, lng: -46.7741, afetados: 6, apoios: 3, criadaDiasAtras: 14, atividadeHorasAtras: 160,
    autor: 2,
    descricao: 'Encosta sem contenção em cima da escadaria. Pedras rolaram na última chuva.',
  },
  {
    categoria: 'RISCOS_INFRAESTRUTURA', tipo: 'TRECHO_PERIGOSO_PEDESTRES', rua: 'Avenida Deputado Cantídio Sampaio', bairro: 'Brasilândia',
    lat: -23.456, lng: -46.69, afetados: 21, apoios: 30, criadaDiasAtras: 18, atividadeHorasAtras: 12,
    autor: 3, demoApoio: true, fotos: 1,
    descricao: 'Trecho sem calçada e sem faixa de pedestres em frente à escola. As crianças atravessam entre os carros.',
    comentarios: [
      { autor: 5, texto: 'Já teve atropelamento ali neste ano.', horasAtras: 12 },
    ],
  },
  {
    categoria: 'RISCOS_INFRAESTRUTURA', tipo: 'CORREGO_TRANSBORDANDO', rua: 'Rua Doutor João Ribeiro', bairro: 'Penha',
    lat: -23.526, lng: -46.543, afetados: 2, apoios: 1, criadaDiasAtras: 1, atividadeHorasAtras: 22,
    autor: 0,
    descricao: 'Córrego com o nível muito alto e lixo acumulado na grade. Deve transbordar na próxima chuva.',
  },
];

/** Bairros de referência para o título quando a geocodificação reversa falha. */
export const BAIRROS_REFERENCIA: readonly { bairro: string; lat: number; lng: number }[] =
  OCORRENCIAS_SEMENTE.map(({ bairro, lat, lng }) => ({ bairro, lat, lng })).concat([
    { bairro: 'Sé', lat: -23.5503, lng: -46.6339 },
    { bairro: 'Bela Vista', lat: -23.559, lng: -46.647 },
    { bairro: 'Freguesia do Ó', lat: -23.501, lng: -46.699 },
    { bairro: 'Campo Limpo', lat: -23.648, lng: -46.758 },
    { bairro: 'Vila Prudente', lat: -23.583, lng: -46.581 },
    { bairro: 'Bom Retiro', lat: -23.529, lng: -46.64 },
    { bairro: 'Casa Verde', lat: -23.508, lng: -46.656 },
    { bairro: 'Jaçanã', lat: -23.464, lng: -46.58 },
    { bairro: 'Morumbi', lat: -23.6, lng: -46.72 },
    { bairro: 'Cambuci', lat: -23.565, lng: -46.62 },
  ]);
