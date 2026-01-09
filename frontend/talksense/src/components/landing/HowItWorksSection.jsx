import { UserPlus, Code2, MessageCircle, BarChart } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up",
    description: "Create your account and verify your email to get started instantly."
  },
  {
    icon: Code2,
    title: "Integrate",
    description: "Add the chatbot widget to your website or app with a simple snippet."
  },
  {
    icon: MessageCircle,
    title: "Interact",
    description: "Users start chatting naturally. The AI handles queries 24/7."
  },
  {
    icon: BarChart,
    title: "Monitor",
    description: "Watch conversations in real-time and gain actionable insights."
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
                Get up and running with TalkSense in four simple steps.
            </p>
        </div>

        <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-100 -z-10" />

            <div className="grid md:grid-cols-4 gap-12">
                {steps.map((step, index) => (
                    <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                        className="relative bg-white pt-4 md:pt-0"
                    >
                        <div className="w-24 h-24 mx-auto bg-white rounded-full border-4 border-white flex items-center justify-center mb-6 relative z-10">
                             <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[var(--color-primary)]">
                                <step.icon className="w-8 h-8" />
                             </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3 text-center">{step.title}</h3>
                        <p className="text-slate-500 text-center text-sm leading-relaxed">
                            {step.description}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
