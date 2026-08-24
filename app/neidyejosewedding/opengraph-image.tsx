import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Neidy Marino e José Cabral — Convite de Casamento";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

async function assetDataUrl(
  relativePublicPath: string,
  mime: "image/jpeg" | "image/png"
): Promise<string> {
  const absolute = path.join(process.cwd(), "public", relativePublicPath);
  const buffer = await readFile(absolute);
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export default async function Image() {
  const [hero, monogram, haxr] = await Promise.all([
    assetDataUrl("images/neidy-jose/couple-primary.jpg", "image/jpeg"),
    assetDataUrl("images/neidy-jose/monogram-nj-transparent.png", "image/png"),
    assetDataUrl("images/haxr-logo-horizontal-white.png", "image/png"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #071914 0%, #0A211A 45%, #14362B 100%)",
          color: "#FCFDFC",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 40%",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(7,25,20,0.88) 0%, rgba(7,25,20,0.52) 46%, rgba(7,25,20,0.78) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 24% 30%, rgba(203,185,148,0.18), transparent 32%), radial-gradient(circle at 78% 82%, rgba(203,185,148,0.14), transparent 28%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "54px 58px 48px 58px",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                maxWidth: 700,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  letterSpacing: "0.34em",
                  textTransform: "uppercase",
                  color: "#CBB994",
                }}
              >
                O VÍNCULO DA PERFEIÇÃO
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 78,
                  lineHeight: 1.02,
                  color: "#FCFDFC",
                }}
              >
                Neidy Marino
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 16,
                  fontSize: 72,
                  lineHeight: 1.02,
                  color: "#FCFDFC",
                }}
              >
                <span style={{ fontSize: 34, fontStyle: "italic", color: "#CBB994" }}>
                  e
                </span>
                <span>José Cabral</span>
              </div>
              <div
                style={{
                  display: "flex",
                  width: 160,
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent, rgba(203,185,148,0.95), transparent)",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                width: 132,
                height: 132,
                borderRadius: "999px",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(203,185,148,0.35)",
                boxShadow: "0 22px 46px rgba(0,0,0,0.22)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={monogram}
                alt=""
                width={92}
                height={92}
                style={{
                  width: 92,
                  height: 92,
                  objectFit: "contain",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 28,
                  fontStyle: "italic",
                  color: "#EBE4D5",
                }}
              >
                Casamento · 5 de Dezembro de 2026
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  letterSpacing: "0.08em",
                  color: "#CBB994",
                }}
              >
                Espaço Águia · Maputo
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 12,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={haxr}
                alt=""
                width={180}
                height={48}
                style={{
                  width: 180,
                  height: 48,
                  objectFit: "contain",
                }}
              />
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(252,253,252,0.82)",
                }}
              >
                Alta-Costura Digital
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
