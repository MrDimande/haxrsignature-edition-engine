export const NEIDY_JOSE_CONSTANTS = {
  brideName: "Neidy Marino",
  groomName: "José Cabral",
  coupleTitle: "Neidy Marino e José Cabral",
  eventDateIso: "2026-12-05",
  eventDateFormatted: "5 de Dezembro de 2026",
  /** Civil ceremony start */
  eventDateTimeIso: "2026-12-05T13:00:00+02:00",
  rsvpDeadlineIso: "2026-11-05",
  rsvpDeadlineFormatted: "5 de Novembro de 2026",
  hero: {
    eyebrow: "Aos que amamos",
    editorialLine1: "O dia em que o amor",
    editorialLine2: "se torna aliança",
    dateSeal: "05 · XII · 2026",
    imageMobile: "/images/neidy-jose/couple-hero-mobile.png",
    imageDesktop: "/images/neidy-jose/couple-hero-desktop.png",
    monogram: "/images/neidy-jose/monogram-nj-transparent.png",
  },
  ourThread: {
    eyebrow: "Prólogo",
    title: "O nosso fio",
    subtitle: "Quatro virtudes. Um só destino. O amor, a tecer.",
    closingWhisper: "E com a bênção de quem nos deu a vida, seguimos.",
    beats: [
      {
        id: "fe",
        numeral: "I",
        title: "Fé",
        line: "A luz que nos guia quando o caminho ainda não se vê.",
        video: "/videos/neidy-jose/thread-fe.mp4",
        imageObjectPosition: "center 38%",
      },
      {
        id: "amor",
        numeral: "II",
        title: "Amor",
        line: "O fogo quieto que transforma dois em um só destino.",
        image: "/images/neidy-jose/thread-encontro.png",
        imageObjectPosition: "center 42%",
      },
      {
        id: "vitoria",
        numeral: "III",
        title: "Vitória",
        line: "Não a do triunfo fácil — a de permanecer, juntos.",
        image: "/images/neidy-jose/thread-vitoria.jpg",
        /** Enquadra a Vitória e o irmão no terço inferior da placa 3:4 */
        imageObjectPosition: "center 58%",
      },
      {
        id: "alianca",
        numeral: "IV",
        title: "Aliança",
        line: "O nó que o tempo não desfaz. O sim eterno.",
        image: "/images/neidy-jose/thread-alianca.png",
        imageObjectPosition: "center 48%",
      },
    ],
  },
  blessing: {
    eyebrow: "Com a bênção de Deus",
    title: "e de quem nos deu a vida",
    brideHouse: "Família Marino",
    groomHouse: "Família Mateus",
  },
  scriptureReference: "Colossenses 3:14",
  scriptureTheme: "O Vínculo da Perfeição",
  scriptureFullVerse:
    "E, acima de tudo, tenham amor, pois o amor une perfeitamente todas as coisas.",
  scriptureContext:
    "A união de duas almas sob a graça divina. Tecida pela Fé inabalável, sustentada pela Vitória da perseverança e selada eternamente pelo Amor.",
  triad: [
    {
      title: "Fé",
      description: "O alicerce inabalável da nossa aliança.",
      icon: "cross",
    },
    {
      title: "Vitória",
      description: "O triunfo do propósito de Deus nas nossas vidas.",
      icon: "shield",
    },
    {
      title: "Amor",
      description: "O vínculo que une os nossos corações para sempre.",
      icon: "heart",
    },
  ] as const,
  parents: {
    bride: {
      father: "Augusto Baptista Marino",
      mother: "Umaia Fluce Abdula",
    },
    groom: {
      father: "José Manuel Mateus",
      mother: "Maria Angélica Cabral",
    },
  },
  itinerary: [
    {
      step: "01",
      time: "13:00",
      title: "Cerimónia Civil",
      locationName: "Espaço Águia",
      address: "Marracuene, Moçambique",
      description: "Celebração civil do matrimónio perante família e amigos.",
      mapsUrl:
        "https://www.google.com/maps/place/Eventos+%26+Acomoda%C3%A7%C3%A3o+%C3%81guia/@-25.7417945,32.6487008,17z",
    },
    {
      step: "02",
      time: "A seguir",
      title: "Sessão de Fotografias",
      locationName: "Espaço Águia",
      address: "Marracuene, Moçambique",
      description: "Retratos do casal e da família — a memória do dia a ser tecida.",
      mapsUrl:
        "https://www.google.com/maps/place/Eventos+%26+Acomoda%C3%A7%C3%A3o+%C3%81guia/@-25.7417945,32.6487008,17z",
    },
    {
      step: "03",
      time: "15:00",
      title: "Copo de Água",
      locationName: "Espaço Águia",
      address: "Marracuene, Moçambique",
      description: "Brinde, mesa partilhada e celebração do nosso sim.",
      mapsUrl:
        "https://www.google.com/maps/place/Eventos+%26+Acomoda%C3%A7%C3%A3o+%C3%81guia/@-25.7417945,32.6487008,17z",
    },
  ],
  locations: {
    venue: {
      name: "Espaço Águia",
      city: "Marracuene",
      country: "Moçambique",
      mapsUrl:
        "https://www.google.com/maps/place/Eventos+%26+Acomoda%C3%A7%C3%A3o+%C3%81guia/@-25.7417945,32.6487008,17z",
    },
  },
  dressCode: {
    title: "Traje de Gala",
    subtitle: "Black Tie / Solenidade & Elegância",
    description:
      "Convidamos os nossos distintos convidados a celebrarem connosco em traje de gala solene. Para as senhoras, vestidos longos e nobres. Para os cavalheiros, fato escuro ou smoking clássico.",
    colors: [
      { name: "Verde Esmeralda", hex: "#0A211A" },
      { name: "Verde Pinho Nobre", hex: "#2D5A4C" },
      { name: "Dourado Antigo", hex: "#CBB994" },
      { name: "Marfim Cerimonial", hex: "#F5F7F4" },
      { name: "Preto Solene", hex: "#1A1A1A" },
    ],
  },
  audio: {
    title: "Die With A Smile",
    artist: "Lady Gaga & Bruno Mars",
    src: "/audio/die-with-a-smile-lady-gaga-bruno-mars.mp3",
    rightsHolder: "Interscope Records · Streamline · Lady Gaga & Bruno Mars",
    disclaimer:
      "Música de ambiente no convite digital. Todos os direitos da obra pertencem aos respectivos autores e titulares. HAXR Signature não detém nem reivindica qualquer direito sobre este conteúdo musical.",
  },
  whatsappContact: "+258840000000",
} as const;

export function buildGoogleCalendarUrl(): string {
  const title = encodeURIComponent(`Casamento: ${NEIDY_JOSE_CONSTANTS.coupleTitle}`);
  const details = encodeURIComponent(
    "Celebração do Matrimónio de Neidy Marino e José Cabral.\n\n" +
      "13:00 - Cerimónia Civil · Espaço Águia\n" +
      "Após o Civil - Sessão de Fotografias · Espaço Águia\n" +
      "15:00 - Copo de Água · Espaço Águia\n\n" +
      "Dress Code: Traje de Gala\n" +
      "O Vínculo da Perfeição · Colossenses 3:14"
  );
  const location = encodeURIComponent("Espaço Águia, Marracuene, Moçambique");
  /** 13:00 CAT = 11:00 UTC */
  const dates = "20261205T110000Z/20261205T200000Z";

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

export function downloadWeddingIcsFile(): void {
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HAXR Signature//Neidy & Jose Wedding//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:wedding-neidy-jose-20261205@haxrsignature.com",
    "DTSTAMP:20261205T110000Z",
    "DTSTART:20261205T110000Z",
    "DTEND:20261205T200000Z",
    "SUMMARY:Casamento: Neidy Marino e José Cabral",
    "DESCRIPTION:Celebração do Matrimónio de Neidy Marino e José Cabral.\\n\\n13:00 - Cerimónia Civil · Espaço Águia\\nApós o Civil - Sessão de Fotografias · Espaço Águia\\n15:00 - Copo de Água · Espaço Águia\\n\\nDress Code: Traje de Gala\\nColossenses 3:14",
    "LOCATION:Espaço Águia, Marracuene, Moçambique",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "casamento-neidy-e-jose.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
