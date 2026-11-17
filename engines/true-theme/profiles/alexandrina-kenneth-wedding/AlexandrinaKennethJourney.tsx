"use client";

import Image from "next/image";

export function AlexandrinaKennethJourney() {
  return (
    <section className="journey journey--premium" aria-labelledby="journey-heading">
      <div className="container">
        <div className="section-title">A nossa jornada começa aqui</div>
        <h2 className="script-title" id="journey-heading">
          Esperamos por ti
        </h2>
        <p className="lead">
          Um grande amor merece ser celebrado com as pessoas certas. Ficaremos
          muito felizes com a tua presença.
        </p>

        <div className="gallery-grid gallery-grid--premium">
          <div className="gallery-card gallery-card--premium">
            <Image
              src="/images/alexandrina-kenneth/jornada-sonho.jpg"
              alt="Alexandrina e Kenneth — Sonho"
              className="gallery-photo gallery-photo--sonho"
              width={1200}
              height={900}
              loading="lazy"
            />
            <span>Sonho</span>
          </div>

          <div className="gallery-card gallery-card--premium">
            <Image
              src="/images/alexandrina-kenneth/jornada-amor.jpg"
              alt="Alexandrina e Kenneth — Amor"
              className="gallery-photo gallery-photo--amor"
              width={1200}
              height={900}
              loading="lazy"
            />
            <span>Amor</span>
          </div>

          <div className="gallery-card gallery-card--premium">
            <Image
              src="/images/alexandrina-kenneth/jornada-felicidade.jpg"
              alt="Alexandrina e Kenneth — Felicidade"
              className="gallery-photo"
              width={1200}
              height={900}
              loading="lazy"
            />
            <span>Felicidade</span>
          </div>
        </div>
      </div>
    </section>
  );
}
