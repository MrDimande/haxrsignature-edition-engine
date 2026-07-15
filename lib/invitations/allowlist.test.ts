import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACTIVE_INVITATION_ALLOWLIST,
  isActiveInvitationSlug,
  resolveActiveInvitationSlug,
  resolveCanonicalInvitationSlug,
} from "./allowlist";
import { INVITATIONS } from "@data/invitations";

describe("invitation allowlist / slug resolution", () => {
  it("inclui convites activos existentes", () => {
    for (const slug of [
      "jessicakulaya",
      "cha-de-lingerie",
      "cha-de-panela",
      "jessicachadelingerie",
    ]) {
      assert.ok(ACTIVE_INVITATION_ALLOWLIST.includes(slug));
      assert.equal(isActiveInvitationSlug(slug), true);
      assert.equal(resolveActiveInvitationSlug(slug), slug);
    }
  });

  it("draft traditional-wedding não é activo", () => {
    assert.equal(INVITATIONS["traditional-wedding"].status, "draft");
    assert.equal(isActiveInvitationSlug("traditional-wedding"), false);
    assert.equal(resolveActiveInvitationSlug("traditional-wedding"), null);
  });

  it("slug desconhecido não faz fallback para jessicakulaya", () => {
    assert.equal(resolveCanonicalInvitationSlug("slug-inexistente-xyz"), null);
    assert.equal(resolveActiveInvitationSlug("slug-inexistente-xyz"), null);
    assert.equal(resolveActiveInvitationSlug(undefined), null);
    assert.equal(resolveActiveInvitationSlug(""), null);
  });

  it("draft lobolo-jessica-samuel não é activo", () => {
    assert.equal(INVITATIONS["lobolo-jessica-samuel"].status, "draft");
    assert.equal(isActiveInvitationSlug("lobolo-jessica-samuel"), false);
    assert.equal(resolveActiveInvitationSlug("lobolo-jessica-samuel"), null);
    assert.equal(
      resolveCanonicalInvitationSlug("lobolo-jessica-samuel"),
      "lobolo-jessica-samuel"
    );
  });

  it("aliases e redirects legacy resolvem ao canónico activo", () => {
    assert.equal(
      resolveActiveInvitationSlug("jessicakhulaya"),
      "jessicakulaya"
    );
    assert.equal(
      resolveActiveInvitationSlug("despedida-de-solteira"),
      "jessicachadelingerie"
    );
    assert.equal(
      resolveActiveInvitationSlug("jessicabridetobe"),
      "cha-de-panela"
    );
  });
});
