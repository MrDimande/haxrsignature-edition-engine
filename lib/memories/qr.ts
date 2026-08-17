import QRCode from "qrcode";
import { getEditionSiteUrl } from "@lib/control-plane/config";
import { isValidMemoriesShortCode } from "./share-links";

const QR_OPTIONS = {
  errorCorrectionLevel: "Q" as const,
  margin: 4,
  width: 1024,
  color: {
    dark: "#171312FF",
    light: "#FFF9F2FF",
  },
};

export function buildMemoriesPublicUrl(shortCode: string): string {
  if (!isValidMemoriesShortCode(shortCode)) {
    throw new Error("Invalid Plus Memories short code.");
  }
  return `${getEditionSiteUrl().replace(/\/$/, "")}/plusmemories/${shortCode}`;
}

export async function renderMemoriesQrSvg(shortCode: string): Promise<string> {
  return QRCode.toString(buildMemoriesPublicUrl(shortCode), {
    ...QR_OPTIONS,
    type: "svg",
  });
}

export async function renderMemoriesQrPng(shortCode: string): Promise<Buffer> {
  return QRCode.toBuffer(buildMemoriesPublicUrl(shortCode), {
    ...QR_OPTIONS,
    type: "png",
  });
}
