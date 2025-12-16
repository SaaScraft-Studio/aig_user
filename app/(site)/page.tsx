// import AboutUs from "@/components/home/AboutUs";
import BrowseByDepartment from "@/components/home/BrowseByDepartment";
// import EventCard from "@/components/home/EventCard";
import HeroSection from "@/components/home/HeroSection";
// import UpcomingCMEs from "@/components/home/UpcomingCMEs";
// import UpcomingConferences from "@/components/home/UpcomingConferences";
// import UpcomingEventsSection from "@/components/home/UpcomingEventsSection";
// import UpcomingWorkshops from "@/components/home/UpcomingWorkshops";
import React from "react";

export default function HomePage() {
  return (
    <>
      <section id="home">
        <HeroSection />
      </section>

      <section id="department" className="scroll-mt-20">
        <BrowseByDepartment />
      </section>

      {/* <UpcomingEventsSection
        title="Upcoming Conferences"
        eventCategory="Conference"
        limit={4}
      />
      <UpcomingEventsSection
        title="Upcoming Workshops"
        eventCategory="Workshop"
        limit={4}
      />
      <UpcomingEventsSection
        title="Upcoming CMEs"
        eventCategory="CME"
        limit={4}
      /> */}

      {/* <section id="cmes" className="scroll-mt-20">
        <UpcomingCMEs />
      </section> */}

      {/* <section id="about" className="scroll-mt-20">
        <AboutUs />
      </section> */}
      {/* <EventCard /> */}
    </>
  );
}
