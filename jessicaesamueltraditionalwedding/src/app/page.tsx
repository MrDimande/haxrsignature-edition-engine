import { HeroSection } from "@/components/sections/HeroSection";
import { TraditionalSection } from "@/components/sections/TraditionalSection";
import { CountdownSection } from "@/components/sections/CountdownSection";
import { LocationsSection } from "@/components/sections/LocationsSection";
import { GiftRegistrySection } from "@/components/sections/GiftRegistrySection";
import { RSVPSection } from "@/components/sections/RSVPSection";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <div className="bg-deep-black">
        <TraditionalSection />
        <CountdownSection />
        <LocationsSection />
        <GiftRegistrySection />
        <RSVPSection />
        <Footer />
      </div>
    </main>
  );
}
