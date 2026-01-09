import { Link } from "react-router-dom";
import { BookOpen, Twitter, Linkedin, Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1">
                <Link to="/" className="flex items-center gap-2 mb-6 group">
                     <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <BookOpen className="w-5 h-5 fill-current" />
                     </div>
                     <span className="text-xl font-bold text-white tracking-tight">
                        TalkSense
                     </span>
                </Link>
                <p className="text-sm leading-relaxed mb-6">
                    Empowering businesses with intelligent, secure, and personalized AI conversations.
                </p>
                <div className="flex gap-4">
                    <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                    <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                    <a href="#" className="hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
                </div>
            </div>

            <div>
                <h4 className="font-bold text-white mb-6">Product</h4>
                <ul className="space-y-3 text-sm">
                    <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                    <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                    <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
                    <li><Link to="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-white mb-6">Company</h4>
                <ul className="space-y-3 text-sm">
                    <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                    <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                    <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                    <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-white mb-6">Legal</h4>
                <ul className="space-y-3 text-sm">
                     <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                     <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                     <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                </ul>
            </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <p>&copy; {new Date().getFullYear()} TalkSense AI. All rights reserved.</p>
            <div className="flex gap-6">
                <span>Made with <span className="text-red-500">♥</span> by the TalkSense Team</span>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
