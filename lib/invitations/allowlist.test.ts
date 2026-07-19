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
  it("inclui todos os convites activos", () => {
    for (const slug of [
      "jessicakulaya",
      "jessicaesamueltraditionalwedding",
      "cha-de-lingerie",
      "cha-de-panela",
      "jessicachadelingerie",
    ]) {
      assert.ok(ACTIVE_INVITATION_ALLOWLIST.includes(slug));
      assert.equal(isActiveInvitationSlug(slug), true);
      assert.equal(resolveActiveInvitationSlug(slug), slug);
    }
  });

  it("resolve jessicaesamueltraditionalwedding para primavera-lobolo", () => {
    const invitation = INVITATIONS.jessicaesamueltraditionalwedding;
    assert.equal(invitation.theme, "primavera-lobolo");
    assert.equal(invitation.engine, "theme");
    assert.equal(invitation.status, "active");
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
      resolveActiveInvitationSlug("traditional-wedding"),
      "jessicaesamueltraditionalwedding"
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

  it("mantém chaves de registry esperadas para convites Edition críticos", () => {
    assert.equal(
      INVITATIONS.jessicachadelingerie.admin?.expectedRegistryKey,
      "rose-elegance"
    );
    assert.equal(
      INVITATIONS.jessicaesamueltraditionalwedding.admin?.expectedRegistryKey,
      "traditional-wedding"
    );
    assert.equal(
      INVITATIONS.jessicasamuelwedding.admin?.expectedRegistryKey,
      "jessica-samuel-wedding"
    );
  });
});
