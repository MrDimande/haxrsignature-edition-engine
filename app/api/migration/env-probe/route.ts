import { NextResponse } from "next/server";

// Disposable probe retriggered after freeing Neon branch capacity.
export async function GET(): Promise<NextResponse> {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    gitRef: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    databaseUrlPresent: Boolean(process.env.DATABASE_URL?.trim()),
    databaseUrlUnpooledPresent: Boolean(
      process.env.DATABASE_URL_UNPOOLED?.trim()
    ),
  });
}
