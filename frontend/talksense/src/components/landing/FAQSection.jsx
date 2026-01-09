import { useState } from "react";
import { ChevronDown, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "How does the AI learn from my documents?",
    answer: "TalkSense uses advanced RAG (Retrieval-Augmented Generation) technology. When you upload PDFs, docs, or link URLs, we index the content securely. The AI then retrieves relevant snippets to answer user queries accurately."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use enterprise-grade encryption for data in transit and at rest. Your data is isolated and never used to train global models without your explicit permission."
  },
  {
    question: "Can I customize the look of the chatbot?",
    answer: "Yes! You can customize the colors, logo, and welcome message to match your brand identity perfectly."
  },
  {
    question: "Do you offer a free trial?",
    answer: "Yes, we offer a 14-day free trial on the Pro plan so you can explore all the advanced features risk-free."
  },
    {
    question: "What happens if I exceed my message limit?",
    answer: "We'll notify you when you're close to the limit. You can upgrade your plan or purchase an add-on pack. We won't cut off your service immediately."
  }
];

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-6 text-left group"
      >
        <span className={`text-lg font-medium transition-colors ${isOpen ? 'text-[var(--color-primary)]' : 'text-slate-900'} group-hover:text-[var(--color-primary)]`}>
          {question}
        </span>
        <div className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-blue-50 text-[var(--color-primary)]' : 'text-slate-400 group-hover:bg-slate-50'}`}>
             {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
            >
                <p className="pb-6 text-slate-500 leading-relaxed max-w-2xl">
                    {answer}
                </p>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQSection = () => {
  return (
    <section className="py-24 bg-slate-50/50">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500">
                Have a different question? Contact our support team.
            </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            {faqs.map((faq, index) => (
                <FAQItem key={index} {...faq} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
