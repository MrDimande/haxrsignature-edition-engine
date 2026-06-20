"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { GoldButton } from "@/components/ui/GoldButton";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

type Attendance = "yes" | "no" | "";

type FormData = {
  firstName: string;
  lastName: string;
  attendance: Attendance;
  dietaryRestrictions: string;
};

const initialForm: FormData = {
  firstName: "",
  lastName: "",
  attendance: "",
  dietaryRestrictions: "",
};

export function RSVPSection() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simula envio — integrar com backend/API quando disponível
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const inputClasses =
    "w-full rounded-sm border border-gold/20 bg-charcoal px-4 py-3 font-montserrat text-sm text-off-white placeholder:text-light-gray/40 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30";

  return (
    <section id="rsvp" className="relative py-20 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="mx-auto max-w-xl px-6">
        <RevealOnScroll className="mb-12 text-center">
          <p className="mb-3 font-montserrat text-xs uppercase tracking-[0.35em] text-gold">
            A Presença Exclusiva
          </p>
          <h2 className="font-playfair text-3xl font-bold text-off-white sm:text-4xl md:text-5xl">
            RSVP
          </h2>
          <p className="mt-4 font-montserrat text-sm text-light-gray">
            Por favor, confirmem a vossa presença até 30 dias antes do evento.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.15}>
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg border border-gold/25 bg-deep-black p-10 text-center"
              >
                <CheckCircle2
                  className="mx-auto mb-4 h-12 w-12 text-gold"
                  strokeWidth={1.5}
                />
                <h3 className="mb-2 font-playfair text-2xl font-bold text-off-white">
                  Obrigado!
                </h3>
                <p className="font-montserrat text-sm text-light-gray">
                  A vossa confirmação foi registada com sucesso. Mal podemos
                  esperar para vos receber.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block font-montserrat text-xs uppercase tracking-[0.15em] text-light-gray"
                    >
                      Primeiro Nome
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="Primeiro nome"
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block font-montserrat text-xs uppercase tracking-[0.15em] text-light-gray"
                    >
                      Último Nome
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Último nome"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="attendance"
                    className="mb-2 block font-montserrat text-xs uppercase tracking-[0.15em] text-light-gray"
                  >
                    Irá comparecer?
                  </label>
                  <select
                    id="attendance"
                    name="attendance"
                    required
                    value={form.attendance}
                    onChange={handleChange}
                    className={`${inputClasses} cursor-pointer appearance-none`}
                  >
                    <option value="" disabled>
                      Seleccione uma opção
                    </option>
                    <option value="yes">Sim, com certeza</option>
                    <option value="no">Infelizmente, não</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="dietaryRestrictions"
                    className="mb-2 block font-montserrat text-xs uppercase tracking-[0.15em] text-light-gray"
                  >
                    Restrições Alimentares
                  </label>
                  <textarea
                    id="dietaryRestrictions"
                    name="dietaryRestrictions"
                    rows={3}
                    value={form.dietaryRestrictions}
                    onChange={handleChange}
                    placeholder="Opcional — alergias, vegetarianismo, etc."
                    className={`${inputClasses} resize-none`}
                  />
                </div>

                <GoldButton
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "A confirmar..." : "Confirmar Presença"}
                </GoldButton>
              </motion.form>
            )}
          </AnimatePresence>
        </RevealOnScroll>
      </div>
    </section>
  );
}
