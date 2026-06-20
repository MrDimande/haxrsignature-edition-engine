import Hero from "@/components/Hero";
import StorySection from "@/components/StorySection";
import FamilySection from "@/components/FamilySection";
import ExperienceSection from "@/components/ExperienceSection";
import CountdownSection from "@/components/CountdownSection";
import DetailsSection from "@/components/DetailsSection";
import RSVPSection from "@/components/RSVPSection";
import GiftsSection from "@/components/GiftsSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <StorySection />
      <FamilySection />
      <ExperienceSection />
      <CountdownSection />
      <DetailsSection />
      <RSVPSection />
      <GiftsSection />
      <Footer />
    </main>
  );
}
