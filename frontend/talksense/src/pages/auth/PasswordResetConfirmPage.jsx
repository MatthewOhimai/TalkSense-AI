import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authAPI } from "../../services/apiClient";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { toast } from "react-hot-toast";
import { Lock, ArrowLeft } from "lucide-react";

const PasswordResetConfirmPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    new_password: "",
    confirm_new_password: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      navigate("/login");
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.confirm_new_password) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.new_password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
    }

    setLoading(true);
    try {
      const response = await authAPI.confirmPasswordReset({
        token,
        new_password: formData.new_password,
        confirm_new_password: formData.confirm_new_password,
      });

      toast.success(response.data.detail || "Password reset successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Reset password error:", error);
      const msg = error.response?.data?.detail || "Failed to reset password.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <Card className="w-full max-w-[480px] mx-auto p-8 shadow-2xl shadow-blue-900/10 border-slate-100 rounded-3xl">
       <div className="mb-6">
        <button 
            onClick={() => navigate("/login")} 
            className="inline-flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
        </button>
      </div>

      <div className="mb-8 text-center">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">Set New Password</h1>
        <p className="text-[var(--color-text-muted)]">
          Please enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Input
            id="new_password"
            type="password"
            label="New Password"
            placeholder="••••••••"
            value={formData.new_password}
            onChange={handleChange}
            required
            startIcon={Lock}
          />
        </div>

        <div>
          <Input
            id="confirm_new_password"
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            value={formData.confirm_new_password}
            onChange={handleChange}
            required
            startIcon={Lock}
          />
        </div>

        <Button type="submit" className="w-full h-12 text-lg" isLoading={loading}>
          Reset Password
        </Button>
      </form>
    </Card>
  );
};

export default PasswordResetConfirmPage;
