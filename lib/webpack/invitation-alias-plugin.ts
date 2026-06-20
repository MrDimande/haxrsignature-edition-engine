import path from "path";

const INVITATION_SOURCES = [
  "jessicakhulaya/src",
  "lobolojessicaesamuel/src",
  "jessicaesamueltraditionalwedding/src",
] as const;

function matchesInvitationSource(issuerPath: string): string | null {
  const normalized = issuerPath.replace(/\\/g, "/");

  for (const source of INVITATION_SOURCES) {
    if (normalized.includes(`/${source}/`) || normalized.endsWith(`/${source}`)) {
      return source;
    }
  }

  return null;
}

type WebpackResolveRequest = {
  request?: string | null;
  path?: string;
  context: {
    issuer?: string;
    path?: string;
  };
};

type WebpackResolver = {
  ensureHook: (name: string) => unknown;
  getHook: (name: string) => {
    tapAsync: (
      name: string,
      fn: (
        request: WebpackResolveRequest,
        resolveContext: unknown,
        callback: () => void
      ) => void
    ) => void;
  };
  doResolve: (
    hook: unknown,
    request: WebpackResolveRequest,
    message: string | null,
    resolveContext: unknown,
    callback: () => void
  ) => void;
};

export class InvitationAliasPlugin {
  apply(resolver: WebpackResolver) {
    const target = resolver.ensureHook("resolve");

    resolver.getHook("resolve").tapAsync(
      "InvitationAliasPlugin",
      (request, resolveContext, callback) => {
        if (!request.request?.startsWith("@/")) {
          callback();
          return;
        }

        const issuer =
          request.context.issuer ??
          request.context.path ??
          request.path ??
          "";

        const invitationSource = matchesInvitationSource(issuer);
        const relativePath = request.request.slice(2);

        const resolvedBase = invitationSource
          ? path.resolve(process.cwd(), invitationSource)
          : path.resolve(process.cwd(), "src");

        const newRequest = {
          ...request,
          request: path.resolve(resolvedBase, relativePath),
        };

        resolver.doResolve(
          target,
          newRequest,
          null,
          resolveContext,
          callback
        );
      }
    );
  }
}
