"use client";

import React from "react";
import Image from "next/image";

export function AlexandrinaKennethCouple() {
  return (
    <section className="couple-section" id="noivos" aria-labelledby="noivos-heading">
      <div className="container">
        <div className="section-title">Com amor</div>
        <h2 className="script-title" id="noivos-heading">
          Os Noivos
        </h2>
        <div className="couple-wrap">
          <div className="couple-wrap__inner">
            <div className="couple-grid">
              <div className="couple-card couple-card--bride">
                <h3>Alexandrina Mitilane</h3>
                <p className="couple-lineage">
                  A Noiva
                  <span className="couple-amp">&amp;</span> Filha abenÃ§oada
                </p>
              </div>

              <div className="couple-photo-column">
                <figure className="couple-photo relative overflow-hidden">
                  <Image
                    src="/images/alexandrina-kenneth/os-noivos.jpg"
                    alt="Alexandrina e Kenneth"
                    width={1066}
                    height={1599}
                    className="w-full h-auto object-cover"
                    priority
                  />
                </figure>
              </div>

              <div className="couple-card couple-card--groom">
                <h3>Kenneth Novele</h3>
                <p className="couple-lineage">
                  O Noivo
                  <span className="couple-amp">&amp;</span> Filho abenÃ§oado
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

