import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { authAPI, userAPI } from "../services/apiClient";

const TestHarness = () => {
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState("qa@example.com");
  const [password, setPassword] = useState("SecurePass12!");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("NewSecure12!");

  const runTest = async (name, fn) => {
    setLoading(true);
    setOutput(`Running ${name}...\n`);
    try {
      const res = await fn();
      setOutput(prev => prev + `Status: ${res.status} ${res.statusText}\n` + JSON.stringify(res.data, null, 2));
      
      // Auto-capture token if login
      if (res.data?.access) {
          localStorage.setItem("access_token", res.data.access);
          setToken(res.data.access);
      }
    } catch (err) {
      setOutput(prev => prev + `Error:\n` + JSON.stringify(err.response?.data || err.message, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-indigo-400">TalkSense AI - API Test Harness</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
            <Card title="Test Configuration">
                <div className="space-y-4">
                    <Input label="Test Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Input label="Test Password" value={password} onChange={(e) => setPassword(e.target.value)} type="text" />
                    <Input label="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                    <Input label="Current Token (Auto-filled on Login)" value={token} readOnly className="font-mono text-xs" />
                    <Input label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="text" />
                </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => runTest("Signup", () => authAPI.signup({ email, password }))} isLoading={loading}>
                    1. POST /signup
                </Button>
                <Button onClick={() => runTest("Verify Email", () => authAPI.verifyEmail({ email, otp }))} isLoading={loading}>
                    2. POST /verify-email
                </Button>
                <Button onClick={() => runTest("Login", () => authAPI.login({ email, password }))} isLoading={loading}>
                    3. POST /login
                </Button>
                <Button variant="secondary" onClick={() => runTest("Get Profile", () => userAPI.getProfile())} isLoading={loading}>
                    4. GET /profile
                </Button>
                 <Button variant="outline" onClick={() => runTest("Resend OTP", () => authAPI.resendOTP({ email }))} isLoading={loading}>
                    POST /resend-otp
                </Button>
                 <Button variant="outline" onClick={() => runTest("Request PWD Reset", () => authAPI.requestPasswordReset({ email }))} isLoading={loading}>
                    POST /pwd-reset/req
                </Button>
                 <Button variant="outline" onClick={() => runTest("Confirm PWD Reset", () => authAPI.confirmPasswordReset({ token: otp, new_password: newPassword, confirm_new_password: newPassword }))} isLoading={loading}>
                    POST /pwd-reset/confirm
                </Button>
                 <Button variant="destructive" onClick={() => runTest("Logout", () => authAPI.logout())} isLoading={loading}>
                    POST /logout
                </Button>
            </div>
        </div>

        <div className="relative">
            <div className="sticky top-8">
                <h3 className="text-xl font-semibold mb-2">Response Output</h3>
                <pre className="bg-black/50 p-4 rounded-lg border border-slate-700 h-[600px] overflow-auto font-mono text-sm text-green-400 whitespace-pre-wrap">
                    {output || "// Ready to test"}
                </pre>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TestHarness;
