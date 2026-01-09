import { Button } from "../ui/Button";
import { Check } from "lucide-react";

const PricingCard = ({ tier, price, features, recommended, cta }) => (
  <div className={`p-8 rounded-3xl border transition-all duration-300 relative ${recommended ? 'bg-white border-blue-200 shadow-xl scale-105 z-10' : 'bg-slate-50 border-slate-100'}`}>
    {recommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white text-xs font-bold uppercase tracking-wide py-1 px-3 rounded-full">
            Most Popular
        </div>
    )}
    <h3 className="text-lg font-bold text-slate-900 mb-2">{tier}</h3>
    <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-extrabold text-slate-900">${price}</span>
        <span className="text-slate-500">/month</span>
    </div>
    <ul className="space-y-4 mb-8">
        {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                <Check className={`w-5 h-5 ${recommended ? 'text-[var(--color-primary)]' : 'text-slate-400'}`} />
                {feature}
            </li>
        ))}
    </ul>
    <Button 
        variant={recommended ? 'primary' : 'outline'} 
        className="w-full rounded-full"
    >
        {cta}
    </Button>
  </div>
);

const PricingSection = () => {
    return (
        <section id="pricing" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto">
                        Start for free, upgrade as you grow. No hidden fees.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
                    <PricingCard 
                        tier="Starter"
                        price="0"
                        cta="Start for Free"
                        features={[
                            "500 AI Chat messages/mo",
                            "Standard Email Support",
                            "Community Support",
                            "Basic Analytics"
                        ]}
                    />
                     <PricingCard 
                        tier="Pro"
                        price="49"
                        recommended={true}
                        cta="Start 14-Day Trial"
                        features={[
                            "Unlimited AI Chat messages",
                            "Priority Email Support",
                            "Priority Email Support",
                            "Advanced Analytics",
                            "Custom Branding"
                        ]}
                    />
                     <PricingCard 
                        tier="Enterprise"
                        price="199"
                        cta="Contact Sales"
                        features={[
                            "Everything in Pro",
                            "Dedicated 24/7 Support",
                            "Dedicated Success Manager",
                            "SLA & Uptime Guarantee",
                            "SSO & Audit Logs"
                        ]}
                    />
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
