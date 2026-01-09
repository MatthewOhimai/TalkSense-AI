import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Bot, Loader2, Sparkles } from "lucide-react";
import chatService from "../../services/chatService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../../lib/utils";

/**
 * Public read-only view of a shared chat session.
 * No authentication required. No sidebar, no input, no actions.
 */
const PublicChatView = () => {
  const { chatId } = useParams();
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicSession = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await chatService.getPublicSession(chatId);
        setSession(response.data);
      } catch (err) {
        console.error("Failed to fetch public session:", err);
        setError("This chat is not available or has been made private.");
      } finally {
        setIsLoading(false);
      }
    };

    if (chatId) {
      fetchPublicSession();
    }
  }, [chatId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading shared chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Chat Not Found</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link
            to="/signup"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Sign Up to Start Chatting
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">TalkSense</h1>
              <p className="text-xs text-slate-400">Shared Chat</p>
            </div>
          </div>
          <Link
            to="/signup"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign Up Free
          </Link>
        </div>
      </header>

      {/* Chat Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Chat Title */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-800">{session?.title || "Shared Conversation"}</h2>
            <p className="text-sm text-slate-400 mt-1">
              {session?.created_at ? new Date(session.created_at).toLocaleDateString() : ""}
            </p>
          </div>

          {/* Messages */}
          {session?.messages?.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-4 p-2",
                message.role === 'assistant' ? "items-start" : "items-start flex-row-reverse"
              )}
            >
              {message.role === 'assistant' ? (
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0 flex items-center justify-center border border-blue-100">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex-shrink-0 flex items-center justify-center border border-slate-200">
                  <span className="text-slate-600 font-bold text-sm">U</span>
                </div>
              )}

              <div className="max-w-[85%]">
                <div
                  className={cn(
                    "px-6 py-4 rounded-[20px] text-sm md:text-base leading-relaxed",
                    message.role === 'assistant'
                      ? "bg-white text-slate-700 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]"
                      : "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  )}
                >
                  <div className={cn("prose max-w-none", message.role === 'assistant' ? "prose-slate" : "prose-invert")}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider px-2 mt-2">
                  {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* CTA Footer */}
      <footer className="bg-white border-t border-slate-200 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-600 mb-4">
            Want to continue this conversation or start your own?
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Sign Up to Start Chatting
          </Link>
          <p className="text-xs text-slate-400 mt-4">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicChatView;
