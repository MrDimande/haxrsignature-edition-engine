import Link from "next/link";
import { HAXR_AUTH, formatCopyrightShort } from "@lib/brand/authorship";

export default function NotFound() {
  return (
    <div className="pattern-overlay flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-[family-name:var(--font-body)] text-[10px] tracking-[0.45em] text-[#D4AF37]/70 uppercase">
        {HAXR_AUTH.brand}
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl font-light text-[#F5F0E8]">
        404
      </h1>
      <p className="mt-4 max-w-md font-[family-name:var(--font-body)] text-[#F5F0E8]/50">
        Este convite não foi encontrado ou já não está disponível.
      </p>
      <Link
        href="/"
        className="mt-10 border border-[#D4AF37]/30 px-8 py-3 font-[family-name:var(--font-body)] text-xs tracking-[0.3em] text-[#D4AF37] uppercase transition-colors hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5"
      >
        Voltar à Edition
      </Link>
      <p className="mt-10 font-[family-name:var(--font-body)] text-[9px] tracking-[0.18em] text-[#F5F0E8]/20">
        {formatCopyrightShort()}
      </p>
    </div>
  );
}
