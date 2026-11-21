"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { Check, Download, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { BABY_AYLLA_EVENT } from "@lib/aylla/event-details";
import styles from "./BabyAyllaCelebration.module.css";

type BabyAyllaDigitalPassProps = {
  fullName: string;
  partySize: number;
  checkinUrl: string;
};

export function BabyAyllaDigitalPass({ fullName, partySize, checkinUrl }: BabyAyllaDigitalPassProps) {
  const reducedMotion = useReducedMotion();
  const passRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(checkinUrl, {
      width: 380,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#4b332f", light: "#ffffff" },
    }).then((url) => {
      if (active) setQrDataUrl(url);
    }).catch(() => {
      if (active) setQrDataUrl("");
    });
    return () => { active = false; };
  }, [checkinUrl]);

  const downloadPass = async () => {
    if (!passRef.current || !qrDataUrl || downloading) return;
    setDownloading(true);
    try {
      const png = await toPng(passRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: "#fffaf4" });
      const cleanName = fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const link = document.createElement("a");
      link.href = png;
      link.download = `passe-aylla-${cleanName || "convidado"}.png`;
      link.click();
      setDownloaded(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={styles.passWrap}>
      <motion.div
        ref={passRef}
        className={styles.digitalPass}
        initial={{ opacity: 0, y: reducedMotion ? 0 : 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reducedMotion ? 0.01 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className={styles.passBow} aria-hidden="true">A</span>
        <p className={styles.passLabel}><ShieldCheck size={13} /> Passe de entrada</p>
        <p className={`aylla-font-calligraphy ${styles.passName}`}>Aylla</p>
        <div className={styles.passRule} aria-hidden="true" />
        <p className={styles.passGuest}>{fullName}</p>
        <p className={styles.passGuestRole}>Titular da celebração</p>
        <div className={styles.passDetails}>
          <span>{BABY_AYLLA_EVENT.eventDateFormatted}</span>
          <span>{BABY_AYLLA_EVENT.venue.name}</span>
        </div>
        <p className={styles.passCapacity}>Entrada autorizada para {partySize} {partySize === 1 ? "pessoa" : "pessoas"}</p>
        <div className={styles.passQr}>
          {qrDataUrl ? (
            // QR is an in-memory data URL generated after RSVP persistence; Next Image cannot optimise it.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt={`Código QR de entrada para ${fullName}`} />
          ) : <span>A preparar o passe…</span>}
        </div>
        <p className={styles.passScanNote}>Apresente este código à recepção no dia da celebração.</p>
        <p className={styles.passSignature}>HAXR Signature · Alta-Costura Digital</p>
      </motion.div>
      <button type="button" className={styles.passDownload} onClick={() => void downloadPass()} disabled={!qrDataUrl || downloading}>
        {downloaded ? <Check size={14} /> : <Download size={14} />}
        {downloaded ? "Passe guardado" : downloading ? "A preparar…" : "Guardar passe"}
      </button>
    </div>
  );
}
