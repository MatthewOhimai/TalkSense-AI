import { Shield, Lock, FileKey, Database } from "lucide-react";

const SecuritySection = () => {
  return (
    <section className="py-20 bg-blue-600 text-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-50 text-xs font-bold uppercase tracking-wider mb-6 border border-white/20">
                    <Shield className="w-3 h-3" />
                    <span>Enterprise Security</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                    Your Data, <span className="text-blue-100">Secure & Private</span>
                </h2>
                <p className="text-blue-50 text-lg mb-8 leading-relaxed">
                    We prioritize your security with bank-grade encryption and strict access controls. 
                    TalkSense is built to comply with modern data protection standards.
                </p>
                
                <ul className="space-y-4">
                    {[
                        "End-to-end encryption for all data in transit and at rest",
                        "GDPR & CCPA compliant data handling",
                        "Role-based access control (RBAC)",
                        "Regular third-party security audits"
                    ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-blue-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="md:w-1/2 grid grid-cols-2 gap-6">
                <div className="bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <Lock className="w-8 h-8 text-blue-200 mb-4" />
                    <h3 className="font-bold mb-2">Auth0 Integration</h3>
                    <p className="text-sm text-blue-100">Secure login via Google, Email, and Enterprise SSO.</p>
                </div>
                <div className="bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-sm mt-8">
                    <FileKey className="w-8 h-8 text-amber-300 mb-4" />
                    <h3 className="font-bold mb-2">JWT Tokens</h3>
                    <p className="text-sm text-blue-100">Stateless, secure session management for API access.</p>
                </div>
                <div className="bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <Database className="w-8 h-8 text-emerald-300 mb-4" />
                    <h3 className="font-bold mb-2">Data Isolation</h3>
                    <p className="text-sm text-blue-100">Customer data is logically isolated and backed up daily.</p>
                </div>
            </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
    </section>
  );
};

export default SecuritySection;
