import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { BookOpen, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Sections
import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import SecuritySection from "../components/landing/SecuritySection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import PricingSection from "../components/landing/PricingSection";
import FAQSection from "../components/landing/FAQSection";
import Footer from "../components/landing/Footer";

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    document.title = "TalkSense | Intelligent Conversations";
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-[var(--color-text-main)]">
      {/* Navbar - Kept here for simplicity as it wraps specific links */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-transparent">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
             <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white">
                <BookOpen className="w-5 h-5 fill-current" />
             </div>
             <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-[var(--color-primary)] transition-colors">
                TalkSense
             </span>
          </Link>
          
          <div className="flex items-center gap-6">
            {isAuthenticated ? (
                <>
                    <Link to="/dashboard">
                        <Button variant="ghost" className="text-sm font-medium text-slate-600 hover:text-[var(--color-primary)]">
                            Dashboard
                        </Button>
                    </Link>
                    <Link to="/profile" className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 hover:ring-2 hover:ring-[var(--color-primary)] transition-all">
                        {user?.profile_picture ? (
                            <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-slate-500" />
                        )}
                    </Link>
                </>
            ) : (
                <>
                    <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-[var(--color-primary)] transition-colors">
                      Sign In
                    </Link>
                    <Link to="/signup">
                        <Button className="h-10 px-6 font-semibold rounded-full shadow-lg shadow-blue-500/20">
                            Get Started
                        </Button>
                    </Link>
                </>
            )}
          </div>
        </div>
      </nav>

      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SecuritySection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
