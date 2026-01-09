import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

const HeroSection = () => {
    const { isAuthenticated } = useAuth();
  return (
    <section className="pt-40 pb-20 px-6 text-center overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider mb-8 border border-blue-100"
        >
            <Zap className="w-3.5 h-3.5" />
            <span>AI-Powered Personalized Learning</span>
        </motion.div>

        <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.15]"
        >
            TalkSense AI – Smarter<br />
            <span className="text-[var(--color-primary)]">Conversations</span>, Better Support
        </motion.h1>

        <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
            Engage your users with AI-powered chat that understands intent, answers queries, and learns from interactions in real-time.
        </motion.p>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
            <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                <Button className="h-14 px-8 text-lg rounded-full shadow-xl shadow-blue-600/20 gap-2">
                    {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </Link>
            <Button variant="outline" className="h-14 px-8 text-lg rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                Request Demo
            </Button>
        </motion.div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-50 via-white to-white opacity-70 pointer-events-none"></div>
    </section>
  );
};

export default HeroSection;
