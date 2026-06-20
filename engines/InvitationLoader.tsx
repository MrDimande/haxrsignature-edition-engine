import { HAXR_AUTH } from "@lib/brand/authorship";

export function InvitationLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#120A07]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        <p className="font-serif text-sm tracking-[0.35em] text-[#D4AF37]/80 uppercase">
          {HAXR_AUTH.brand}
        </p>
      </div>
    </div>
  );
}
