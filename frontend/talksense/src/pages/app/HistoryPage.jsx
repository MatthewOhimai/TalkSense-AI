import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  MessageSquare, 
  Calendar, 
  Trash2, 
  Archive,
  ArchiveRestore,
  ChevronRight,
  Clock
} from "lucide-react";
import chatService from "../../services/chatService";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

const HistoryPage = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); 

  useEffect(() => {
    console.log("HistoryPage mounted or filter changed:", filter);
    let isMounted = true;

    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const response = filter === "archived" 
          ? await chatService.getArchivedSessions()
          : await chatService.getSessions();
        
        console.log("Sessions fetched:", response.data);
        
        if (isMounted) {
          const sessionsData = response.data?.results || (Array.isArray(response.data) ? response.data : []);
          setSessions(sessionsData);
        }
      } catch (error) {
        console.error("Failed to fetch sessions in HistoryPage:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSessions();
    return () => { isMounted = false; };
  }, [filter]);

  const handleToggleArchive = async (e, sessionId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (filter === "archived") {
        await chatService.unarchiveSession(sessionId);
      } else {
        await chatService.archiveSession(sessionId);
      }
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error("Failed to toggle archive status:", error);
    }
  };

  const handleDelete = async (e, sessionId) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this chat?")) {
      try {
        await chatService.deleteSession(sessionId);
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } catch (error) {
        console.error("Failed to delete session:", error);
      }
    }
  };

  // Safe filtering
  const filteredSessions = Array.isArray(sessions) ? sessions.filter(session => 
    (session?.title || "").toLowerCase().includes((searchQuery || "").toLowerCase())
  ) : [];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Chat History</h1>
          <p className="text-slate-500 mt-1">Manage and revisit your previous conversations.</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={filter === "all" ? "primary" : "outline"}
            className="rounded-xl px-4 py-2 text-sm"
            onClick={() => setFilter("all")}
          >
            Active
          </Button>
          <Button 
            variant={filter === "archived" ? "primary" : "outline"}
            className="rounded-xl px-4 py-2 text-sm"
            onClick={() => setFilter("archived")}
          >
            Archived
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        <input 
          type="text" 
          placeholder="Search conversations..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <Link 
              key={session.id} 
              to={`/chat/${session.id}`}
              className="group"
            >
              <Card className="h-full hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleToggleArchive(e, session.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                        title={filter === "archived" ? "Unarchive" : "Archive"}
                      >
                        {filter === "archived" ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, session.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 line-clamp-2 text-lg">
                    {session.title || "Untitled Conversation"}
                  </h3>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-medium text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {session.updated_at ? new Date(session.updated_at).toLocaleDateString() : "No date"}
                  </div>
                  <div className="flex items-center gap-1 text-blue-500 group-hover:translate-x-1 transition-transform">
                    View Chat
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No conversations found</h3>
          <p className="text-slate-500 mt-2">
            {searchQuery ? "Try a different search term." : "Once you start chatting, your history will appear here."}
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
