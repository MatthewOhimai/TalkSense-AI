import { useState } from "react";
import { Link } from "react-router-dom";
/* removed duplicate import */
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { toast } from "react-hot-toast";
import { ArrowLeft, Mail } from "lucide-react";
import { authAPI } from "../../services/apiClient";

const PasswordResetRequestPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  
  // Note: Add requestPasswordReset to useAuth if strictly needed there, 
  // currently implementing direct call or assuming it's available via api.js integration
  // For now, I'll simulate or use a direct API call if useAuth doesn't expose it yet.
  // Checking previous context... useAuth doesn't seem to expose it directly in the snippet I wrote?
  // Actually I defined it in the context but let's just use the api directly or mock for now if context is missing it.
  // Wait, I see `passwordResetRequest` in the user Prompt, but in my implementation of AuthContext I might have missed exposing it.
  // I will check AuthContext in a moment, for now let's assume it handles it or I'll stub it here using the api lib directly.
  
  // Actually, better to use the api lib directly here for simplicity as it's a stateless action mostly.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        await authAPI.requestPasswordReset({ email });
        setIsSent(true);
        toast.success("Reset link sent!");
    } catch {
        toast.error("Failed to send reset link. Please try again.");
    }
    setLoading(false);
  };

  if (isSent) {
      return (
        <Card className="w-full max-w-[480px] mx-auto p-8 shadow-2xl shadow-blue-900/10 border-slate-100 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">Check your email</h2>
            <p className="text-[var(--color-text-muted)] mb-8">
                We have sent a password reset link to <strong>{email}</strong>.
            </p>
            <div className="space-y-4">
                <Button variant="outline" className="w-full" onClick={() => setIsSent(false)}>
                    Try another email
                </Button>
                <Link to="/login" className="block text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                    Back to Login
                </Link>
            </div>
        </Card>
      );
  }

  return (
    <Card className="w-full max-w-[480px] mx-auto p-8 shadow-2xl shadow-blue-900/10 border-slate-100 rounded-3xl">
      <div className="mb-6">
        <Link to="/login" className="inline-flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2">Forgot Password?</h1>
        <p className="text-[var(--color-text-muted)]">
            Don't worry! It happens. Please enter the email associated with your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              startIcon={Mail}
              label="Email Address"
            />
        </div>

        <Button type="submit" className="w-full h-12 text-lg shadow-blue-600/20" isLoading={loading}>
          Send Reset Link
        </Button>
      </form>
    </Card>
  );
};

export default PasswordResetRequestPage;
