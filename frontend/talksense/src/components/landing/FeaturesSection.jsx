import { MessageSquare, Globe, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: MessageSquare,
    title: "AI-Powered Chat",
    description: "Understands natural language and context to provide accurate, human-like responses specifically tailored to your business needs."
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Communicate with your users in over 50 languages with native-level fluency, ensuring a truly global reach for your business."
  },
  {
    icon: TrendingUp,
    title: "Continuous Learning",
    description: "The system learns from every interaction, using user feedback to improve accuracy and relevance over time."
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track engagement, user satisfaction, and query volume with detailed insights to optimize your support strategy."
  }
];

const MotionDiv = motion.div;

const FeatureCard = ({ feature, index }) => (
  <MotionDiv 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 text-left"
  >
    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[var(--color-primary)] mb-6">
      <feature.icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm">
      {feature.description}
    </p>
  </MotionDiv>
);

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why TalkSense Wins</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
                Everything you need to automate support and delight your users.
            </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
                <FeatureCard key={index} feature={feature} index={index} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
