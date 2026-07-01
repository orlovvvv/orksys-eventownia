export const landingPages = [
  {
    path: "/dmuchance-na-urodziny",
    title: "Dmuchance na urodziny",
    description: "Szybka ścieżka do zapytania o atrakcje urodzinowe z transparentną stawką godzinową.",
    categorySlug: "dmuchane-zjezdzalnie",
  },
  {
    path: "/dmuchance-na-komunie",
    title: "Dmuchance na komunie",
    description: "Atrakcje plenerowe na przyjęcia rodzinne, z ręcznym potwierdzeniem dostępności i warunków montażu.",
    categorySlug: "dmuchane-place-zabaw",
  },
  {
    path: "/dmuchance-na-festyny",
    title: "Dmuchance na festyny",
    description: "Zjeżdżalnie, place zabaw i tory rywalizacyjne dla szkół, gmin i organizatorów wydarzeń.",
    categorySlug: "tory-i-atrakcje",
  },
  {
    path: "/dmuchane-zjezdzalnie-wynajem",
    title: "Dmuchane zjeżdżalnie wynajem",
    description: "Katalog zjeżdżalni ze stawkami godzinowymi i dojazdem do potwierdzenia.",
    categorySlug: "dmuchane-zjezdzalnie",
  },
  {
    path: "/dmuchane-place-zabaw-wynajem",
    title: "Dmuchane place zabaw wynajem",
    description: "Place zabaw ze stawkami godzinowymi i operacyjną weryfikacją terminu.",
    categorySlug: "dmuchane-place-zabaw",
  },
  {
    path: "/namiot-imprezowy-wynajem",
    title: "Namiot imprezowy wynajem",
    description: "Nadmuchiwany namiot 9x6x4 m na dłuższe wydarzenia i przyjęcia.",
    categorySlug: "namioty-imprezowe",
  },
  {
    path: "/maszyna-do-waty-cukrowej-wynajem",
    title: "Maszyna do waty cukrowej wynajem",
    description: "Produkt gastronomiczny dostępny w makiecie ze stawką godzinową.",
    categorySlug: "maszyny-gastronomiczne",
  },
  {
    path: "/maszyna-do-popcornu-wynajem",
    title: "Maszyna do popcornu wynajem",
    description: "Maszyna do popcornu jako dodatek do wydarzeń rodzinnych i firmowych.",
    categorySlug: "maszyny-gastronomiczne",
  },
] as const;

export function getLandingPage(path: string) {
  return landingPages.find((page) => page.path === path);
}
