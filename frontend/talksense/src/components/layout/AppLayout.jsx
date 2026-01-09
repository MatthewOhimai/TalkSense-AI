import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { 
  MessageSquare, 
  Clock, 
  Book, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Plus,
  MoreVertical,
  Pin,
  Edit3,
  Trash2,
  Archive,
  Share2,
  Check,
  ShieldCheck
} from "lucide-react";
import chatService from "../../services/chatService";
import { toast } from "react-hot-toast";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { cn } from "../../lib/utils";
import ShareModal from "../chat/ShareModal";

const SidebarItem = (props) => {
  const { icon: Icon, label, to, active, collapsed } = props;
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 font-medium",
        active 
          ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        collapsed && "justify-center"
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-white" : "text-slate-500")} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
};

const SessionItem = ({ session, active, onPin, onRename, onArchive, onDelete, onShare }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div 
      className="group relative"
      onMouseLeave={() => setShowMenu(false)}
    >
      <Link
        to={`/chat/${session.id}`}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200",
          active
            ? "bg-blue-50 text-blue-700 font-semibold shadow-sm"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <div className="relative">
          <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
          {session.is_pinned && (
            <div className="absolute -top-1 -right-1">
              <Pin className="h-2 w-2 text-blue-600 fill-current" />
            </div>
          )}
        </div>
        {!active && <span className="truncate flex-1">{session.title || "Untitled Chat"}</span>}
        {active && <span className="truncate flex-1">{session.title || "Untitled Chat"}</span>}
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-slate-100",
          showMenu && "opacity-100 bg-slate-100"
        )}
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>

      {showMenu && (
        <div 
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-white shadow-xl border border-slate-100 z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            onClick={() => { onPin(session); setShowMenu(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <Pin className={cn("h-3 w-3", session.is_pinned && "fill-current text-blue-600")} />
            {session.is_pinned ? "Unpin Chat" : "Pin To the top"}
          </button>
          <button
            onClick={() => { onRename(session); setShowMenu(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <Edit3 className="h-3 w-3" />
            Rename
          </button>
          <button
            onClick={() => { onShare(session); setShowMenu(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <Share2 className="h-3 w-3" />
            Share
          </button>
          <button
            onClick={() => { onArchive(session); setShowMenu(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <Archive className="h-3 w-3" />
            {session.is_archived ? "Unarchive" : "Archive"}
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            onClick={() => { onDelete(session); setShowMenu(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("sidebarWidth");
    return saved ? parseInt(saved, 10) : 256;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetSession, setTargetSession] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => setCollapsed(!collapsed);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await chatService.getSessions();
      const sessionsData = res.data?.results || (Array.isArray(res.data) ? res.data : []);
      setSessions(sessionsData);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  }, []);

  const handlePin = async (session) => {
    try {
      if (session.is_pinned) {
        await chatService.unpinSession(session.id);
        toast.success("Chat unpinned");
      } else {
        await chatService.pinSession(session.id);
        toast.success("Chat pinned to top");
      }
      fetchSessions();
    } catch {
      toast.error("Failed to update pin status");
    }
  };

  const confirmRename = async () => {
    if (!newTitle.trim() || !targetSession) return;
    try {
      await chatService.updateSession(targetSession.id, { title: newTitle });
      toast.success("Chat renamed");
      setIsRenameModalOpen(false);
      fetchSessions();
    } catch {
      toast.error("Failed to rename chat");
    }
  };

  const handleToggleArchive = async (session) => {
    try {
      if (session.is_archived) {
        await chatService.unarchiveSession(session.id);
        toast.success("Chat unarchived");
      } else {
        await chatService.archiveSession(session.id);
        toast.success("Chat archived");
        if (location.pathname === `/chat/${session.id}`) {
          navigate("/chat"); // Go to dashboard if current session archived
        }
      }
      fetchSessions();
    } catch {
      toast.error(`Failed to ${session.is_archived ? 'unarchive' : 'archive'} chat`);
    }
  };

  const handleTogglePublic = async () => {
    if (!targetSession?.id) return;
    try {
      const response = await chatService.togglePublic(targetSession.id);
      setIsPublic(response.data.is_public);
      // Update local sessions state to reflect change
      setSessions(prev => prev.map(s => 
        s.id === targetSession.id ? { ...s, is_public: response.data.is_public } : s
      ));
    } catch (error) {
      console.error("Failed to toggle public:", error);
      toast.error("Failed to update sharing settings");
    }
  };

  const confirmDelete = async () => {
    if (!targetSession) return;
    try {
      await chatService.deleteSession(targetSession.id);
      toast.success("Chat deleted permanently");
      setIsDeleteModalOpen(false);
      fetchSessions();
      if (location.pathname === `/chat/${targetSession.id}`) {
        navigate("/dashboard");
      }
    } catch {
      toast.error("Failed to delete chat");
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = await chatService.getSessions();
        if (mounted) {
          const sessionsData = res.data?.results || (Array.isArray(res.data) ? res.data : []);
          setSessions(sessionsData);
        }
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, [location.pathname]); // Re-fetch on navigation to catch new sessions

  // Resizing logic
  useEffect(() => {
    const handleMouseMove = (e) => {
        if (!isResizing) return;
        let newWidth = e.clientX;
        if (newWidth < 200) newWidth = 200;
        if (newWidth > 450) newWidth = 450;
        setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
        setIsResizing(false);
        localStorage.setItem("sidebarWidth", sidebarWidth);
    };

    if (isResizing) {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    } else {
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
    }

    return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  // General Title Fallbacks
  useEffect(() => {
    const path = location.pathname;
    if (path === "/history") document.title = "TalkSense | History";
    else if (path === "/profile") document.title = "TalkSense | Profile";
    else if (path === "/kb") document.title = "TalkSense | Knowledge Base";
    else if (path === "/admin/analytics") document.title = "TalkSense | Analytics";
    // Dashboard and specific chats are handled in ChatDashboard
  }, [location.pathname]);

  const handleNewChat = () => {
    navigate("/chat");
    if (window.innerWidth < 1024) setMobileMenuOpen(false);
  };

  const links = [
    { icon: MessageSquare, label: "Chat", to: "/chat" },
    { icon: Clock, label: "History", to: "/history" },
    { icon: User, label: "Profile", to: "/profile" },
  ];

  if (user?.role === 'admin' || user?.is_staff) {
    links.push({ icon: ShieldCheck, label: "Admin", to: "/admin/analytics" });
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--color-border)] bg-white transition-[transform] duration-300 lg:static shadow-sm",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ width: collapsed ? "80px" : `${sidebarWidth}px` }}
      >
        {/* Resize Handle */}
        {!collapsed && (
          <div 
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/30 transition-colors z-10"
            onMouseDown={() => setIsResizing(true)}
          />
        )}
        {/* Logo */}
        <div className={cn("flex h-16 items-center border-b border-[var(--color-border)] px-4", collapsed ? "justify-center" : "justify-between")}>
             {!collapsed && (
                <Link to="/chat" className="text-xl font-bold text-[var(--color-primary)]">
                    TalkSense
                </Link>
             )}
             {collapsed && <span className="font-bold text-[var(--color-primary)]">TS</span>}
             <button onClick={toggleSidebar} className="hidden lg:block text-slate-400 hover:text-slate-600">
                <Menu className="h-5 w-5"/> 
             </button>
             <button onClick={toggleMobileMenu} className="lg:hidden text-slate-400">
                <X className="h-5 w-5"/>
             </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
             <Button 
                className={cn("w-full gap-2 shadow-lg shadow-blue-500/10", collapsed && "px-2")} 
                onClick={handleNewChat}
             >
                <Plus className="h-4 w-4" />
                {!collapsed && "New Chat"}
             </Button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1 px-2 overflow-y-auto">
            {links.map((link) => (
                <SidebarItem 
                    key={link.to}
                    {...link}
                    active={location.pathname === link.to}
                    collapsed={collapsed}
                />
            ))}

            {!collapsed && sessions.length > 0 && (
              <div className="mt-8 pt-4 border-t border-slate-100">
                <h3 className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   Recent Chats
                </h3>
                <div className="space-y-1">
                  {sessions.slice(0, 15).map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      active={location.pathname === `/chat/${session.id}`}
                      onPin={handlePin}
                      onRename={(s) => {
                        setTargetSession(s);
                        setNewTitle(s.title || "");
                        setIsRenameModalOpen(true);
                      }}
                      onArchive={handleToggleArchive}
                      onDelete={(s) => {
                        setTargetSession(s);
                        setIsDeleteModalOpen(true);
                      }}
                      onShare={(s) => {
                        setTargetSession(s);
                        setIsPublic(!!s.is_public);
                        setIsShareModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
        </nav>

        {/* Rename Modal */}
        <Modal 
          isOpen={isRenameModalOpen} 
          onClose={() => setIsRenameModalOpen(false)}
          title="Rename Chat"
        >
          <div className="space-y-4">
            <Input 
              label="New Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new chat title..."
              autoFocus
            />
            <div className="flex gap-3 justify-end mt-6">
              <Button variant="ghost" onClick={() => setIsRenameModalOpen(false)}>Cancel</Button>
              <Button onClick={confirmRename}>Save Changes</Button>
            </div>
          </div>
        </Modal>

        {/* Delete Modal */}
        <Modal 
          isOpen={isDeleteModalOpen} 
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Chat"
        >
          <div className="space-y-4">
            <p className="text-slate-600 text-sm italic">
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end mt-6">
              <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}>Delete Permanently</Button>
            </div>
          </div>
        </Modal>

        {/* User / Logout */}
        <div className="border-t border-[var(--color-border)] p-4">
            <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}>
              <Link to="/profile" className="inline-block">
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.first_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
                {!collapsed && (
                    <div className="flex-1 overflow-hidden">
                        <span className="ml-2 font-medium text-slate-700">
                            {user?.first_name || user?.email?.split('@')?.[0]}
                        </span>
                    </div>
                )}
                <button onClick={() => logout()} className="text-slate-400 hover:text-red-500" title="Logout">
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white lg:bg-slate-50">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-white lg:hidden px-4">
            <Link to="/chat" className="font-bold text-[var(--color-primary)]">TalkSense AI</Link>
            <button onClick={toggleMobileMenu} className="text-slate-500">
                <Menu className="h-6 w-6" />
            </button>
        </header>

        <div className="flex-1 overflow-auto relative">
            <Outlet />
        </div>
        <ShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          sessionId={targetSession?.id}
          isPublic={isPublic}
          onTogglePublic={handleTogglePublic}
        />
      </main>
    </div>
  );
};
