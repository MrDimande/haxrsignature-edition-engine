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
  it("inclui todos os convites activos publicados", () => {
    for (const slug of [
      "jessicakulaya",
      "jessicaesamueltraditionalwedding",
      "cha-de-panela",
      "jessicachadelingerie",
      "jessicasamuelwedding",
    ]) {
      assert.ok(ACTIVE_INVITATION_ALLOWLIST.includes(slug));
      assert.equal(isActiveInvitationSlug(slug), true);
      assert.equal(resolveActiveInvitationSlug(slug), slug);
    }
  });

  it("draft cha-de-lingerie (Residência Muege) não unifica com jessicachadelingerie (Govene)", () => {
    assert.equal(INVITATIONS["cha-de-lingerie"].status, "draft");
    assert.equal(isActiveInvitationSlug("cha-de-lingerie"), false);
    assert.equal(resolveActiveInvitationSlug("cha-de-lingerie"), null);
    assert.equal(resolveCanonicalInvitationSlug("cha-de-lingerie"), "cha-de-lingerie");
    assert.notEqual(
      resolveCanonicalInvitationSlug("cha-de-lingerie"),
      "jessicachadelingerie"
    );
    assert.equal(
      INVITATIONS["cha-de-lingerie"].metadata.location.includes("Muege"),
      true
    );
    assert.equal(
      INVITATIONS.jessicachadelingerie.metadata.location.includes("Govene"),
      true
    );
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
    // Aliases do stub Muege deixam de ser activos (draft cha-de-lingerie)
    assert.equal(resolveActiveInvitationSlug("chadelingerie"), null);
    assert.equal(resolveActiveInvitationSlug("jessica-cha-de-lingerie"), null);
  });
});
