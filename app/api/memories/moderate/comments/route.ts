import { NextResponse } from "next/server";
import { memoriesJson, requireMemoriesAdmin } from "@lib/memories/admin-auth";
import { getNeonPool } from "@lib/db/neon-client";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const auth = requireMemoriesAdmin(request);
  if (!auth.ok) return auth.response;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return memoriesJson(400, { success: false, error: "Pedido JSON inválido." });
  }

  const commentId = body.commentId?.trim() || "";
  const action = body.action?.trim() || "";
  const reason = body.reason?.trim() || null;

  if (!commentId || !UUID_PATTERN.test(commentId)) {
    return memoriesJson(400, { success: false, error: "Identificador de comentário inválido." });
  }

  let newStatus = "";
  if (action === "approve") newStatus = "approved";
  else if (action === "reject") newStatus = "rejected";
  else if (action === "hide") newStatus = "hidden";
  else if (action === "delete") newStatus = "deleted";
  else {
    return memoriesJson(400, { success: false, error: "Acção de moderação desconhecida." });
  }

  const pool = getNeonPool();
  const client = await pool.connect();

  try {
    const res = await client.query(
      `SELECT * FROM haxr_moderate_media_comment($1, $2, NULL, $3);`,
      [commentId, newStatus, reason]
    );

    if (res.rows.length === 0) {
      return memoriesJson(404, { success: false, error: "Comentário não encontrado." });
    }

    const row = res.rows[0];
    return NextResponse.json({
      success: true,
      commentId: row.comment_id,
      previousStatus: row.previous_status,
      newStatus: row.new_status,
      isTransition: row.is_transition,
    });
  } catch (err: any) {
    console.error("[POST /api/memories/moderate/comments] Erro:", err.message);
    return memoriesJson(500, { success: false, error: err.message });
  } finally {
    client.release();
  }
}
