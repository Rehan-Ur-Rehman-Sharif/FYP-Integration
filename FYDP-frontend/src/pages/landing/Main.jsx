
import Hero from "../../components/LandingPage/Hero";
import Features from "../../components/LandingPage/features";
import Stats from "../../components/LandingPage/stats";
import Testimonials from "../../components/LandingPage/Testimonials";
import Pricing from "../../components/LandingPage/Pricing";
import CTA from "../../components/LandingPage/CTA";
import Footer from "../../components/LandingPage/Footer";
import "../../styles/landing.css";
const Home = () => {
  return (
    <>
      <Hero />
      <Features />
      <Stats />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </>
  );
};

export default Home;