"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import type { InvitationConfig } from "@data/invitations";
import type { TrueTheme } from "@theme/true-types";
import {
  ShieldCheck,
  Trophy,
  Award,
  CheckCircle2,
  Camera,
  Film,
  Eye,
  Image as ImageIcon,
  Users,
  Flame,
  ArrowUpRight,
  Sparkle,
  QrCode,
  Check,
} from "lucide-react";
import { StanleyWordmark } from "../StanleyWordmark";
import { StanMatchdayCaptureModal } from "./StanMatchdayCaptureModal";

export type StanNavTab = "moments" | "challenges" | "album" | "explorers";

interface StanMissionItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  isCompleted: boolean;
  submissionsCount?: number;
}

interface StanExplorer {
  id: string;
  name: string;
  score: number;
  completedMissionsCount: number;
  rank: number;
}

interface StanGalleryPhoto {
  id: string;
  url: string;
  guestName?: string;
  caption?: string;
  createdAt: string;
}

interface StanMatchdayExperienceProps {
  config: InvitationConfig;
  theme: TrueTheme;
  tableId?: string;
}

export function StanMatchdayExperience({
  config,
  theme,
  tableId,
}: StanMatchdayExperienceProps) {
  const [activeTab, setActiveTab] = useState<StanNavTab>("challenges");
  const [missions, setMissions] = useState<StanMissionItem[]>([]);
  const [explorers, setExplorers] = useState<StanExplorer[]>([]);
  const [photos, setPhotos] = useState<StanGalleryPhoto[]>([]);
  const [selectedMission, setSelectedMission] = useState<StanMissionItem | null>(null);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [isLoadingMissions, setIsLoadingMissions] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userScore, setUserScore] = useState<number>(0);

  const slug = config.slug;

  // 1. Carregar Missões do Servidor via /api/memories/missions
  const loadMissions = useCallback(async () => {
    try {
      setIsLoadingMissions(true);
      const res = await fetch(`/api/memories/missions?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.success && Array.isArray(data.missions)) {
        setMissions(data.missions);
        // Calcular pontuação inicial do utilizador com base nas missões concluídas
        const completedCount = data.missions.filter((m: StanMissionItem) => m.isCompleted).length;
        setUserScore(completedCount * 100);
      }
    } catch (err) {
      console.warn("[StanMatchday] Erro ao carregar missões:", err);
    } finally {
      setIsLoadingMissions(false);
    }
  }, [slug]);

  // 2. Carregar Classificação de Exploradores via /api/memories/explorers
  const loadExplorers = useCallback(async () => {
    try {
      const res = await fetch(`/api/memories/explorers?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.success && Array.isArray(data.explorers)) {
        setExplorers(data.explorers);
      }
    } catch (err) {
      console.warn("[StanMatchday] Erro ao carregar exploradores:", err);
    }
  }, [slug]);

  // 3. Carregar Galeria do Álbum via /api/memories/gallery
  const loadGallery = useCallback(async () => {
    try {
      const res = await fetch(`/api/memories/gallery?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.success && Array.isArray(data.photos)) {
        setPhotos(data.photos);
      }
    } catch (err) {
      console.warn("[StanMatchday] Erro ao carregar galeria:", err);
    }
  }, [slug]);

  useEffect(() => {
    loadMissions();
    loadExplorers();
    loadGallery();
  }, [loadMissions, loadExplorers, loadGallery]);

  // Handler de Missão Concluída
  const handleMissionSuccess = (missionId: string, pointsAwarded: number) => {
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId || m.slug === missionId
          ? { ...m, isCompleted: true, submissionsCount: (m.submissionsCount || 0) + 1 }
          : m
      )
    );
    setUserScore((prev) => prev + pointsAwarded);
    setToastMessage(`Golo! +${pointsAwarded} Pontos adicionados ao teu registo.`);

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);

    // Actualizar galeria e exploradores em background
    loadExplorers();
    loadGallery();
  };

  const completedCount = missions.filter((m) => m.isCompleted).length;
  const totalMissions = missions.length || 10;

  return (
    <div className="min-h-screen bg-[#050A12] text-[#F7F4EF] pb-24 font-sans selection:bg-[#D4AF37]/30 selection:text-[#F7F4EF]">
      {/* Toast Notificação de Sucesso */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 p-3.5 rounded-2xl bg-[#0A1628] border border-[#D4AF37] shadow-2xl flex items-center gap-3 text-xs"
          >
            <div className="p-2 rounded-xl bg-[#D4AF37] text-[#0A1628]">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="font-serif font-bold text-[#F7F4EF] uppercase tracking-wider">
                Missão Cumprida
              </p>
              <p className="text-[#F7F4EF]/80 text-[11px]">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Matchday Edition */}
      <header className="pt-8 pb-6 px-4 text-center border-b border-[#D4AF37]/15 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-radial from-[#C9A86A]/20 to-transparent blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-2xl mx-auto"
        >
          {/* Badge Pass Matchday */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A1628] border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] tracking-[0.25em] uppercase mb-4 shadow-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Pass Matchday Activo · Sessão Autenticada</span>
          </div>

          {/* S·5 Wordmark */}
          <div className="mb-2">
            <StanleyWordmark size="gate" />
          </div>

          <p className="font-display text-xs sm:text-sm tracking-[0.28em] uppercase text-[#D4AF37] font-medium mb-1">
            Eu Espio · Matchday Edition
          </p>

          <p className="font-body text-xs text-[#5B6B7C] max-w-sm mx-auto mb-6">
            O Quinto Acto de um Pequeno Campeão. 10 Desafios Fotográficos Exclusivos.
          </p>

          {/* Placar do Participante */}
          <div className="inline-flex items-center gap-4 px-5 py-2.5 rounded-2xl bg-[#0A1628]/90 border border-[#D4AF37]/30 shadow-md">
            <div className="text-left border-r border-[#D4AF37]/20 pr-4">
              <span className="block text-[9px] uppercase tracking-widest text-[#5B6B7C]">
                Desafios
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-[#F7F4EF]">
                {completedCount} / {totalMissions}
              </span>
            </div>
            <div className="text-left">
              <span className="block text-[9px] uppercase tracking-widest text-[#5B6B7C]">
                Pontos Matchday
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-[#D4AF37]">
                {userScore} PTS
              </span>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Barra de Navegação de 4 Abas: Momentos | Eu Espio | Álbum | Exploradores */}
      <div className="max-w-md mx-auto px-4 my-6 sticky top-3 z-30">
        <div className="bg-[#0A1628]/95 backdrop-blur-md border border-[#D4AF37]/30 rounded-2xl p-1 flex items-center justify-between shadow-xl">
          <button
            type="button"
            onClick={() => setActiveTab("moments")}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-serif tracking-wide transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === "moments"
                ? "bg-[#D4AF37] text-[#0A1628] font-bold shadow-sm"
                : "text-[#5B6B7C] hover:text-[#F7F4EF]"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Momentos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("challenges")}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-serif tracking-wide transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === "challenges"
                ? "bg-[#D4AF37] text-[#0A1628] font-bold shadow-sm"
                : "text-[#5B6B7C] hover:text-[#F7F4EF]"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Eu Espio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("album")}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-serif tracking-wide transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === "album"
                ? "bg-[#D4AF37] text-[#0A1628] font-bold shadow-sm"
                : "text-[#5B6B7C] hover:text-[#F7F4EF]"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Álbum</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("explorers")}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-serif tracking-wide transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === "explorers"
                ? "bg-[#D4AF37] text-[#0A1628] font-bold shadow-sm"
                : "text-[#5B6B7C] hover:text-[#F7F4EF]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Exploradores</span>
          </button>
        </div>
      </div>

      {/* Conteúdo da Aba */}
      <main className="max-w-4xl mx-auto px-4">
        {/* ABA 1: MOMENTOS */}
        {activeTab === "moments" && (
          <section className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="font-display text-xl sm:text-2xl font-light text-[#F7F4EF] tracking-wide mb-1">
                Momentos do Matchday
              </h2>
              <p className="font-body text-xs text-[#5B6B7C]">
                Registos e destaques especiais do 5º Aniversário do Stan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#0A1628]/70 border border-[#D4AF37]/20 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] mb-2 block">
                    Acto 01 · Aquecimento
                  </span>
                  <h3 className="font-display text-base font-normal text-[#F7F4EF] mb-2">
                    A Chegada ao Estádio do S5
                  </h3>
                  <p className="text-xs text-[#5B6B7C] leading-relaxed">
                    A recepção dos convidados de honra com o Kit Matchday oficial em Belo Horizonte.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-[#D4AF37]/10 flex items-center justify-between text-[11px] text-[#5B6B7C]">
                  <span>Residência dos avós</span>
                  <span>11h00</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0A1628]/70 border border-[#D4AF37]/20 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] mb-2 block">
                    Acto 02 · O Grande Jogo
                  </span>
                  <h3 className="font-display text-base font-normal text-[#F7F4EF] mb-2">
                    O Quinto Aniversário do Campeão
                  </h3>
                  <p className="text-xs text-[#5B6B7C] leading-relaxed">
                    Cantar os parabéns ao pequeno campeão ao som do hino oficial do Real Madrid.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-[#D4AF37]/10 flex items-center justify-between text-[11px] text-[#5B6B7C]">
                  <span>Mesa de Honra</span>
                  <span>13h30</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ABA 2: EU ESPIO (10 MISSÕES) */}
        {activeTab === "challenges" && (
          <section>
            <div className="text-center mb-6">
              <h2 className="font-display text-xl sm:text-2xl font-light text-[#F7F4EF] tracking-wide mb-1">
                {missions.length} Missões do Matchday
              </h2>
              <p className="font-body text-xs text-[#5B6B7C]">
                Carrega em qualquer missão para capturar a fotografia correspondente e somar pontos.
              </p>
            </div>

            {isLoadingMissions ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-5 rounded-2xl bg-[#0A1628]/40 border border-[#D4AF37]/10 animate-pulse h-28" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {missions.map((mission, idx) => {
                  const isDone = mission.isCompleted;
                  return (
                    <div
                      key={mission.id || mission.slug}
                      onClick={() => {
                        setSelectedMission(mission);
                        setIsCaptureModalOpen(true);
                      }}
                      className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                        isDone
                          ? "bg-[#0A1628]/90 border-[#D4AF37]/60 shadow-xs"
                          : "bg-[#0A1628]/60 border-[#D4AF37]/20 hover:border-[#D4AF37]/60 hover:bg-[#0A1628]/80 hover:shadow-lg"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase">
                            Missão {String(idx + 1).padStart(2, "0")} · Matchday
                          </span>
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#D4AF37] font-bold bg-[#D4AF37]/15 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                              <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />
                              Concluída (+{mission.points} pts)
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-[#5B6B7C] group-hover:text-[#D4AF37] transition-colors">
                              +{mission.points} pts
                            </span>
                          )}
                        </div>

                        <h3 className="font-display text-sm sm:text-base font-light text-[#F7F4EF] group-hover:text-white transition-colors leading-snug">
                          {mission.title}
                        </h3>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#D4AF37]/10 flex items-center justify-between text-[11px] text-[#5B6B7C]">
                        <span className="flex items-center gap-1">
                          <Camera className="w-3 h-3 text-[#D4AF37]" />
                          {isDone ? "Registar nova foto" : "Capturar momento"}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#5B6B7C] group-hover:text-[#D4AF37] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ABA 3: ÁLBUM COLECTIVO */}
        {activeTab === "album" && (
          <section>
            <div className="text-center mb-6">
              <h2 className="font-display text-xl sm:text-2xl font-light text-[#F7F4EF] tracking-wide mb-1">
                Álbum Oficial de Memórias
              </h2>
              <p className="font-body text-xs text-[#5B6B7C]">
                Todas as fotografias e momentos partilhados pelos convidados de honra.
              </p>
            </div>

            {photos.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-2xl bg-[#0A1628]/40 border border-[#D4AF37]/15">
                <ImageIcon className="w-8 h-8 text-[#D4AF37]/40 mx-auto mb-3" />
                <p className="font-display text-sm text-[#F7F4EF] mb-1">O álbum está à espera do primeiro golo!</p>
                <p className="text-xs text-[#5B6B7C] max-w-xs mx-auto mb-4">
                  Sê o primeiro a cumprir uma das missões fotográficas do Eu Espio.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("challenges")}
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0A1628] font-serif text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Ver Missões
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-xl overflow-hidden border border-[#D4AF37]/25 bg-[#0A1628] group"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || "Foto do álbum Stanley"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {photo.guestName && (
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-[#0A1628] to-transparent text-[10px] text-[#F7F4EF]">
                        {photo.guestName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ABA 4: EXPLORADORES (LEADERBOARD) */}
        {activeTab === "explorers" && (
          <section>
            <div className="text-center mb-6">
              <h2 className="font-display text-xl sm:text-2xl font-light text-[#F7F4EF] tracking-wide mb-1">
                Tabela de Exploradores
              </h2>
              <p className="font-body text-xs text-[#5B6B7C]">
                Classificação dos fotógrafos mais atentos do 5º Aniversário do Stan.
              </p>
            </div>

            {explorers.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-2xl bg-[#0A1628]/40 border border-[#D4AF37]/15">
                <Trophy className="w-8 h-8 text-[#D4AF37]/40 mx-auto mb-3" />
                <p className="font-display text-sm text-[#F7F4EF] mb-1">Tabela ainda em aquecimento</p>
                <p className="text-xs text-[#5B6B7C] max-w-xs mx-auto mb-4">
                  Completa missões fotográficas para aparecer na tabela de líderes.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-w-lg mx-auto">
                {explorers.map((exp, index) => {
                  const isTop3 = index < 3;
                  return (
                    <div
                      key={exp.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        index === 0
                          ? "bg-[#D4AF37]/10 border-[#D4AF37] shadow-sm"
                          : "bg-[#0A1628]/80 border-[#D4AF37]/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                            index === 0
                              ? "bg-[#D4AF37] text-[#0A1628]"
                              : index === 1
                              ? "bg-slate-300 text-[#0A1628]"
                              : index === 2
                              ? "bg-amber-700 text-white"
                              : "bg-[#050A12] text-[#5B6B7C]"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-display text-xs sm:text-sm font-normal text-[#F7F4EF]">
                            {exp.name}
                          </p>
                          <p className="text-[10px] text-[#5B6B7C]">
                            {exp.completedMissionsCount} missões cumpridas
                          </p>
                        </div>
                      </div>

                      <div className="font-mono text-xs sm:text-sm font-bold text-[#D4AF37]">
                        {exp.score} PTS
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modal de Captura Fotográfica */}
      <StanMatchdayCaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        mission={selectedMission}
        slug={slug}
        tableId={tableId}
        onSuccess={handleMissionSuccess}
      />

      {/* Footer Alta-Costura */}
      <footer className="mt-16 text-center text-[10px] tracking-[0.25em] text-[#5B6B7C] uppercase">
        HAXR Signature · Alta-Costura Digital
      </footer>
    </div>
  );
}
