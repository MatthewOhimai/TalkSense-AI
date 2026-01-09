import React, { useState } from "react";
import { 
  Globe, 
  Loader2, 
  CheckCircle2, 
  Copy, 
  ClipboardCheck, 
  Twitter, 
  Linkedin, 
  MessageCircle, 
  Info,
  Share2
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { toast } from "react-hot-toast";
import { cn } from "../../lib/utils";

const ShareModal = ({ isOpen, onClose, sessionId, isPublic, onTogglePublic }) => {
  const [copied, setCopied] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/shared/${sessionId}`;
  const text = "Check out this AI conversation on TalkSense!";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!", { position: "top-center" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePublic = async () => {
    setIsToggling(true);
    try {
      await onTogglePublic();
    } finally {
      setIsToggling(false);
    }
  };

  const platforms = [
    { 
      name: "Twitter", 
      icon: Twitter, 
      gradient: "from-slate-800 to-slate-900",
      url: `https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}` 
    },
    { 
      name: "LinkedIn", 
      icon: Linkedin, 
      gradient: "from-blue-600 to-blue-700",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` 
    },
    { 
      name: "WhatsApp", 
      icon: MessageCircle, 
      gradient: "from-green-500 to-green-600",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + shareUrl)}` 
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Conversation">
      <div className="space-y-5">
        {/* Public Toggle Card */}
        <div 
          className={cn(
            "relative overflow-hidden rounded-2xl p-5 transition-all duration-300 cursor-pointer",
            isPublic 
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200" 
              : "bg-slate-100 hover:bg-slate-150"
          )}
          onClick={!isToggling ? handleTogglePublic : undefined}
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                isPublic ? "bg-white/20" : "bg-white shadow-sm"
              )}>
                {isPublic ? (
                  <Globe className="w-6 h-6 text-white" />
                ) : (
                  <Globe className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div>
                <p className={cn(
                  "font-semibold text-base",
                  isPublic ? "text-white" : "text-slate-800"
                )}>
                  {isPublic ? "Public Link Active" : "Make Public"}
                </p>
                <p className={cn(
                  "text-sm",
                  isPublic ? "text-blue-100" : "text-slate-500"
                )}>
                  {isPublic ? "Anyone with the link can view" : "Create a shareable link"}
                </p>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <div className={cn(
              "relative w-14 h-8 rounded-full transition-colors flex-shrink-0",
              isPublic ? "bg-white/30" : "bg-slate-300"
            )}>
              <div className={cn(
                "absolute top-1 w-6 h-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center",
                isPublic 
                  ? "translate-x-7 bg-white" 
                  : "translate-x-1 bg-white"
              )}>
                {isToggling ? (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                ) : isPublic ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                ) : null}
              </div>
            </div>
          </div>
          
          {/* Decorative circles for active state */}
          {isPublic && (
            <>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full" />
            </>
          )}
        </div>

        {/* Content when public */}
        {isPublic && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Copy Link Section */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                Share Link
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input 
                    readOnly 
                    value={shareUrl}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button
                  onClick={handleCopyLink}
                  className={cn(
                    "px-5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2",
                    copied 
                      ? "bg-green-500 text-white" 
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300"
                  )}
                >
                  {copied ? (
                    <>
                      <ClipboardCheck className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Social Share */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                Share on Social
              </label>
              <div className="flex gap-3">
                {platforms.map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm bg-gradient-to-r shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all",
                      p.gradient
                    )}
                  >
                    <p.icon className="w-4 h-4" />
                    {p.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600">
                Visitors can read this chat but cannot reply or access your other conversations.
              </p>
            </div>
          </div>
        )}

        {/* Content when private */}
        {!isPublic && (
          <div className="text-center py-6 animate-in fade-in duration-200">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Enable sharing above to generate a public link for this conversation
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;
