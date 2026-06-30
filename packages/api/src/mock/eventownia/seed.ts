import type {
  AdminUser,
  AvailabilityBlock,
  Booking,
  BookingItem,
  BusinessSettings,
  Category,
  FeatureFlag,
  LegalDocument,
  MockState,
  Payment,
  PriceRule,
  Product,
  ProductAsset,
} from "./types";

const createdAt = "2026-06-01T10:00:00.000Z";

const categories: Category[] = [
  {
    id: "cat_slides",
    slug: "dmuchane-zjezdzalnie",
    namePl: "Dmuchane zjeżdżalnie",
    descriptionPl: "Duże, kolorowe zjeżdżalnie na urodziny, festyny i pikniki rodzinne.",
    sortOrder: 10,
    active: true,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "cat_playgrounds",
    slug: "dmuchane-place-zabaw",
    namePl: "Dmuchane place zabaw",
    descriptionPl: "Samodzielne place zabaw z przeszkodami i bezpieczną strefą zabawy.",
    sortOrder: 20,
    active: true,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "cat_tracks",
    slug: "tory-i-atrakcje",
    namePl: "Tory i atrakcje rywalizacyjne",
    descriptionPl: "Atrakcje do rywalizacji zespołowej i aktywnych stref eventowych.",
    sortOrder: 30,
    active: true,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "cat_tents",
    slug: "namioty-imprezowe",
    namePl: "Namioty imprezowe",
    descriptionPl: "Nadmuchiwany namiot eventowy z opcjonalnym nagłośnieniem i efektami.",
    sortOrder: 40,
    active: true,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "cat_machines",
    slug: "maszyny-gastronomiczne",
    namePl: "Maszyny gastronomiczne",
    descriptionPl: "Maszyny do waty cukrowej i popcornu jako uzupełnienie atrakcji.",
    sortOrder: 50,
    active: true,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "cat_addons",
    slug: "dodatki",
    namePl: "Dodatki",
    descriptionPl: "Zorby, Bumper Ball i dodatki imprezowe wyceniane razem z rezerwacją.",
    sortOrder: 60,
    active: true,
    createdAt,
    updatedAt: createdAt,
  },
];

const productInput = [
  ["prod_slide_dinozaur", "cat_slides", "SLIDE_DINOZAUR", "dmuchana-zjezdzalnia-dinozaur", "Dmuchana Zjeżdżalnia Dinozaur", "Motyw dinozaurów, szybki montaż, świetna na urodziny i festyny.", "rental_product", "emerald"],
  ["prod_slide_baobaby", "cat_slides", "SLIDE_BAOBABY", "dmuchana-zjezdzalnia-baobaby", "Dmuchana Zjeżdżalnia Baobaby", "Wysoka zjeżdżalnia z tropikalnym charakterem i dużą widocznością.", "rental_product", "lime"],
  ["prod_slide_myszka", "cat_slides", "SLIDE_MYSZKA", "dmuchana-zjezdzalnia-myszka", "Dmuchana Zjeżdżalnia Myszka", "Przyjazna zjeżdżalnia dla młodszych dzieci i kameralnych wydarzeń.", "rental_product", "rose"],
  ["prod_play_morski", "cat_playgrounds", "PLAY_MORSKI", "dmuchany-plac-zabaw-morski", "Dmuchany Plac Zabaw Morski", "Plac zabaw z morskim motywem, przeszkodami i strefą skakania.", "rental_product", "cyan"],
  ["prod_play_potworki", "cat_playgrounds", "PLAY_POTWORKI", "dmuchany-plac-zabaw-potworki", "Dmuchany Plac Zabaw Potworki", "Kolorowy plac zabaw z charakterystyczną grafiką i miękkimi przeszkodami.", "rental_product", "violet"],
  ["prod_play_pieski", "cat_playgrounds", "PLAY_PIESKI", "dmuchany-plac-zabaw-pieski", "Dmuchany Plac Zabaw Pieski", "Lekka, rodzinna atrakcja dla przedszkoli, urodzin i pikników.", "rental_product", "amber"],
  ["prod_track_bigballers", "cat_tracks", "TRACK_BIGBALLERS_PIRACKA", "dmuchane-bigballers-pirackie", "Dmuchane Bigballers, grafika piracka", "Rywalizacyjny tor z dużymi piłkami i pirackim motywem.", "rental_product", "sky"],
  ["prod_track_kanapa", "cat_tracks", "TRACK_KANAPA", "kanapa", "Kanapa", "Atrakcja rywalizacyjna do aktywnych stref firmowych i festynowych.", "rental_product", "orange"],
  ["prod_track_torowisko", "cat_tracks", "TRACK_TOROWISKO", "torowisko", "Torowisko", "Tor przeszkód do zawodów, pikników rodzinnych i imprez plenerowych.", "rental_product", "slate"],
  ["prod_play_lilytoys", "cat_playgrounds", "PLAY_LILYTOYS_IMPORTED", "lilytoys-indoor-outdoor-inflatable-playground", "Lilytoys Indoor/Outdoor Inflatable Playground", "Produkt importowany do ręcznej weryfikacji przed finalną ofertą.", "rental_product", "teal"],
  ["prod_machine_cotton", "cat_machines", "MACHINE_COTTON_CANDY_VEVOR", "maszyna-do-waty-cukrowej-vevor", "Maszyna do waty cukrowej VEVOR", "Maszyna gastronomiczna z ceną do potwierdzenia przez obsługę.", "rental_product", "pink"],
  ["prod_machine_popcorn", "cat_machines", "MACHINE_POPCORN_VEVOR", "maszyna-do-popcornu-vevor", "Maszyna do popcornu VEVOR", "Maszyna do popcornu jako dodatek do wydarzeń rodzinnych i firmowych.", "rental_product", "yellow"],
  ["prod_tent_vevor", "cat_tents", "TENT_INFLATABLE_9X6X4_VEVOR", "nadmuchiwany-namiot-imprezowy-9x6x4", "Nadmuchiwany namiot imprezowy 9x6x4 m", "Namiot eventowy na dłuższy wynajem z opcjonalnymi efektami.", "rental_product", "stone"],
  ["prod_addon_zorb", "cat_addons", "ADDON_ZORB_TPU", "kula-zorb-tpu-premium", "Kula Zorb TPU Premium", "Dodatek rozliczany za sztukę, zwykle zamawiany razem z główną atrakcją.", "addon", "blue"],
  ["prod_addon_bumper", "cat_addons", "ADDON_BUMPER_BALL_TPU", "bumper-ball-tpu-premium", "Bumper Ball TPU Premium", "Bumper Ball do rywalizacji grupowej, rozliczany za sztukę.", "addon", "red"],
  ["prod_extra_disco", "cat_addons", "EXTRA_DISCO_BALL", "kula-dyskotekowa", "Kula dyskotekowa", "Dodatek imprezowy wyceniany indywidualnie.", "manual_quote_extra", "zinc"],
  ["prod_extra_sound", "cat_addons", "EXTRA_SOUND_SYSTEM", "naglosnienie", "Nagłośnienie", "Nagłośnienie eventowe wyceniane po potwierdzeniu skali wydarzenia.", "manual_quote_extra", "neutral"],
  ["prod_extra_smoke", "cat_addons", "EXTRA_ARTIFICIAL_SMOKE", "sztuczny-dym", "Sztuczny dym", "Efekt specjalny do namiotu lub strefy imprezowej, cena do ustalenia.", "manual_quote_extra", "indigo"],
] as const;

const products: Product[] = productInput.map(
  ([id, categoryId, sku, slug, namePl, shortDescriptionPl, productType, visualTone], index) => ({
    id,
    categoryId,
    sku,
    slug,
    namePl,
    shortDescriptionPl,
    longDescriptionPl: `${shortDescriptionPl} Dostępność, powierzchnia montażu, dojazd oraz obsługa są potwierdzane ręcznie przed rezerwacją.`,
    supplierUrl: `internal://${sku.toLowerCase()}`,
    productType,
    active: true,
    publicVisible: true,
    requiresPower: !sku.startsWith("ADDON_") && !sku.startsWith("EXTRA_"),
    requiresOperator: productType !== "manual_quote_extra",
    setupMinutes: categoryId === "cat_tents" ? 90 : 45,
    teardownMinutes: categoryId === "cat_tents" ? 90 : 45,
    cleaningBufferMinutes: productType === "addon" ? 15 : 30,
    inventoryCount: productType === "addon" ? 8 : 1,
    sortOrder: (index + 1) * 10,
    visualTone,
    createdAt,
    updatedAt: createdAt,
  }),
);

const automaticPrice = (productId: string, basePriceGrosz: number, baseHours: number): PriceRule => ({
  id: `price_${productId}`,
  productId,
  quoteMode: "automatic",
  unitMode: "per_booking",
  currency: "PLN",
  basePriceGrosz,
  baseHours,
  extraHourPercent: 20,
  depositMode: "fixed",
  depositAmountGrosz: 30000,
  depositPercent: null,
  active: true,
  createdAt,
  updatedAt: createdAt,
});

const manualPrice = (productId: string): PriceRule => ({
  id: `price_${productId}`,
  productId,
  quoteMode: "manual",
  unitMode: "manual_quote",
  currency: "PLN",
  basePriceGrosz: null,
  baseHours: null,
  extraHourPercent: 20,
  depositMode: "none",
  depositAmountGrosz: null,
  depositPercent: null,
  active: true,
  createdAt,
  updatedAt: createdAt,
});

const priceRules: PriceRule[] = products.map((product) => {
  if (product.categoryId === "cat_slides") return automaticPrice(product.id, 80000, 5);
  if (product.categoryId === "cat_playgrounds") return automaticPrice(product.id, 100000, 5);
  if (product.categoryId === "cat_tracks") return automaticPrice(product.id, 50000, 5);
  if (product.categoryId === "cat_tents") return automaticPrice(product.id, 150000, 14);
  if (product.sku === "ADDON_ZORB_TPU") return automaticPrice(product.id, 30000, 5);
  if (product.sku === "ADDON_BUMPER_BALL_TPU") return automaticPrice(product.id, 10000, 5);
  return manualPrice(product.id);
});

const productAssets: ProductAsset[] = products.map((product) => ({
  id: `asset_${product.id}`,
  productId: product.id,
  r2Key: `mock/products/${product.slug}/primary.webp`,
  publicUrl: null,
  altTextPl: product.namePl,
  mediaType: "image",
  licenseStatus: "illustrative",
  isPrimary: true,
  sortOrder: 10,
  createdAt,
  updatedAt: createdAt,
}));

const adminUsers: AdminUser[] = [
  {
    id: "admin_mock_owner",
    email: "admin@dmuchance.lomza.pl",
    name: "Mock Admin",
    role: "owner",
    active: true,
    createdAt,
    updatedAt: createdAt,
  },
];

const availabilityBlocks: AvailabilityBlock[] = [
  {
    id: "block_global_demo",
    productId: null,
    startsAt: "2026-06-10T00:00:00.000Z",
    endsAt: "2026-06-10T23:59:59.000Z",
    reasonType: "blackout",
    reason: "Przykładowy globalny blackout na potrzeby makiety.",
    createdByAdminId: "admin_mock_owner",
    createdAt,
    updatedAt: createdAt,
  },
];

const bookings: Booking[] = [
  {
    id: "book_demo_paid",
    rentalRequestId: null,
    publicToken: "btok_demo_paid_status",
    status: "confirmed_deposit_paid",
    customerId: "cust_demo_company",
    locationId: "loc_demo_company",
    eventStartAt: "2026-06-20T10:00:00.000Z",
    eventEndAt: "2026-06-20T15:00:00.000Z",
    setupStartAt: "2026-06-20T09:15:00.000Z",
    teardownEndAt: "2026-06-20T16:15:00.000Z",
    durationHours: 5,
    currency: "PLN",
    subtotalGrosz: 100000,
    travelFeeGrosz: 12000,
    discountGrosz: 0,
    totalGrosz: 112000,
    depositRequiredGrosz: 30000,
    confirmedAt: "2026-06-01T11:00:00.000Z",
    expiresAt: null,
    adminNotes: "Demo: potwierdzone wydarzenie firmowe.",
    customerNotes: "Prośba o montaż przed 11:00.",
    createdByAdminId: "admin_mock_owner",
    generatedContractId: null,
    createdAt,
    updatedAt: createdAt,
  },
];

const bookingItems: BookingItem[] = [
  {
    id: "book_item_demo_paid",
    bookingId: "book_demo_paid",
    productId: "prod_play_morski",
    quantity: 1,
    unitPriceGrosz: 100000,
    extraHours: 0,
    lineTotalGrosz: 100000,
    createdAt,
    updatedAt: createdAt,
  },
];

const payments: Payment[] = [
  {
    id: "pay_demo_paid",
    bookingId: "book_demo_paid",
    provider: "stripe",
    purpose: "deposit",
    status: "paid",
    amountGrosz: 30000,
    currency: "PLN",
    providerSessionId: "cs_mock_paid",
    providerPaymentIntentId: "pi_mock_paid",
    checkoutUrl: "https://checkout.stripe.com/mock/cs_mock_paid",
    expiresAt: null,
    paidAt: "2026-06-01T11:30:00.000Z",
    refundedAt: null,
    createdAt,
    updatedAt: createdAt,
  },
];

const featureFlagTuples = [
  ["online_payments_enabled", false, "Enable online checkout links"],
  ["deposit_required_enabled", false, "Require deposit after admin confirmation"],
  ["instant_booking_enabled", false, "Allow customers to book without admin review"],
  ["manual_travel_quote_enabled", true, "Admin confirms travel fee manually"],
  ["auto_travel_quote_enabled", false, "Enable distance/zone travel calculation"],
  ["turnstile_required_public_forms", true, "Require Turnstile on public forms"],
  ["customer_booking_status_page_enabled", true, "Enable tokenized public status pages"],
  ["sms_notifications_enabled", false, "Enable SMS notification sending"],
  ["food_machines_public_enabled", true, "Show manual-quote food machines publicly"],
  ["supplier_url_visible_publicly", false, "Hide supplier URLs on public pages"],
] satisfies Array<[string, boolean, string]>;

const featureFlags: FeatureFlag[] = featureFlagTuples.map(([key, enabled, description]) => ({
  key,
  enabled,
  valueJson: null,
  description,
  updatedByAdminId: "admin_mock_owner",
  updatedAt: createdAt,
}));

const legalDocuments: LegalDocument[] = [
  {
    id: "legal_terms_v1",
    type: "terms",
    version: "mock-1",
    locale: "pl-PL",
    title: "Regulamin wynajmu - wersja robocza",
    bodyMd:
      "Makietowy regulamin opisuje zapytanie o wynajem, ręczne potwierdzenie dostępności, zaliczkę po potwierdzeniu oraz zasady anulowania.",
    active: true,
    publishedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "legal_privacy_v1",
    type: "privacy",
    version: "mock-1",
    locale: "pl-PL",
    title: "Polityka prywatności - wersja robocza",
    bodyMd:
      "Makietowa polityka prywatności zbiera tylko dane potrzebne do obsługi zapytania: imię, telefon, e-mail, adres wydarzenia i notatki operacyjne.",
    active: true,
    publishedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "legal_cookies_v1",
    type: "cookies",
    version: "mock-1",
    locale: "pl-PL",
    title: "Polityka cookies - wersja robocza",
    bodyMd:
      "Makieta zakłada wyłącznie niezbędne ciasteczka techniczne. Analityka i marketing pozostają poza zakresem tej implementacji.",
    active: true,
    publishedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  },
];

const businessSettings: BusinessSettings = {
  businessName: "Dmuchańce Łomża",
  publicPhone: "+48 600 000 000",
  publicEmail: "kontakt@dmuchance.lomza.pl",
  serviceAreaDescription: "Łomża, okolice i wybrane lokalizacje w województwie podlaskim po potwierdzeniu dojazdu.",
  defaultCurrency: "PLN",
  defaultBaseHours: 5,
  defaultExtraHourPercent: 20,
  bookingLeadTimeHours: 24,
  defaultSetupMinutes: 45,
  defaultTeardownMinutes: 45,
  requireAdminConfirmation: true,
  requestExpirationDays: 7,
  paymentLinkExpirationHours: 48,
};

export function createInitialState(): MockState {
  return {
    categories: structuredClone(categories),
    products: structuredClone(products),
    productAssets: structuredClone(productAssets),
    priceRules: structuredClone(priceRules),
    customers: [
      {
        id: "cust_demo_company",
        name: "Anna Nowak",
        email: "anna@example.pl",
        phone: "+48 601 222 333",
        marketingConsent: false,
        anonymizedAt: null,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    locations: [
      {
        id: "loc_demo_company",
        customerId: "cust_demo_company",
        label: "Piknik firmowy",
        street: "ul. Testowa 12",
        postalCode: "30-001",
        city: "Kraków",
        country: "PL",
        surfaceType: "grass",
        powerAvailable: true,
        accessNotes: "Wjazd od strony parkingu.",
        createdAt,
        updatedAt: createdAt,
      },
    ],
    quotes: [],
    rentalRequests: [],
    rentalRequestItems: [],
    bookings: structuredClone(bookings),
    bookingItems: structuredClone(bookingItems),
    availabilityBlocks: structuredClone(availabilityBlocks),
    payments: structuredClone(payments),
    paymentEvents: [],
    notifications: [],
    adminUsers: structuredClone(adminUsers),
    auditLogs: [],
    featureFlags: structuredClone(featureFlags),
    legalDocuments: structuredClone(legalDocuments),
    generatedDocuments: [],
    analyticsEvents: [],
    businessSettings: structuredClone(businessSettings),
  };
}
