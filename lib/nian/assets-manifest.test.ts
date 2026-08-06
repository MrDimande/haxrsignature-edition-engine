import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NIAN_ASSET_PATHS,
  getNianHeroPhotoSrc,
  getNianStoryImage,
  isNianAssetReady,
} from "./assets-manifest";

describe("nian assets-manifest", () => {
  it("keeps hero clean pending and never returns poster for hero src", () => {
    assert.equal(isNianAssetReady("hero-clean"), false);
    assert.equal(getNianHeroPhotoSrc(), null);
    assert.notEqual(
      NIAN_ASSET_PATHS.hero.clean,
      NIAN_ASSET_PATHS.hero.poster
    );
  });

  it("exposes received story plates with alt and artifact flag", () => {
    const origin = getNianStoryImage("origin");
    assert.ok(origin);
    assert.equal(origin.src, NIAN_ASSET_PATHS.story.origin);
    assert.match(origin.alt, /Retrato editorial/);
    assert.equal(origin.hasCornerArtifact, false);
  });

  it("exposes teamUp and spiderSquad plates for phase 2b sections", () => {
    const teamUp = getNianStoryImage("teamUp");
    assert.ok(teamUp);
    assert.equal(teamUp.src, NIAN_ASSET_PATHS.story.teamUp);
    assert.match(teamUp.alt, /companheiro/);

    const squad = getNianStoryImage("spiderSquad");
    assert.ok(squad);
    assert.equal(squad.src, NIAN_ASSET_PATHS.story.spiderSquad);
    assert.match(squad.alt, /cenário azul e vermelho/);
  });
});
