import { Outlet, Link } from "react-router-dom";

export const AuthLayout = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100 blur-[100px] pointer-events-none opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-50 blur-[100px] pointer-events-none opacity-60" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
                <h1 className="text-3xl font-extrabold text-[var(--color-primary)] tracking-tight">
                    TalkSense AI
                </h1>
            </Link>
            <p className="text-[var(--color-text-muted)] mt-2">Intelligent conversations, simplified.</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
