import { z } from "zod";

import { publicProcedure, router } from "../index";
import { appendAuditLog } from "../mock/eventownia/audit";
import {
  cancelBooking,
  completeBooking,
  confirmRentalRequest,
  declineRentalRequest,
} from "../mock/eventownia/booking";
import { addHoursIso, dateTimeIso, makeId, makePublicToken, nowIso } from "../mock/eventownia/ids";
import { createNotification, resendNotification } from "../mock/eventownia/notifications";
import {
  bookingDetail,
  findActiveHourlyPrice,
  findDefaultVariant,
  findPriceSetForVariant,
  findVariantForProductKey,
  getMockAdmin,
  getState,
  publicProduct,
  rentalRequestDetail,
} from "../mock/eventownia/store";
import type { AvailabilityBlock, Booking, Price, PriceSet, Product, ProductAsset, ProductVariant } from "../mock/eventownia/types";
import { adminOrdersRouter } from "./orders";

const productInput = z.object({
  categoryId: z.string().optional(),
  sku: z.string().optional(),
  slug: z.string().optional(),
  namePl: z.string().optional(),
  shortDescriptionPl: z.string().optional(),
  longDescriptionPl: z.string().optional(),
  productType: z.enum(["rental_product", "addon", "event_extra"]).optional(),
  active: z.boolean().optional(),
  publicVisible: z.boolean().optional(),
  requiresPower: z.boolean().optional(),
  requiresOperator: z.boolean().optional(),
  setupMinutes: z.number().int().min(0).optional(),
  teardownMinutes: z.number().int().min(0).optional(),
  cleaningBufferMinutes: z.number().int().min(0).optional(),
  inventoryCount: z.number().int().min(0).optional(),
  visualTone: z.string().optional(),
});

export const adminRouter = router({
  orders: adminOrdersRouter,

  dashboard: router({
    summary: publicProcedure.query(() => {
      const state = getState();
      const publicProducts = state.products.map((product) => publicProduct(product.id));
      return {
        admin: getMockAdmin(),
        cards: {
          pendingRequests: state.rentalRequests.filter((item) => item.status === "pending_admin_review").length,
          upcomingBookings: state.bookings.filter((item) => new Date(item.eventStartAt) >= new Date()).length,
          awaitingPayment: state.bookings.filter((item) => item.manualPaymentStatus === "unpaid").length,
          missingPhotos: state.products.filter((product) => !state.productAssets.some((asset) => asset.productId === product.id)).length,
          missingPrices: publicProducts.filter((product) => product?.pricing?.hourlyPriceZloty === null || product?.pricing?.hourlyPriceZloty === undefined).length,
          inactiveProducts: state.products.filter((product) => !product.active).length,
          notifications: state.notifications.length,
        },
        latestRequests: state.rentalRequests.slice(0, 5).map((item) => rentalRequestDetail(item.id)),
        latestBookings: state.bookings.slice(0, 5).map((item) => bookingDetail(item.id)),
        analyticsEvents: state.analyticsEvents.slice(0, 12),
      };
    }),
  }),

  calendar: router({
    list: publicProcedure.query(() => {
      const state = getState();
      return state.bookings.map((booking) => bookingDetail(booking.id));
    }),
  }),

  products: router({
    list: publicProcedure.query(() => {
      const state = getState();
      return state.products
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((product) => publicProduct(product.id))
        .filter((product) => product !== null);
    }),

    detail: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => publicProduct(input.id)),

    create: publicProcedure.input(productInput.required({ categoryId: true, sku: true, slug: true, namePl: true }).extend({ hourlyPriceZloty: z.number().int().min(0) })).mutation(({ input }) => {
      const state = getState();
      const now = nowIso();
      const product: Product = {
        id: makeId("prod"),
        categoryId: input.categoryId,
        slug: input.slug,
        namePl: input.namePl,
        shortDescriptionPl: input.shortDescriptionPl ?? "Nowy produkt makietowy.",
        longDescriptionPl: input.longDescriptionPl ?? "Opis zostanie uzupełniony przez administratora.",
        productType: input.productType ?? "rental_product",
        active: input.active ?? true,
        publicVisible: input.publicVisible ?? true,
        requiresPower: input.requiresPower ?? true,
        requiresOperator: input.requiresOperator ?? true,
        setupMinutes: input.setupMinutes ?? 45,
        teardownMinutes: input.teardownMinutes ?? 45,
        cleaningBufferMinutes: input.cleaningBufferMinutes ?? 0,
        sortOrder: state.products.length * 10 + 10,
        visualTone: input.visualTone ?? "neutral",
        createdAt: now,
        updatedAt: now,
      };
      const variant: ProductVariant = {
        id: makeId("variant"),
        productId: product.id,
        sku: input.sku,
        title: "Default",
        isDefault: true,
        active: true,
        inventoryCount: input.inventoryCount ?? 1,
        sortOrder: 10,
        createdAt: now,
        updatedAt: now,
      };
      const priceSet: PriceSet = {
        id: makeId("pset"),
        variantId: variant.id,
        depositMode: "fixed",
        depositAmountZloty: 300,
        depositPercent: null,
        active: true,
        createdAt: now,
        updatedAt: now,
      };
      const price: Price = {
        id: makeId("price"),
        priceSetId: priceSet.id,
        currency: "PLN",
        unitMode: "per_hour",
        amountZloty: input.hourlyPriceZloty,
        active: true,
        createdAt: now,
        updatedAt: now,
      };
      state.products.unshift(product);
      state.productVariants.unshift(variant);
      state.priceSets.unshift(priceSet);
      state.prices.unshift(price);
      appendAuditLog("product.create", "product", product.id, null, product);
      return publicProduct(product.id);
    }),

    update: publicProcedure.input(z.object({ id: z.string(), data: productInput })).mutation(({ input }) => {
      const state = getState();
      const product = state.products.find((item) => item.id === input.id);
      if (!product) return null;
      const before = { ...product };
      const { sku, inventoryCount, ...productData } = input.data;
      Object.assign(product, productData, { updatedAt: nowIso() });
      appendAuditLog("product.update", "product", product.id, before, product);
      const variant = findDefaultVariant(product.id);
      if (variant && (sku !== undefined || inventoryCount !== undefined)) {
        const beforeVariant = { ...variant };
        if (sku !== undefined) variant.sku = sku;
        if (inventoryCount !== undefined) variant.inventoryCount = inventoryCount;
        variant.updatedAt = nowIso();
        appendAuditLog("product.variant.update", "product_variant", variant.id, beforeVariant, variant);
      }
      return publicProduct(product.id);
    }),

    deactivate: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
      const state = getState();
      const product = state.products.find((item) => item.id === input.id);
      if (!product) return null;
      const before = { ...product };
      product.active = false;
      product.publicVisible = false;
      product.updatedAt = nowIso();
      appendAuditLog("product.deactivate", "product", product.id, before, product);
      return product;
    }),

    attachAsset: publicProcedure
      .input(z.object({ id: z.string(), altTextPl: z.string(), licenseStatus: z.enum(["owned", "licensed", "illustrative", "unknown"]).default("illustrative") }))
      .mutation(({ input }) => {
        const state = getState();
        const now = nowIso();
        const asset: ProductAsset = {
          id: makeId("asset"),
          productId: input.id,
          r2Key: `mock/products/${input.id}/${Date.now()}.webp`,
          publicUrl: null,
          altTextPl: input.altTextPl,
          mediaType: "image",
          licenseStatus: input.licenseStatus,
          sourceUrl: null,
          isPrimary: !state.productAssets.some((item) => item.productId === input.id),
          sortOrder: 10,
          createdAt: now,
          updatedAt: now,
        };
        state.productAssets.unshift(asset);
        appendAuditLog("product.asset.attach", "product", input.id, null, asset);
        return asset;
      }),

    updatePricing: publicProcedure
      .input(
        z.object({
          id: z.string(),
          hourlyPriceZloty: z.number().int().min(0),
          depositAmountZloty: z.number().int().nullable().optional(),
        }),
      )
      .mutation(({ input }) => {
        const state = getState();
        const now = nowIso();
        let variant = findDefaultVariant(input.id);
        if (!variant) {
          const product = state.products.find((item) => item.id === input.id);
          if (!product) return null;
          variant = {
            id: makeId("variant"),
            productId: product.id,
            sku: product.id,
            title: "Default",
            isDefault: true,
            active: true,
            inventoryCount: 0,
            sortOrder: 10,
            createdAt: now,
            updatedAt: now,
          };
          state.productVariants.unshift(variant);
        }
        let priceSet = findPriceSetForVariant(variant.id);
        if (!priceSet) {
          priceSet = {
            id: makeId("pset"),
            variantId: variant.id,
            depositMode: input.depositAmountZloty ? "fixed" : "none",
            depositAmountZloty: input.depositAmountZloty ?? null,
            depositPercent: null,
            active: true,
            createdAt: now,
            updatedAt: now,
          };
          state.priceSets.unshift(priceSet);
        }
        let price = findActiveHourlyPrice(priceSet.id);
        if (!price) {
          price = {
            id: makeId("price"),
            priceSetId: priceSet.id,
            currency: "PLN",
            unitMode: "per_hour",
            amountZloty: input.hourlyPriceZloty,
            active: true,
            createdAt: now,
            updatedAt: now,
          };
          state.prices.unshift(price);
        }
        const before = { priceSet: { ...priceSet }, price: { ...price } };
        price.amountZloty = input.hourlyPriceZloty;
        price.updatedAt = now;
        if (input.depositAmountZloty !== undefined) {
          priceSet.depositAmountZloty = input.depositAmountZloty;
        }
        priceSet.depositMode = priceSet.depositAmountZloty ? "fixed" : "none";
        priceSet.updatedAt = now;
        appendAuditLog("product.pricing.update", "price_set", priceSet.id, before, { priceSet, price });
        return publicProduct(input.id)?.pricing ?? null;
      }),
  }),

  uploads: router({
    presign: publicProcedure.input(z.object({ fileName: z.string(), contentType: z.string() })).mutation(({ input }) => ({
      uploadId: makeId("upload"),
      r2Key: `mock/uploads/${Date.now()}-${input.fileName}`,
      uploadUrl: `mock://r2-upload/${input.fileName}`,
      contentType: input.contentType,
    })),
  }),

  assets: router({
    register: publicProcedure.input(z.object({ productId: z.string(), r2Key: z.string(), altTextPl: z.string() })).mutation(({ input }) => {
      const state = getState();
      const now = nowIso();
      const asset: ProductAsset = {
        id: makeId("asset"),
        productId: input.productId,
        r2Key: input.r2Key,
        publicUrl: null,
        altTextPl: input.altTextPl,
        mediaType: "image",
        licenseStatus: "illustrative",
        sourceUrl: null,
        isPrimary: false,
        sortOrder: 99,
        createdAt: now,
        updatedAt: now,
      };
      state.productAssets.unshift(asset);
      appendAuditLog("asset.register", "asset", asset.id, null, asset);
      return asset;
    }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
      const state = getState();
      const before = state.productAssets.find((item) => item.id === input.id) ?? null;
      state.productAssets = state.productAssets.filter((item) => item.id !== input.id);
      appendAuditLog("asset.delete", "asset", input.id, before, null);
      return { deleted: Boolean(before) };
    }),
  }),

  rentalRequests: router({
    list: publicProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(({ input }) => getState().rentalRequests.filter((item) => (input?.status ? item.status === input.status : true)).map((item) => rentalRequestDetail(item.id))),
    detail: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => rentalRequestDetail(input.id)),
    update: publicProcedure.input(z.object({ id: z.string(), adminNotes: z.string().optional(), status: z.enum(["pending_admin_review", "confirmed", "declined", "cancelled", "expired"]).optional() })).mutation(({ input }) => {
      const request = getState().rentalRequests.find((item) => item.id === input.id);
      if (!request) return null;
      const before = { ...request };
      if (input.adminNotes !== undefined) request.adminNotes = input.adminNotes;
      if (input.status) request.status = input.status;
      request.updatedAt = nowIso();
      appendAuditLog("rental_request.update", "rental_request", request.id, before, request);
      return rentalRequestDetail(request.id);
    }),
    addQuoteAdjustment: publicProcedure.input(z.object({ id: z.string(), travelFeeZloty: z.number().int().min(0).optional(), discountZloty: z.number().int().min(0).optional(), adminNotes: z.string().optional() })).mutation(({ input }) => {
      const request = getState().rentalRequests.find((item) => item.id === input.id);
      if (!request) return null;
      const before = { ...request };
      if (input.travelFeeZloty !== undefined) request.travelFeeZloty = input.travelFeeZloty;
      if (input.discountZloty !== undefined) request.discountZloty = input.discountZloty;
      if (input.adminNotes !== undefined) request.adminNotes = input.adminNotes;
      request.totalEstimateZloty = request.subtotalZloty + (request.travelFeeZloty ?? 0) - request.discountZloty;
      request.updatedAt = nowIso();
      appendAuditLog("rental_request.quote_adjustment", "rental_request", request.id, before, request);
      return rentalRequestDetail(request.id);
    }),
    confirm: publicProcedure.input(z.object({ id: z.string(), travelFeeZloty: z.number().int().min(0), depositRequiredZloty: z.number().int().min(0), adminNotes: z.string().optional() })).mutation(({ input }) => {
      const booking = confirmRentalRequest(input.id, input);
      if (!booking) return null;
      appendAuditLog("rental_request.confirm", "rental_request", input.id, null, { booking });
      return bookingDetail(booking.id);
    }),
    decline: publicProcedure.input(z.object({ id: z.string(), reason: z.string() })).mutation(({ input }) => {
      const request = declineRentalRequest(input.id, input.reason);
      appendAuditLog("rental_request.decline", "rental_request", input.id, null, request);
      return request ? rentalRequestDetail(request.id) : null;
    }),
    requestInfo: publicProcedure.input(z.object({ id: z.string(), message: z.string() })).mutation(({ input }) => {
      const detail = rentalRequestDetail(input.id);
      if (!detail) return null;
      createNotification({
        rentalRequestId: detail.id,
        customerId: detail.customerId,
        templateKey: "customer_request_more_info",
        recipient: detail.customer?.email ?? detail.customer?.phone ?? "mock-recipient",
      });
      appendAuditLog("rental_request.request_info", "rental_request", input.id, null, { message: input.message });
      return rentalRequestDetail(input.id);
    }),
  }),

  bookings: router({
    list: publicProcedure.query(() => getState().bookings.map((item) => bookingDetail(item.id))),
    detail: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => bookingDetail(input.id)),
    create: publicProcedure.input(z.object({ customerName: z.string(), phone: z.string(), productId: z.string(), date: z.string(), startTime: z.string(), durationHours: z.number().int().positive(), totalZloty: z.number().int() })).mutation(({ input }) => {
      const state = getState();
      const now = nowIso();
      const customer = { id: makeId("cust"), name: input.customerName, email: null, phone: input.phone, marketingConsent: false, anonymizedAt: null, createdAt: now, updatedAt: now };
      const location = { id: makeId("loc"), customerId: customer.id, label: "Rezerwacja ręczna", street: "Ulica i numer do uzupełnienia", addressDetails: null, postalCode: "00-000", city: "Do potwierdzenia", country: "PL" as const, surfaceType: null, powerAvailable: null, accessNotes: null, createdAt: now, updatedAt: now };
      const variant = findVariantForProductKey(input.productId);
      const eventStartAt = dateTimeIso(input.date, input.startTime);
      const eventEndAt = addHoursIso(eventStartAt, input.durationHours);
      const booking: Booking = { id: makeId("book"), rentalRequestId: null, publicToken: makePublicToken("btok"), status: "confirmed", customerId: customer.id, locationId: location.id, eventStartAt, eventEndAt, setupStartAt: eventStartAt, teardownEndAt: eventEndAt, durationHours: input.durationHours, currency: "PLN", subtotalZloty: input.totalZloty, travelFeeZloty: 0, discountZloty: 0, totalZloty: input.totalZloty, manualPaymentStatus: "unpaid", depositRequiredZloty: 0, paidAmountZloty: 0, paymentNotes: null, paymentUpdatedAt: null, paymentUpdatedByAdminId: null, confirmedAt: now, expiresAt: null, adminNotes: "Manual/offline booking.", customerNotes: null, createdByAdminId: getMockAdmin()?.id ?? null, generatedContractId: null, createdAt: now, updatedAt: now };
      state.customers.unshift(customer);
      state.locations.unshift(location);
      state.bookings.unshift(booking);
      state.bookingItems.unshift({ id: makeId("bitem"), bookingId: booking.id, variantId: variant?.id ?? null, productId: variant?.productId ?? input.productId, quantity: 1, hourlyPriceZloty: input.durationHours > 0 ? Math.round(input.totalZloty / input.durationHours) : input.totalZloty, billableHours: input.durationHours, lineTotalZloty: input.totalZloty, createdAt: now, updatedAt: now });
      appendAuditLog("booking.create", "booking", booking.id, null, booking);
      return bookingDetail(booking.id);
    }),
    update: publicProcedure.input(z.object({ id: z.string(), adminNotes: z.string().optional(), customerNotes: z.string().optional() })).mutation(({ input }) => {
      const booking = getState().bookings.find((item) => item.id === input.id);
      if (!booking) return null;
      const before = { ...booking };
      if (input.adminNotes !== undefined) booking.adminNotes = input.adminNotes;
      if (input.customerNotes !== undefined) booking.customerNotes = input.customerNotes;
      booking.updatedAt = nowIso();
      appendAuditLog("booking.update", "booking", booking.id, before, booking);
      return bookingDetail(booking.id);
    }),
    confirm: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
      const booking = getState().bookings.find((item) => item.id === input.id);
      if (!booking) return null;
      const before = { ...booking };
      booking.status = "confirmed";
      booking.confirmedAt = booking.confirmedAt ?? nowIso();
      booking.updatedAt = nowIso();
      appendAuditLog("booking.confirm", "booking", booking.id, before, booking);
      return bookingDetail(booking.id);
    }),
    cancel: publicProcedure.input(z.object({ id: z.string(), reason: z.string() })).mutation(({ input }) => {
      const before = bookingDetail(input.id);
      const booking = cancelBooking(input.id, input.reason);
      appendAuditLog("booking.cancel", "booking", input.id, before, booking);
      return booking ? bookingDetail(booking.id) : null;
    }),
    complete: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
      const before = bookingDetail(input.id);
      const booking = completeBooking(input.id);
      appendAuditLog("booking.complete", "booking", input.id, before, booking);
      return booking ? bookingDetail(booking.id) : null;
    }),
    sendConfirmation: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
      const detail = bookingDetail(input.id);
      if (!detail) return null;
      const notification = createNotification({ bookingId: detail.id, customerId: detail.customerId, templateKey: "customer_booking_confirmed", recipient: detail.customer?.email ?? detail.customer?.phone ?? "mock-recipient" });
      appendAuditLog("booking.send_confirmation", "booking", input.id, null, notification);
      return notification;
    }),
    generateContract: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
      const state = getState();
      const booking = state.bookings.find((item) => item.id === input.id);
      if (!booking) return null;
      const now = nowIso();
      const doc = { id: makeId("doc"), bookingId: booking.id, type: "contract" as const, r2Key: `mock/contracts/${booking.id}.pdf`, status: "generated" as const, createdAt: now, updatedAt: now };
      booking.generatedContractId = doc.id;
      booking.updatedAt = now;
      state.generatedDocuments.unshift(doc);
      appendAuditLog("booking.contract.generate", "booking", booking.id, null, doc);
      return doc;
    }),
  }),

  availabilityBlocks: router({
    list: publicProcedure.query(() => getState().availabilityBlocks.map((block) => ({ ...block, product: block.productId ? publicProduct(block.productId) : null }))),
    create: publicProcedure.input(z.object({ productId: z.string().nullable().optional(), startsAt: z.string(), endsAt: z.string(), reasonType: z.enum(["manual", "maintenance", "blackout"]), reason: z.string() })).mutation(({ input }) => {
      const state = getState();
      const now = nowIso();
      const block: AvailabilityBlock = { id: makeId("block"), productId: input.productId ?? null, startsAt: input.startsAt, endsAt: input.endsAt, reasonType: input.reasonType, reason: input.reason, createdByAdminId: getMockAdmin()?.id ?? null, createdAt: now, updatedAt: now };
      state.availabilityBlocks.unshift(block);
      appendAuditLog("availability_block.create", "availability_block", block.id, null, block);
      return block;
    }),
    update: publicProcedure.input(z.object({ id: z.string(), reason: z.string().optional(), startsAt: z.string().optional(), endsAt: z.string().optional() })).mutation(({ input }) => {
      const block = getState().availabilityBlocks.find((item) => item.id === input.id);
      if (!block) return null;
      const before = { ...block };
      if (input.reason !== undefined) block.reason = input.reason;
      if (input.startsAt !== undefined) block.startsAt = input.startsAt;
      if (input.endsAt !== undefined) block.endsAt = input.endsAt;
      block.updatedAt = nowIso();
      appendAuditLog("availability_block.update", "availability_block", block.id, before, block);
      return block;
    }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
      const state = getState();
      const before = state.availabilityBlocks.find((item) => item.id === input.id) ?? null;
      state.availabilityBlocks = state.availabilityBlocks.filter((item) => item.id !== input.id);
      appendAuditLog("availability_block.delete", "availability_block", input.id, before, null);
      return { deleted: Boolean(before) };
    }),
  }),

  customers: router({
    list: publicProcedure.query(() => getState().customers),
    detail: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => getState().customers.find((item) => item.id === input.id) ?? null),
    update: publicProcedure.input(z.object({ id: z.string(), name: z.string().optional(), email: z.string().nullable().optional(), phone: z.string().optional() })).mutation(({ input }) => {
      const customer = getState().customers.find((item) => item.id === input.id);
      if (!customer) return null;
      const before = { ...customer };
      if (input.name !== undefined) customer.name = input.name;
      if (input.email !== undefined) customer.email = input.email;
      if (input.phone !== undefined) customer.phone = input.phone;
      customer.updatedAt = nowIso();
      appendAuditLog("customer.update", "customer", customer.id, before, customer);
      return customer;
    }),
    anonymize: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
      const customer = getState().customers.find((item) => item.id === input.id);
      if (!customer) return null;
      const before = { ...customer };
      customer.name = "Zanonimizowany klient";
      customer.email = null;
      customer.phone = "usunięto";
      customer.anonymizedAt = nowIso();
      customer.updatedAt = customer.anonymizedAt;
      appendAuditLog("customer.anonymize", "customer", customer.id, before, customer);
      return customer;
    }),
  }),

  notifications: router({
    list: publicProcedure.query(() => getState().notifications),
    resend: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
      const notification = resendNotification(input.id);
      appendAuditLog("notification.resend", "notification", input.id, null, notification);
      return notification;
    }),
  }),

  settings: router({
    get: publicProcedure.query(() => ({ settings: getState().businessSettings, legalDocuments: getState().legalDocuments })),
    update: publicProcedure.input(z.record(z.string(), z.unknown())).mutation(({ input }) => {
      const state = getState();
      const before = { ...state.businessSettings };
      state.businessSettings = { ...state.businessSettings, ...input };
      appendAuditLog("settings.update", "settings", "business", before, state.businessSettings);
      return state.businessSettings;
    }),
  }),

  featureFlags: router({
    list: publicProcedure.query(() => getState().featureFlags),
    update: publicProcedure.input(z.object({ key: z.string(), enabled: z.boolean() })).mutation(({ input }) => {
      const flag = getState().featureFlags.find((item) => item.key === input.key);
      if (!flag) return null;
      const before = { ...flag };
      flag.enabled = input.enabled;
      flag.updatedByAdminId = getMockAdmin()?.id ?? null;
      flag.updatedAt = nowIso();
      appendAuditLog("feature_flag.update", "feature_flag", flag.key, before, flag);
      return flag;
    }),
  }),

  auditLogs: router({
    list: publicProcedure.query(() => getState().auditLogs),
  }),
});
