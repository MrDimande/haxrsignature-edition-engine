"use client";

import React from "react";

export function AlexandrinaKennethEvents() {
  return (
    <section className="love-section" id="cerimonias" aria-labelledby="love-heading">
      <div className="container">
        <div className="section-title">Com amor</div>
        <h2 className="script-title" id="love-heading">
          Celebra connosco este dia
        </h2>
        <p className="lead">
          Com a bênção de Deus e a alegria das nossas famílias, convidamos-te
          para partilhar connosco este momento tão especial.
        </p>

        <div className="events-grid">
          <article className="event-card">
            <div className="event-content">
              <div className="event-title">Casamento Civil</div>
              <div className="event-meta">Sábado, 09 de Janeiro de 2027</div>
              <div className="event-time">08h00</div>
              <div className="event-venue">3.ª Conservatória do Registo Civil</div>
            </div>
          </article>

          <article className="event-card">
            <div className="event-content">
              <div className="event-title">Casamento Religioso</div>
              <div className="event-meta">Sábado, 09 de Janeiro de 2027</div>
              <div className="event-time">10h00</div>
              <div className="event-venue">Igreja Internacional Casa da Glória da Palavra</div>
            </div>
          </article>

          <article className="event-card">
            <div className="event-content">
              <div className="event-title">Recepção (Copo de Água)</div>
              <div className="event-meta">Sábado, 09 de Janeiro de 2027</div>
              <div className="event-time">15h00</div>
              <div className="event-venue">
                Salão da Igreja Evangélica Assembleia Livre em Moçambique – Ministério Filadélfia
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
