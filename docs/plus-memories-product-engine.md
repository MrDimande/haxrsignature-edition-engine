# Plus Memories Product Engine

## Architecture

The Edition Engine resolves one `MemoriesEventConfig` for both supported sources:

- `haxr-invitation`: retains the existing `InvitationConfig` and canonical `/{slug}/memorias` route.
- `standalone`: persists a `memory_experiences` project without creating a fictitious invitation.

Every new public entry uses a rotatable ShareLink:

`https://edition.haxrsignature.com/plusmemories/{shortCode}`

The public route resolves the ShareLink, increments `scan_count` atomically, and renders the existing Plus Memories engine. `scan_count` measures scans only; it is not a unique guest or participant count.

## Required configuration

The administrative control plane is fail-closed and requires `ADMIN_MODERATION_SECRET`. The secret must only be supplied as:

```http
Authorization: Bearer <ADMIN_MODERATION_SECRET>
```

Missing server configuration returns `503`. Missing or invalid authorization returns `401`. Query parameters, body fields, `x-admin-secret`, and hard-coded fallbacks are not accepted.

The existing `wedding-photos` bucket is reused through server-created signed upload and download URLs. It must remain private.

## Database activation order

Apply the migrations in filename order before deploying code that exposes the new route:

1. `20260817164841_plus_memories_experiences_and_share_links.sql`
2. `20260817164853_plus_memories_celebration_phases.sql`
3. `20260817164903_plus_memories_private_voice_messages.sql`

The migrations preserve legacy rows by keeping `experience_id` and `phase_id` nullable on `wedding_photos`. They do not expose the new tables to `anon` or `authenticated`; application access is server-side through `service_role`.

## Control-plane API

### Create an experience and its primary ShareLink

`POST /api/memories/admin/experiences`

Standalone example:

```json
{
  "displayName": "Ana & Miguel",
  "eventType": "Casamento",
  "sourceType": "standalone",
  "eventSlug": "ana-miguel",
  "package": "couture",
  "estimatedGuestCount": 120,
  "features": {
    "phases": true,
    "challenges": true,
    "competition": true,
    "voiceMessages": true,
    "gallery": true,
    "offline": true
  }
}
```

For an invitation-backed experience, set `sourceType` to `haxr-invitation` and supply `invitationSlug`. Project creation and the `QR Principal` ShareLink are committed by one database transaction.

The response includes `publicUrl`, plus protected SVG and PNG download URLs.

### Download QR assets

- `GET /api/memories/admin/share-links/{shortCode}/qr?format=svg`
- `GET /api/memories/admin/share-links/{shortCode}/qr?format=png`

Both endpoints require the Bearer authorization header. QR output uses a high-contrast palette, error correction level Q, and a four-module quiet zone. The encoded payload contains only the official Plus Memories URL.

### Review private voice memories

- `GET /api/memories/admin/voice?slug={eventSlug}&status=pending`
- `POST /api/memories/admin/voice/moderate`

The list endpoint returns short-lived signed audio URLs only after administrative authentication. Voice rows are never included in the public gallery.

Moderation body:

```json
{
  "slug": "ana-miguel",
  "voiceMessageId": "00000000-0000-4000-8000-000000000000",
  "action": "approve"
}
```

## Celebration phases

Challenge uploads derive `phase_id` on the server from the configured mapping. A client-provided phase is accepted only for a free moment and only when it matches a configured phase. Phase metadata never changes competition scoring.

The public gallery offers an editorial client-side filter, while gallery and ZIP endpoints also accept `phase` for server-side filtering. Existing unphased rows remain visible under “Todos”.

## Voice upload pipeline

Voice messages use the same secure three-step pattern as photos:

1. create upload intent;
2. upload to the signed Storage URL;
3. complete and validate the stored object.

Completion checks the parent photo, experience isolation, file size, allowed MIME type, magic bytes, storage path, duration, participant identity, and rate limits. Voice messages remain `hosts-only`, start in `pending` moderation, and contribute zero competition points.

## Jessica & Samuel

The migration creates one official `QR Principal` ShareLink for the existing `jessicasamuelwedding` Plus Memories experience:

`https://edition.haxrsignature.com/plusmemories/TsnVHSb`

The legacy route remains valid. No table-specific QR codes are created.
