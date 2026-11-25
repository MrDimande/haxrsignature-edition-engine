import { callCoreGiftApi } from "@lib/aylla/gifts/core-adapter/client";
import {
  BABY_AYLLA_EDITORIAL_CATEGORIES,
  getBabyAyllaEditorialGalleryItems,
} from "@lib/aylla/gifts/editorial-gallery";
import { humanizeAyllaError } from "@lib/aylla/gifts/error-copy";
import {
  isAyllaEditionRegistryOperational,
  isAyllaEditionTestActivationEnabled,
} from "@lib/aylla/gifts/test-activation";
import {
  getOrCreateAyllaRequestId,
  jsonWithAyllaRequestId,
  logEditionAyllaTrace,
} from "@lib/aylla/gifts/trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CoreAvailabilityItem = {
  itemId: string;
  familyApproved: boolean;
  enabled: boolean;
  approvedQuantity: number | null;
  reservedQuantity: number;
  remainingQuantity: number;
  reservable: boolean;
};

type CoreReservationSummary = {
  id: string;
  giftId: string;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const SYNTHETIC_TEST_ITEM_META: Readonly<
  Record<
    string,
    {
      name: string;
      description: string;
      category: "cantinho-dos-sonhos" | "bonecas-companhia";
      priority: "high" | "standard";
    }
  >
> = {
  "synthetic-staging-aylla-item-qty2": {
    name: "Manta Bordada Petit Rose (Homologação Staging)",
    description:
      "Item sintético exclusivo do ambiente de homologação para validar fluxo ponta-a-ponta de reserva, recarga e cancelamento.",
    category: "cantinho-dos-sonhos",
    priority: "high",
  },
  "synthetic-staging-aylla-concurrency-qty5": {
    name: "Conjunto Urso Atelier Rose (Homologação Staging)",
    description:
      "Item sintético de homologação com múltiplas unidades para validar disponibilidade ao vivo e conflito entre sessões.",
    category: "bonecas-companhia",
    priority: "standard",
  },
};

function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)haxr_aylla_guest_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = getOrCreateAyllaRequestId(request);
  const editorialItems = getBabyAyllaEditorialGalleryItems();
  const operational = isAyllaEditionRegistryOperational();
  const testActivation = isAyllaEditionTestActivationEnabled();

  logEditionAyllaTrace(requestId, "edition_route_enter", { route: "catalog", operational });

  if (!operational) {
    return jsonWithAyllaRequestId(
      {
        success: true,
        registryEnabled: false,
        testActivation: false,
        categories: BABY_AYLLA_EDITORIAL_CATEGORIES,
        editorialItems,
        inventoryItems: [],
        stagingTestItems: [],
        myReservations: [],
        guest: null,
        sessionExpired: false,
      },
      { status: 200 },
      requestId
    );
  }

  const sessionToken = getSessionTokenFromRequest(request);
  logEditionAyllaTrace(requestId, "edition_cookie_checked", {
    route: "catalog",
    hasCookie: Boolean(sessionToken),
  });

  const [catalogResult, sessionResult] = await Promise.all([
    callCoreGiftApi<{
      success: boolean;
      registryEnabled: boolean;
      items: CoreAvailabilityItem[];
      myReservations: CoreReservationSummary[];
    }>({
      method: "POST",
      path: "/api/v1/edition/gifts/aylla/catalog",
      requestId,
      signal: request.signal,
      body: { sessionToken },
    }),
    sessionToken
      ? callCoreGiftApi<{
          success: boolean;
          valid: boolean;
          guest?: { name: string };
          reason?: string;
        }>({
          method: "POST",
          path: "/api/v1/edition/gifts/aylla/session",
          requestId,
          signal: request.signal,
          body: { sessionToken },
        })
      : Promise.resolve(null),
  ]);

  if (!catalogResult.ok) {
    logEditionAyllaTrace(requestId, "edition_route_exit", {
      route: "catalog",
      status: catalogResult.status >= 400 ? catalogResult.status : 502,
      outcome: catalogResult.code,
      durationMs: Date.now() - startedAt,
    });
    return jsonWithAyllaRequestId(
      {
        success: false,
        registryEnabled: true,
        testActivation,
        categories: BABY_AYLLA_EDITORIAL_CATEGORIES,
        editorialItems,
        inventoryItems: [],
        stagingTestItems: [],
        myReservations: [],
        guest: null,
        sessionExpired: false,
        error: humanizeAyllaError(catalogResult.code, catalogResult.error),
      },
      { status: catalogResult.status >= 400 ? catalogResult.status : 502 },
      requestId
    );
  }

  const coreItems = catalogResult.data.items ?? [];
  const editorialIds = new Set(editorialItems.map((item) => item.id));

  const stagingTestItems = testActivation
    ? coreItems
        .filter((item) => !editorialIds.has(item.itemId) && item.itemId in SYNTHETIC_TEST_ITEM_META)
        .map((item) => {
          const meta = SYNTHETIC_TEST_ITEM_META[item.itemId];
          return {
            id: item.itemId,
            name: meta.name,
            description: meta.description,
            category: meta.category,
            priority: meta.priority,
            syntheticStaging: true as const,
            availability: item,
          };
        })
    : [];

  let authenticatedGuest: { name: string } | null = null;
  let sessionExpired = false;

  if (sessionToken && sessionResult) {
    if (sessionResult.ok && sessionResult.data.valid && sessionResult.data.guest) {
      authenticatedGuest = { name: sessionResult.data.guest.name };
    } else if (sessionResult.status === 401 || !sessionResult.ok) {
      sessionExpired = true;
    }
  }

  logEditionAyllaTrace(requestId, "edition_route_exit", {
    route: "catalog",
    status: 200,
    authenticated: Boolean(authenticatedGuest),
    sessionExpired,
    durationMs: Date.now() - startedAt,
  });

  const response = jsonWithAyllaRequestId(
    {
      success: true,
      registryEnabled: Boolean(catalogResult.data.registryEnabled),
      testActivation,
      categories: BABY_AYLLA_EDITORIAL_CATEGORIES,
      editorialItems,
      inventoryItems: coreItems.filter((item) => editorialIds.has(item.itemId)),
      stagingTestItems,
      myReservations: authenticatedGuest ? catalogResult.data.myReservations ?? [] : [],
      guest: authenticatedGuest,
      sessionExpired,
    },
    { status: 200 },
    requestId
  );

  if (sessionExpired) {
    response.cookies.delete("haxr_aylla_guest_session");
  }

  return response;
}
