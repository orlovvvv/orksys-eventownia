export type Currency = "PLN";

export type QuoteMode = "automatic" | "manual" | "automatic_with_manual_travel_fee";

export type ProductType = "rental_product" | "addon" | "manual_quote_extra";

export type OrderItemInput = {
  productId: string;
  quantity: number;
};

export type ManualPaymentStatus =
  | "not_required"
  | "unpaid"
  | "deposit_paid"
  | "paid";

export type BookingStatus =
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled_by_customer"
  | "cancelled_by_operator";

export type RentalRequestStatus =
  | "pending_admin_review"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "expired";

export type Category = {
  id: string;
  slug: string;
  namePl: string;
  descriptionPl: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  categoryId: string;
  sku: string;
  slug: string;
  namePl: string;
  shortDescriptionPl: string;
  longDescriptionPl: string;
  supplierUrl?: string;
  productType: ProductType;
  active: boolean;
  publicVisible: boolean;
  requiresPower: boolean;
  requiresOperator: boolean;
  setupMinutes: number;
  teardownMinutes: number;
  cleaningBufferMinutes: number;
  inventoryCount: number;
  sortOrder: number;
  visualTone: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductAsset = {
  id: string;
  productId: string;
  r2Key: string;
  publicUrl: string | null;
  altTextPl: string;
  mediaType: "image" | "document";
  licenseStatus: "owned" | "licensed" | "illustrative" | "unknown";
  sourceUrl?: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PriceRule = {
  id: string;
  productId: string;
  quoteMode: "automatic" | "manual";
  unitMode: "per_booking" | "per_item" | "manual_quote";
  currency: Currency;
  basePriceGrosz: number | null;
  baseHours: number | null;
  extraHourPercent: number;
  depositMode: "none" | "fixed" | "percent";
  depositAmountGrosz: number | null;
  depositPercent: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  marketingConsent: boolean;
  anonymizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Location = {
  id: string;
  customerId: string | null;
  label: string | null;
  street: string;
  postalCode: string;
  city: string;
  country: "PL";
  surfaceType: string | null;
  powerAvailable: boolean | null;
  accessNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuoteLine = {
  sku: string;
  productId: string;
  name: string;
  quantity: number;
  quoteMode: "automatic" | "manual";
  basePriceGrosz: number | null;
  baseHours: number | null;
  extraHours: number;
  extraHourPriceGrosz: number | null;
  lineTotalGrosz: number | null;
};

export type Quote = {
  id: string;
  quoteMode: QuoteMode;
  currency: Currency;
  durationHours: number;
  lines: QuoteLine[];
  subtotalGrosz: number;
  travelFee: {
    mode: "manual" | "free" | "zone" | "distance";
    amountGrosz: number | null;
    label: string;
  };
  totalEstimateGrosz: number | null;
  warnings: string[];
  event: {
    date: string;
    startTime: string;
    postalCode: string;
    city: string;
  };
  createdAt: string;
};

export type RentalRequestItem = {
  id: string;
  rentalRequestId: string;
  productId: string;
  quantity: number;
  unitPriceGrosz: number | null;
  extraHours: number;
  lineTotalGrosz: number | null;
  quoteMode: "automatic" | "manual";
  createdAt: string;
  updatedAt: string;
};

export type RentalRequest = {
  id: string;
  publicToken: string;
  status: RentalRequestStatus;
  customerId: string;
  locationId: string;
  eventDate: string;
  startTime: string;
  durationHours: number;
  quoteMode: QuoteMode;
  subtotalGrosz: number;
  travelFeeGrosz: number | null;
  discountGrosz: number;
  totalEstimateGrosz: number | null;
  message: string | null;
  source: "website" | "admin";
  turnstileVerifiedAt: string | null;
  privacyAcceptedAt: string | null;
  termsAcceptedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingItem = {
  id: string;
  bookingId: string;
  productId: string;
  quantity: number;
  unitPriceGrosz: number;
  extraHours: number;
  lineTotalGrosz: number;
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  id: string;
  rentalRequestId: string | null;
  publicToken: string;
  status: BookingStatus;
  customerId: string;
  locationId: string;
  eventStartAt: string;
  eventEndAt: string;
  setupStartAt: string;
  teardownEndAt: string;
  durationHours: number;
  currency: Currency;
  subtotalGrosz: number;
  travelFeeGrosz: number;
  discountGrosz: number;
  totalGrosz: number;
  manualPaymentStatus: ManualPaymentStatus;
  depositRequiredGrosz: number;
  paidAmountGrosz: number;
  paymentNotes: string | null;
  paymentUpdatedAt: string | null;
  paymentUpdatedByAdminId: string | null;
  confirmedAt: string | null;
  expiresAt: string | null;
  adminNotes: string | null;
  customerNotes: string | null;
  createdByAdminId: string | null;
  generatedContractId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AvailabilityBlock = {
  id: string;
  productId: string | null;
  startsAt: string;
  endsAt: string;
  reasonType: "manual" | "maintenance" | "blackout";
  reason: string;
  createdByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  bookingId: string | null;
  rentalRequestId: string | null;
  customerId: string | null;
  channel: "email" | "sms";
  templateKey: string;
  recipient: string;
  status: "pending" | "sent" | "failed";
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "staff" | "viewer";
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  adminUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type FeatureFlag = {
  key: string;
  enabled: boolean;
  valueJson: string | null;
  description: string;
  updatedByAdminId: string | null;
  updatedAt: string;
};

export type LegalDocument = {
  id: string;
  type: "terms" | "privacy" | "cookies";
  version: string;
  locale: "pl-PL";
  title: string;
  bodyMd: string;
  active: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GeneratedDocument = {
  id: string;
  bookingId: string;
  type: "contract";
  r2Key: string;
  status: "generated";
  createdAt: string;
  updatedAt: string;
};

export type BusinessSettings = {
  businessName: string;
  publicPhone: string;
  publicEmail: string;
  serviceAreaDescription: string;
  defaultCurrency: Currency;
  defaultBaseHours: number;
  defaultExtraHourPercent: number;
  bookingLeadTimeHours: number;
  defaultSetupMinutes: number;
  defaultTeardownMinutes: number;
  requireAdminConfirmation: boolean;
  requestExpirationDays: number;
};

export type AnalyticsEvent = {
  id: string;
  event: string;
  entityType: string | null;
  entityId: string | null;
  metadataJson: string;
  createdAt: string;
};

export type MockState = {
  categories: Category[];
  products: Product[];
  productAssets: ProductAsset[];
  priceRules: PriceRule[];
  customers: Customer[];
  locations: Location[];
  quotes: Quote[];
  rentalRequests: RentalRequest[];
  rentalRequestItems: RentalRequestItem[];
  bookings: Booking[];
  bookingItems: BookingItem[];
  availabilityBlocks: AvailabilityBlock[];
  notifications: Notification[];
  adminUsers: AdminUser[];
  auditLogs: AuditLog[];
  featureFlags: FeatureFlag[];
  legalDocuments: LegalDocument[];
  generatedDocuments: GeneratedDocument[];
  analyticsEvents: AnalyticsEvent[];
  businessSettings: BusinessSettings;
};
