const testimonials = [
  {
    quote: "TalkSense has completely transformed how we handle customer support. The AI is incredibly accurate and learning constantly.",
    author: "Sarah J.",
    role: "Head of Support at TechFlow",
    avatar: "S"
  },
  {
    quote: "Setting up the knowledge base was a breeze. We went from zero to AI-powered support in less than an hour.",
    author: "Michael C.",
    role: "CTO at StartupX",
    avatar: "M"
  },
  {
    quote: "The analytics dashboard gives us insights we never had before. We can see exactly what our users are asking.",
    author: "Jessica T.",
    role: "Product Manager at DataCorp",
    avatar: "J"
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Trusted by Market Leaders</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
                Join hundreds of fast-growing companies using TalkSense.
            </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
                <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                    <div className="flex text-[var(--color-primary)] mb-4">
                        {[...Array(5)].map((_, k) => (
                            <svg key={k} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>
                    <p className="text-slate-700 text-lg mb-6 leading-relaxed">"{t.quote}"</p>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                            {t.avatar}
                        </div>
                        <div>
                            <div className="font-bold text-slate-900">{t.author}</div>
                            <div className="text-sm text-slate-500">{t.role}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
