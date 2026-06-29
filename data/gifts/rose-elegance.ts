export type GiftItem = {
  id: string;
  name: string;
  category: "cozinha" | "casa" | "banho" | "noiva";
  status: "available" | "reserved";
  reservedBy?: string;
  timestamp?: string; // compatible with previous schema
  reservedAt?: string;

  // NEW FIELDS
  popularityScore?: number;
  emotionalTag?: string;
};

/** Medidas da noiva por peça íntima — referência para presentes físicos */
export type BrideIntimatePiece = {
  id: string;
  label: string;
  size: string;
  note?: string;
};

export const BRIDE_INTIMATE_PIECES: BrideIntimatePiece[] = [
  { id: "fantasia", label: "Fantasia", size: "M", note: "Jogos & surpresas" },
  { id: "lingerie", label: "Conjunto lingerie", size: "L", note: "Peça principal" },
  { id: "sutia", label: "Sutiã", size: "M" },
  { id: "calcinha", label: "Calcinha", size: "XL" },
  { id: "robe", label: "Robe", size: "M", note: "Getting ready" },
];

export const ROSE_ELEGANCE_GIFTS: GiftItem[] = [
  // Cozinha
  { id: "cozinha-colheres-silicone", name: "Jogo de colheres de silicone", category: "cozinha", status: "available", popularityScore: 3, emotionalTag: "Utensílio Essencial" },
  { id: "cozinha-caixa-cha", name: "Caixa para chá", category: "cozinha", status: "available", popularityScore: 4, emotionalTag: "Ritual & Aconchego" },
  { id: "cozinha-porta-guardanapos", name: "Porta guardanapos", category: "cozinha", status: "available", popularityScore: 2, emotionalTag: "Pormenores à Mesa" },
  { id: "cozinha-porta-rolo-guardanapo", name: "Porta rolo de guardanapo", category: "cozinha", status: "available", popularityScore: 2, emotionalTag: "Pormenores à Mesa" },
  { id: "cozinha-bandeja-redonda", name: "Bandeja de madeira redonda", category: "cozinha", status: "available", popularityScore: 5, emotionalTag: "Servir com Elegância" },
  { id: "cozinha-bandeja-quadrada", name: "Bandeja de madeira quadrada", category: "cozinha", status: "available", popularityScore: 5, emotionalTag: "Servir com Elegância" },
  { id: "cozinha-forma-pudim", name: "Forma de pudim redonda", category: "cozinha", status: "available", popularityScore: 3, emotionalTag: "Doces Momentos" },
  { id: "cozinha-forma-bolo-removivel", name: "Forma de bolo removível", category: "cozinha", status: "available", popularityScore: 3, emotionalTag: "Partilhas no Forno" },
  { id: "cozinha-forma-bolo-flor", name: "Forma de bolo formato flor", category: "cozinha", status: "available", popularityScore: 4, emotionalTag: "Charme & Receitas" },
  { id: "cozinha-galheteiros", name: "Galheteiros", category: "cozinha", status: "available", popularityScore: 4, emotionalTag: "Tempero & Sabor" },
  { id: "cozinha-cesto-geleira", name: "Cesto organizador para geleira", category: "cozinha", status: "available", popularityScore: 3, emotionalTag: "Ordem & Frescura" },
  { id: "cozinha-jogo-frascos", name: "Jogo de 3 frascos (chá, sal, açúcar)", category: "cozinha", status: "available", popularityScore: 5, emotionalTag: "Estilo & Praticidade" },
  { id: "cozinha-facas-tramontina", name: "Jogo de 3 facas Tramontina", category: "cozinha", status: "available", popularityScore: 4, emotionalTag: "Corte Preciso" },
  { id: "cozinha-garrafa-tampa", name: "Garrafa de vidro lisa com tampa", category: "cozinha", status: "available", popularityScore: 3, emotionalTag: "Hidratação Pura" },
  { id: "cozinha-pano-loica", name: "Pano de loiça", category: "cozinha", status: "available", popularityScore: 2, emotionalTag: "Conforto Diário" },
  { id: "cozinha-pano-mesa", name: "Pano de mesa", category: "cozinha", status: "available", popularityScore: 3, emotionalTag: "Acolhimento Familiar" },
  { id: "cozinha-tigela-caril", name: "Tigela de servir caril", category: "cozinha", status: "available", popularityScore: 4, emotionalTag: "Tradição & Mesa Cheia" },
  { id: "cozinha-rolo-massa", name: "Rolo de massa", category: "cozinha", status: "available", popularityScore: 3, emotionalTag: "Cozinha Artesanal" },
  { id: "cozinha-colher-sorvete", name: "Colher de sorvete", category: "cozinha", status: "available", popularityScore: 2, emotionalTag: "Refrescos Doces" },
  { id: "cozinha-porta-gelo", name: "Porta gelo", category: "cozinha", status: "available", popularityScore: 3, emotionalTag: "Brindes & Reuniões" },
  { id: "cozinha-espatula-gelo", name: "Espátula de gelo", category: "cozinha", status: "available", popularityScore: 2, emotionalTag: "Brindes & Reuniões" },
];
