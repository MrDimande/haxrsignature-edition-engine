# Assets — Convite Stan

Manifesto canónico: `lib/stan/assets-manifest.ts`

## Estrutura

```
public/images/stan/
  hero/
    hero-main.jpg          [pendente]
    stadium-bg-desktop.png [recebido]
    stadium-bg-mobile.png  [recebido]
    lighting.png           [pendente]
    foreground-ball.png    [pendente]
    shirt-stan-5.png       [pendente]
    editorial-texture.png  [pendente]
  story/
    chapter-01/primary.jpg
    chapter-02/primary.jpg + detail.jpg
    chapter-03/primary.jpg
    chapter-04/primary.jpg + detail.jpg
    chapter-05/primary.jpg
  idols/
    stan.jpg               [dominante]
    mbappe.jpg
    cristiano-ronaldo.jpg
  closing/
    closing-stan.jpg
  social/
    stan-og.png            (1200×630)

public/audio/stan/
  hala-madrid.mp3          [recebido — Hala Madrid y nada más]
```

## Regras

- Sem fotografias genéricas de outras crianças
- Ídolos: sem marca de água, origem licenciada
- Stan visualmente dominante na secção de ídolos
- Actualizar `status` no manifesto quando o ficheiro chegar (`pending` → `received` → `approved`)

## Campos de evento ainda pendentes

Ver `lib/stan/event-details.ts`:

- Local exacto / endereço / coordenadas / mapa
- Dress code
- WhatsApp anfitrião (`NEXT_PUBLIC_EDITION_STAN_WHATSAPP`)
- Prazo RSVP
- Hora de término
- Áudio ambient
