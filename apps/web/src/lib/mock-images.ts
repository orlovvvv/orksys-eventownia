type ProductAsset = {
  publicUrl: string | null;
  altTextPl: string;
  isPrimary: boolean;
};

type ProductMedia = {
  slug: string;
  sku: string;
  namePl: string;
  visualTone: string;
  category?: { slug: string; namePl: string } | null;
  assets?: ProductAsset[] | null;
  requiresPower?: boolean;
  setupMinutes?: number;
  teardownMinutes?: number;
  inventoryCount?: number;
};

export type MockImage = {
  src: string;
  alt: string;
};

export const toneGradients: Record<string, string> = {
  amber: "linear-gradient(135deg, #f59e0b, #fef3c7)",
  blue: "linear-gradient(135deg, #2563eb, #dbeafe)",
  cyan: "linear-gradient(135deg, #0891b2, #cffafe)",
  emerald: "linear-gradient(135deg, #059669, #d1fae5)",
  indigo: "linear-gradient(135deg, #4f46e5, #e0e7ff)",
  lime: "linear-gradient(135deg, #65a30d, #ecfccb)",
  neutral: "linear-gradient(135deg, #525252, #f5f5f5)",
  orange: "linear-gradient(135deg, #ea580c, #fed7aa)",
  pink: "linear-gradient(135deg, #db2777, #fce7f3)",
  red: "linear-gradient(135deg, #dc2626, #fee2e2)",
  rose: "linear-gradient(135deg, #e11d48, #ffe4e6)",
  sky: "linear-gradient(135deg, #0284c7, #e0f2fe)",
  slate: "linear-gradient(135deg, #475569, #e2e8f0)",
  stone: "linear-gradient(135deg, #57534e, #e7e5e4)",
  teal: "linear-gradient(135deg, #0d9488, #ccfbf1)",
  violet: "linear-gradient(135deg, #7c3aed, #ede9fe)",
  yellow: "linear-gradient(135deg, #ca8a04, #fef9c3)",
  zinc: "linear-gradient(135deg, #3f3f46, #e4e4e7)",
};

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBmSOKx7L41IJzoehqUgu7wrkZLEJHDH6yF1JM5vZL50PHRiHs7I1Hla8sxmfXmsfzPSUsSxksn5qWOHqt-zb4idBfxrgNi9ngmRnEeRVMR6JjeqZcC1bEoUYadKBLMoYGHP8v4xmVtzEpk4UimFKxzVWTSSo5R2bjsbjzXRjsqzMSqImc8FKxlVxqyHAQYORmJqZsXqP8Cg86xjR_aMG5n_hUG3MGmorGCVXUI2yFd0ecCxWRyC3u7yfWiVKL5I-sHKT15OzzVNgZ0";

const categoryImages: Record<string, MockImage> = {
  "dmuchane-zjezdzalnie": {
    alt: "Dmuchana zjezdzalnia na zielonej przestrzeni",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlJlh87HCkS2JwexiYsdJHdHXxX81alLY0kSTTUUWD9kPVNN7_GcrzRs97ybTVC6yT9FYIIKIw96JnVBxSiEx7lXM-MAT6eaDEpJL-4jtZUhqlRlxjqP5roILNm10esFikhjtgSgFQ4VRksKveNmJXFwFsHpwan-54jbBivipacBSDb-ZvLexBLm0kyOeQskQ8cq70cHRvU9DxF1mrEb6IupDm4n23BV5qFkaNZ_VPd0ziHDEG_EZTVO_aLJBCeWOIy6KJK0j4jdI8",
  },
  "dmuchane-place-zabaw": {
    alt: "Kolorowy dmuchany plac zabaw w parku",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWpjm3HtUKGCy8OmDWBUkwfqH73IEnAT07nmge721EIVpEoJ-IF56kOtORyIJIF5efozs1HnIusy3XJC4VCINU-u2j93QxCDwxBQE1H7-oT71-9KlvxT3L9d71Gnza_kJHO_eZD__tIsEJHKt23FwFCDnLAzTGnB9UhTlS7Bi8RW6tat03YjoqOOGWa1_wI45HMFmQHZM1ktTkWu2YuCPTTUX1ULYKhUttVcdLtwMaaqTK-pgIcf5-HgBwdfPBPvtSxDEApZ7EXL3D",
  },
  "tory-i-atrakcje": {
    alt: "Dmuchany tor przeszkod na plenerowej imprezie",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOOExt2z6JmbMIxPtnLXdU5tD84TBMrrrh9fyBRtoU7btCUv5p5wIKNGfGFLCtBRb8vG8f2JyvYAbUEQhT3ck6g5ezAIJGWgG_ybJ_5jU9lngxzs6jrG4XMNCdIxpwcKVcCE0zFPcYK0342aZbOpvV6CLDQpOlJYVgHeejRMi5ALhYGyV8TGVLYYbuZxLdF8Xq-hlHu8gfpgozdWJM2PXslFVsB3FKU8hoV_Xlr7u-EUwi9rQvjM1TuJREAYk9VEpBxzdna0WY1vIt",
  },
  "namioty-imprezowe": {
    alt: "Elegancka plenerowa strefa eventowa",
    src: heroImage,
  },
  "maszyny-gastronomiczne": {
    alt: "Profesjonalne wyposazenie gastronomiczne na wydarzenie",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCtX94v4oSVwi5vJmPxjVkvZW3hiEfdc98J3UJD82WbU87gHRPl6Wkmhf1AFR9UJxVA7HiBaXnC-8KKJ_JRG3QGIx6e2bWIMQQheBVGzZyYO5UJoEJ0egrv5p9WTp3i0tnq4xGq0YDro0XChQvjPYTCYG1JL9FR0fD_Vgncms_eF6FAVsLGswJbSzS95QrP3kBh06HehVxCxrYQ-A2Dtng5rqaODiDM_JLbX7mfDgnL-Pb7XOjz_3nLdKtLde3ydMlFATlkE3-Qmv8x",
  },
  dodatki: {
    alt: "Dodatkowy sprzet eventowy",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCxRUI5rjabKtRTol3-upOC6a7Bz2tC6iNQ_MAtKl0OcbmmRyKgS4-lYl03wVEon1gslzZWBpZNDPBeJf18Jn6mgsUkHnv-5cah2kcFs3_rzIFcggqDZNyjWTrRC0cLHyFk5BUckBF9TKqX4mnoaexd1u9lrMTElTi1pha3IpVIktHbUGOqd33XQzcw9pIWiuD60IpmrgIkk0McMEMzNI3TpQKHQGBNloSYH7mjbywFrfudnN8iLBzNUawUYM6P9jCSQa8btRS1EJih",
  },
};

const productImages: Record<string, MockImage> = {
  "dmuchana-zjezdzalnia-dinozaur": {
    alt: "Dmuchana Zjezdzalnia Dinozaur",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTdzkTkXAPi9e2Zn1U69No_k9hb6weuz9vw6VWjEjD2NI9Js0bPNZsnvrmqZxL6bp19VbSyCyTX6WNTOXxl_DLSfB22CE5NcZmPeLjL9ctwHBzRVkv1uWjFD6xOFx71Mv5cVbtv7ZWSoS726khI3mra1iEImgS7W7qBHjsf842HFfg10cEucrNoT6ttXEmqX5-OtXs6eJ-zB4fV3p9qnJJt8WsuIooPh5Y9-F0NPL3tnNxJ8sKhqu19okkzusKlgYrsmCf5NE1PRIV",
  },
  "dmuchane-bigballers-pirackie": categoryImages["tory-i-atrakcje"],
};

const galleryImages: MockImage[] = [
  {
    alt: "Detal powierzchni dmuchanca",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP6uI86ilnlcF19OK2Mvo02YMMI9eIs32aHAAu7vprKrl2n0mp9Wr8RvwWIQLdV7PZJ6uvMacvJHLQz_kmQLy9mr-hxWs5ef4DsnEaf-4kLRlqdUHnbIsj82agVdjxqiXWb9F7otnQYTyFsr5WGVf7AcLPLmcevVE0ds5-pLscKm53A4yU9gLw_nO0mhqFwlaToVZAgZItVvy7OTBnNi8ghnPauvkpOrdRrgYWAAY8tNHOwqrOgYBBmTUwv0Um72xhyOgk5afhs4bT",
  },
  {
    alt: "Dmuchany zestaw na otwartej przestrzeni",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXB-N01c-v2FvAKSLlcGnMOsrPEbjkTfi6OGd3nYSZV4FbWo1f6l5lWcKOOUUojZC3_PkMYPkSkjmRJDcx0Bg83euAPRpSSaNS0IYgckJF6RsQAm9gSHaNJbw3APeuodVEqIeeC8huNwg-4jLKTOPR82bMFgLUQl7G-rRo2kqgXCOO93LXdx6xDAHZgghn_EWxgnBKyXBN7IQi2cMFWDLGlmZQRUwh_Gs6zU8MYsl5Xo44ePML_lg-dgU6Gi2WSIWr56ygIXVBjYLv",
  },
  {
    alt: "Dzieci bawiace sie na dmuchanej atrakcji",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuc5CbnPCSigOJJiFdnG-NagmEWiz1yQSCrm05AuHieJqVl4lKT59N9vqOs5dtM7gJiiFnm3sUnLhY90GqAVfnQy9QOWm13ZwASXN6s913tra1vTzVUpjtMirURwlcBV9Xyd0qwqyZoP3CN5s15pf-p7JNNIsEuoaj1DAIsE7u-yRCNyS1lNyBJAuTIyp8TP2jajE3t34lnzXS-6buy07RGFHKF3ak3mepmVz2tVV87koo4dpvUPLobJEPBm7uOBCrUknvj-xkC31t",
  },
];

function primaryAsset(product: ProductMedia) {
  return product.assets?.find((asset) => asset.publicUrl && asset.isPrimary) ?? product.assets?.find((asset) => asset.publicUrl);
}

export function getHeroImage(): MockImage {
  return {
    alt: "Profesjonalnie przygotowana przestrzen eventowa",
    src: heroImage,
  };
}

export function getCategoryImage(categorySlug: string): MockImage {
  return categoryImages[categorySlug] ?? categoryImages["dmuchane-zjezdzalnie"];
}

export function getProductImage(product: ProductMedia): MockImage {
  const asset = primaryAsset(product);
  if (asset?.publicUrl) {
    return { src: asset.publicUrl, alt: asset.altTextPl };
  }
  return productImages[product.slug] ?? getCategoryImage(product.category?.slug ?? "");
}

export function getProductGallery(product: ProductMedia): MockImage[] {
  const assets =
    product.assets
      ?.filter((asset) => asset.publicUrl)
      .map((asset) => ({ src: asset.publicUrl as string, alt: asset.altTextPl })) ?? [];
  if (assets.length > 0) return assets;
  return [getProductImage(product), ...galleryImages].slice(0, 4);
}

export function getProductFallbackGradient(product: Pick<ProductMedia, "visualTone">) {
  return toneGradients[product.visualTone] ?? toneGradients.neutral;
}

export function getProductSpecs(product: ProductMedia) {
  const isSlide = product.category?.slug === "dmuchane-zjezdzalnie";
  return [
    { label: "Wymiary", value: isSlide ? "8m x 4m x 6m" : "do potwierdzenia" },
    { label: "Zasilanie", value: product.requiresPower ? "230V / 1.5 kW" : "niewymagane" },
    { label: "Obsługa", value: product.inventoryCount && product.inventoryCount > 1 ? `${product.inventoryCount} szt.` : "1 zestaw" },
    { label: "Montaż", value: `${product.setupMinutes ?? 45} / ${product.teardownMinutes ?? 45} min` },
  ];
}

export function getProductHighlights(product: ProductMedia) {
  return [
    "Certyfikat bezpieczeństwa EN 14960",
    product.requiresPower ? "Dostęp do prądu potwierdzany przed realizacją" : "Bez zasilania po stronie klienta",
    "Montaż i demontaż w cenie usługi",
  ];
}

export const recommendedAddons = [
  { name: "Agregat prądotwórczy", price: "+ 150 PLN", image: categoryImages.dodatki },
  { name: "Przedłużacz 50m", price: "+ 30 PLN", image: null },
  { name: "Animator / Obsługa", price: "+ 300 PLN", image: null },
];
