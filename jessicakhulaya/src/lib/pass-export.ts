import { toPng } from "html-to-image";
import { HAXR_AUTH, formatStudioCredit } from "@lib/brand/authorship";

export const KULAYA_PASS_ID = "luxury-ticket";

function sanitizeFilename(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

async function capturePassDataUrl(): Promise<string> {
  const node = document.getElementById(KULAYA_PASS_ID);
  if (!node) {
    throw new Error("Passe de acesso não encontrado.");
  }

  return toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#1E100A",
    skipFonts: false,
  });
}

/** Imprime apenas o passe (imagem isolada numa janela de impressão). */
export async function printAccessPass(guestName?: string): Promise<void> {
  try {
    const dataUrl = await capturePassDataUrl();
    const title = guestName
      ? `Passe Kulaya · ${guestName} · ${HAXR_AUTH.brand}`
      : `Passe Kulaya · ${HAXR_AUTH.brand}`;

    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      fallbackPrintWithCss();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page { margin: 14mm; size: auto; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  img {
    display: block;
    width: 100%;
    max-width: 420px;
    height: auto;
  }
  .credit {
    margin-top: 16px;
    font-family: Georgia, serif;
    font-size: 9px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #888;
    text-align: center;
  }
</style>
</head>
<body>
  <img id="pass" src="${dataUrl}" alt="${title}" />
  <p class="credit">${formatStudioCredit()}</p>
  <script>
    const img = document.getElementById("pass");
    const run = () => {
      window.focus();
      window.print();
      window.onafterprint = () => window.close();
    };
    if (img.complete) run();
    else img.onload = run;
  </script>
</body>
</html>`);
    printWindow.document.close();
  } catch (error) {
    console.warn("[kulaya-pass] print capture failed, using CSS fallback", error);
    fallbackPrintWithCss();
  }
}

/** Descarrega o passe como imagem PNG — só o cartão, não o convite inteiro. */
export async function downloadAccessPass(guestName?: string): Promise<void> {
  const dataUrl = await capturePassDataUrl();
  const safeName = guestName ? sanitizeFilename(guestName) : "convidado";
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `passe-kulaya-${safeName}.png`;
  link.click();
}

function fallbackPrintWithCss(): void {
  document.documentElement.classList.add("kulaya-print-pass");
  const cleanup = () => {
    document.documentElement.classList.remove("kulaya-print-pass");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}
