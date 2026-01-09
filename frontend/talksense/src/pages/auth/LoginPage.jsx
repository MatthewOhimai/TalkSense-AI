import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { toast } from "react-hot-toast";
import { ArrowLeft, Mail } from "lucide-react";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "TalkSense | Login";
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!formData.email || !formData.password) {
        toast.error("Please fill in all fields");
        setLoading(false);
        return;
    }

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      toast.success("Welcome back!");
      navigate(result.redirectPath || "/dashboard");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-[480px] mx-auto p-8 shadow-2xl shadow-blue-900/10 border-slate-100 rounded-3xl">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2">Welcome Back</h1>
        <p className="text-[var(--color-text-muted)]">Sign in to continue your learning journey.</p>
      </div>

      <div className="w-full min-h-[50px] flex items-center justify-center mb-8">
        <GoogleLogin
            onSuccess={async (credentialResponse) => {
                try {
                    const res = await googleLogin(credentialResponse.credential);
                    if (res.success) {
                        toast.success("Welcome back!");
                        navigate("/dashboard");
                    } else {
                        toast.error(res.error || "Google login failed");
                    }
                } catch (error) {
                    toast.error("An error occurred during Google login");
                    console.error(error);
                }
            }}
            onError={() => {
                toast.error("Google login failed");
            }}
            useOneTap
            width={320}        />
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-slate-400 font-medium">OR</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              startIcon={Mail}
              label="Email Address"
            />
        </div>
        
        <div>
            <Input
                id="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="h-12 bg-slate-50 border-slate-200 focus:bg-white"
            />
             <div className="text-right mt-2">
                <Link to="/auth/password-reset-request" className="text-sm font-medium text-[var(--color-primary)] hover:text-blue-700">
                    Forgot password?
                </Link>
            </div>
        </div>

        <Button type="submit" className="w-full h-12 text-lg shadow-blue-600/20" isLoading={loading}>
          Login
        </Button>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-[var(--color-primary)] hover:text-blue-700 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </Card>
  );
};

export default LoginPage;
