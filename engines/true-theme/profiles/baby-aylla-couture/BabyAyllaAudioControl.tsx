"use client";

import { Pause, Play } from "lucide-react";
import styles from "./BabyAyllaCelebration.module.css";

export function BabyAyllaAudioControl({ playing, busy, error, onToggle }: {
  playing: boolean;
  busy: boolean;
  error: string;
  onToggle: () => void;
}) {
  const label = playing ? "Pausar música" : "Reproduzir música";
  return (
    <div className={styles.audioDock} data-aylla-audio-control>
      {error && <p role="status" className={styles.audioNotice}>{error}</p>}
      <button type="button" onClick={onToggle} disabled={busy} aria-busy={busy}
        aria-label={label} aria-pressed={playing} title={label} className={styles.audioButton}>
        {playing ? <Pause aria-hidden="true" size={16} strokeWidth={1.5} /> : <Play aria-hidden="true" size={16} strokeWidth={1.5} />}
      </button>
    </div>
  );
}
