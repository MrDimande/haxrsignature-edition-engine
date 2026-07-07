/**
 * Invitation data registry — DATA ONLY
 *
 * Re-exports invitation records. No resolution logic.
 * Source of truth for slug → invitation mapping lives in invitations.ts.
 */
export {
  INVITATIONS as InvitationRegistry,
  INVITATIONS,
  invitations,
  invitationSlugs,
  activeInvitationSlugs,
  LEGACY_SLUG_REDIRECTS,
  getInvitation,
  getActiveInvitations,
  type InvitationConfig,
  type InvitationMetadata,
  type InvitationAdminBinding,
  type InvitationStatus,
  type EngineType,
} from "./invitations";
