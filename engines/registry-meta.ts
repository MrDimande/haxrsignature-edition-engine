/** Engine registry key types and metadata — rendering system only */

export type RegistryEngineMetaKey =
  | "theme"
  | "kulaya"
  | "lobolo"
  | "traditional"
  | "legacyKulaya"
  | "legacyLobolo"
  | "legacyTraditional";

export interface EngineMeta {
  id: RegistryEngineMetaKey;
  label: string;
  strategy: "registry-driven" | "legacy-fallback";
  aliasOf?: RegistryEngineMetaKey;
  description: string;
}

const LEGACY_ALIASES: Partial<
  Record<RegistryEngineMetaKey, RegistryEngineMetaKey>
> = {
  legacyKulaya: "kulaya",
  legacyLobolo: "lobolo",
  legacyTraditional: "traditional",
};

export function resolveCanonicalEngineKey(
  engine: RegistryEngineMetaKey
): Exclude<RegistryEngineMetaKey, `legacy${string}`> {
  const alias = LEGACY_ALIASES[engine];
  if (alias) return resolveCanonicalEngineKey(alias);
  return engine as Exclude<RegistryEngineMetaKey, `legacy${string}`>;
}

export const ENGINE_META: Record<RegistryEngineMetaKey, EngineMeta> = {
  theme: {
    id: "theme",
    label: "True Theme Engine",
    strategy: "registry-driven",
    description: "Registry-driven experience OS — structure, flow, mood, audio",
  },
  kulaya: {
    id: "kulaya",
    label: "Kulaya Engine",
    strategy: "legacy-fallback",
    description: "Legacy Kulaya ceremony renderer",
  },
  legacyKulaya: {
    id: "legacyKulaya",
    label: "Kulaya Legacy",
    strategy: "legacy-fallback",
    aliasOf: "kulaya",
    description: "Migration alias — routes to Kulaya legacy engine unchanged",
  },
  lobolo: {
    id: "lobolo",
    label: "Lobolo Engine",
    strategy: "legacy-fallback",
    description: "Legacy Lobolo ceremony renderer",
  },
  legacyLobolo: {
    id: "legacyLobolo",
    label: "Lobolo Legacy",
    strategy: "legacy-fallback",
    aliasOf: "lobolo",
    description: "Migration alias — routes to Lobolo legacy engine unchanged",
  },
  traditional: {
    id: "traditional",
    label: "Traditional Engine",
    strategy: "legacy-fallback",
    description: "Legacy traditional wedding renderer",
  },
  legacyTraditional: {
    id: "legacyTraditional",
    label: "Traditional Legacy",
    strategy: "legacy-fallback",
    aliasOf: "traditional",
    description: "Migration alias — routes to Traditional legacy engine unchanged",
  },
};

export function getEngineMeta(engine: RegistryEngineMetaKey): EngineMeta {
  return ENGINE_META[engine];
}
