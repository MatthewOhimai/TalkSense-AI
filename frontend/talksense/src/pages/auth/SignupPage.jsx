import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { toast } from "react-hot-toast";
import { ArrowLeft, Mail } from "lucide-react";

const SignupPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "", first_name: "", last_name: "" });
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const { signup, verifyEmail, resendOTP, googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "TalkSense | Signup";
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    // client-side validation
    let bad = false;
    if (!formData.first_name || !formData.first_name.trim()) {
      setFirstNameError("First name is required.");
      bad = true;
    } else setFirstNameError("");
    if (!formData.last_name || !formData.last_name.trim()) {
      setLastNameError("Last name is required.");
      bad = true;
    } else setLastNameError("");
    if (!formData.password || formData.password.length < 12) {
      setPasswordError("Password must be at least 12 characters.");
      bad = true;
    } else setPasswordError("");
    if (bad) return;
    setLoading(true);
    const result = await signup(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      toast.success("Account created! Please verify your email.");
      setShowOtpModal(true);
    } else {
      toast.error(result.error);
    }
  };

  const handleVerify = async () => {
    if (!otp) {
        toast.error("Please enter the OTP");
        return;
    }
    setLoading(true);
    const result = await verifyEmail(formData.email, otp);
    setLoading(false);
    
    if (result.success) {
        toast.success("Email verified! Redirecting to login...");
        setShowOtpModal(false);
        navigate("/login");
    } else {
        toast.error(result.error);
    }
  };

  return (
    <>
      <Card className="w-full max-w-[480px] mx-auto p-8 shadow-2xl shadow-blue-900/10 border-slate-100 rounded-3xl">
         <div className="mb-6">
            <Link to="/" className="inline-flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
            </Link>
        </div>

        <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2">Create Account</h1>
            <p className="text-[var(--color-text-muted)]">Join us to start your journey.</p>
        </div>

        <div className="w-full h-12 flex items-center justify-center mb-8">
            <GoogleLogin
                onSuccess={async (credentialResponse) => {
                    try {
                        const res = await googleLogin(credentialResponse.credential);
                        if (res.success) {
                            toast.success("Welcome!");
                            navigate(res.redirectPath || "/dashboard");
                        } else {
                            toast.error(res.error || "Google signup failed");
                        }
                    } catch (error) {
                        toast.error("An error occurred during Google signup");
                        console.error(error);
                    }
                }}
                onError={() => {
                    toast.error("Google signup failed");
                }}
                useOneTap
                width={320}
            />
        </div>

        <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-slate-400 font-medium">OR</span>
            </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
           <div className="grid grid-cols-2 gap-4">
             <Input
               id="first_name"
               type="text"
               placeholder="First name"
               value={formData.first_name}
               onChange={handleChange}
               required
               autoComplete="given-name"
               label="First name"
               error={firstNameError}
             />
             <Input
               id="last_name"
               type="text"
               placeholder="Last name"
               value={formData.last_name}
               onChange={handleChange}
               required
               autoComplete="family-name"
               label="Last name"
               error={lastNameError}
             />
           </div>
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
          
            <Input
                id="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                error={passwordError}
                className="h-12 bg-slate-50 border-slate-200 focus:bg-white"
            />
          
            <Button type="submit" className="w-full h-12 text-lg shadow-blue-600/20" isLoading={loading}>
                Sign Up
            </Button>

            <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-[var(--color-primary)] hover:text-blue-700 hover:underline">
                Log in
                </Link>
            </p>
        </form>
      </Card>

      <Modal 
        isOpen={showOtpModal} 
        onClose={() => setShowOtpModal(false)}
        title="Verify your email"
      >
        <div className="space-y-4">
            <p className="text-[var(--color-text-muted)] text-sm">
                We've sent a verification code to <strong>{formData.email}</strong>. 
                Please enter the code below to verify your account.
            </p>
            <Input 
                id="otp"
                label="Verification Code"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="text-center text-2xl tracking-widest bg-slate-50"
            />
            <Button onClick={handleVerify} className="w-full h-12" isLoading={loading}>
                Verify Email
            </Button>
            <div className="text-center">
                 <button type="button" className="text-sm text-[var(--color-primary)] font-medium hover:text-blue-700" onClick={async () => {
                    if (!formData.email) { toast.error("Please provide your email to resend OTP"); return; }
                    setLoading(true);
                    try {
                      const res = await resendOTP(formData.email);
                      if (res.success) toast.success(res.message || "OTP resent.");
                      else toast.error(res.error || "Failed to resend OTP");
                    } catch {
                      toast.error("Failed to resend OTP");
                    } finally {
                      setLoading(false);
                    }
                }}>
                    Resend Code
                </button>
            </div>
        </div>
      </Modal>
    </>
  );
};

export default SignupPage;
