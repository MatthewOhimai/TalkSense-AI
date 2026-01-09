import { createContext, useContext, useState, useEffect } from "react";
import { authAPI, userAPI, getStoredAuth, persistTokens, clearAuthAndRedirect } from "../services/apiClient";
import { toast } from "react-hot-toast";
import { getRedirectPath } from "../lib/utils";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state with silent refresh
  useEffect(() => {
    const initAuth = async () => {
      const auth = getStoredAuth();
      const refreshToken = auth?.tokens?.refresh;

      if (!auth || !refreshToken) {
        setIsLoading(false);
        return;
      }

      // Hydrate user early to avoid UI flash while we refresh
      if (auth.user) {
        setUser(auth.user);
      }

      try {
        const { data: refreshData } = await authAPI.refreshToken({ refresh: refreshToken });
        const newAccess = refreshData?.access;
        const newRefresh = refreshData?.refresh || refreshToken;

        if (!newAccess) {
          persistTokens(null);
          setIsLoading(false);
          return;
        }

        persistTokens((current) => ({
          ...(current || auth),
          tokens: {
            ...(current?.tokens || auth.tokens || {}),
            access: newAccess,
            refresh: newRefresh,
          },
          loginAt: auth.loginAt,
        }));
      } catch (error) {
        console.error("Session refresh failed:", error);
        persistTokens(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await userAPI.getProfile();
        setUser(data);
        setIsAuthenticated(true);
        persistTokens((prev) => (prev ? { ...prev, user: data } : prev));
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (error.response?.status === 401) {
          persistTokens(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await authAPI.login({ email, password });
      
      // Backend returns: { tokens: { access: "...", refresh: "..." }, user: { ... } }
      if (data.tokens && data.tokens.access) {
        // Store in new format
        persistTokens({
          loginAt: Date.now(),
            tokens: {
                access: data.tokens.access,
                refresh: data.tokens.refresh || null
            },
            user: data.user || { email }
        });
        
        setIsAuthenticated(true);
        const userData = data.user || { email };
        setUser(userData);
        
        // If we didn't get full profile, fetch it but don't block
        if (!data.user?.role && !data.user?.is_staff) {
             userAPI.getProfile().then(profileRes => {
                setUser(profileRes.data);
                persistTokens((prev) => ({ ...prev, user: profileRes.data }));
            }).catch(e => console.error("Async profile fetch failed", e));
        }

        return { 
            success: true, 
            user: userData,
            redirectPath: getRedirectPath(userData)
        };
      }
      return { success: false, error: "Invalid response from server" };
    } catch (error) {
      console.error("Login error:", error);
      const resp = error.response?.data;
      let errMsg = "Login failed. Please try again.";
      
      if (resp) {
        if (typeof resp === 'string') errMsg = resp;
        else if (resp.detail) errMsg = resp.detail;
        else if (resp.non_field_errors) {
            errMsg = Array.isArray(resp.non_field_errors) 
                ? resp.non_field_errors.join(' ') 
                : String(resp.non_field_errors);
        }
        else if (typeof resp === 'object') {
          const parts = [];
          for (const k of Object.keys(resp)) {
            const v = resp[k];
            if (Array.isArray(v)) parts.push(`${k}: ${v.join(' ')}`);
            else parts.push(`${k}: ${String(v)}`);
          }
          if (parts.length) errMsg = parts.join(' | ');
        }
      }
      
      return { 
        success: false, 
        error: errMsg
      };
    }
  };

  const googleLogin = async (token) => {
    try {
      const { data } = await authAPI.googleLogin({ token });
      
      if (data.tokens && data.tokens.access) {
         persistTokens({
          loginAt: Date.now(),
            tokens: {
                access: data.tokens.access,
                refresh: data.tokens.refresh || null
            },
            user: data.user
        });
        
        setIsAuthenticated(true);
        const userData = data.user;
        setUser(userData);

        if (!userData?.role && !userData?.is_staff) {
             userAPI.getProfile().then(profileRes => {
                setUser(profileRes.data);
            }).catch(e => console.error("Async profile fetch failed", e));
        }

        return { 
            success: true, 
            user: userData,
            redirectPath: getRedirectPath(userData)
        };
      }
      return { success: false, error: "Invalid response from server" };
    } catch (error) {
      console.error("Google Login error:", error);
       return { 
        success: false, 
        error: error.response?.data?.detail || "Google Login failed." 
      };
    }
  };

  const signup = async (email, password) => {
    try {
      const { data } = await authAPI.signup({ email, password });
      return { success: true, message: data.detail || "Signup successful!" };
    } catch (error) {
      console.error("Signup error:", error);
      const resp = error.response?.data;
      let errMsg = "Signup failed. Please try again.";
      if (resp) {
        if (typeof resp === 'string') errMsg = resp;
        else if (resp.detail) errMsg = resp.detail;
        else if (resp.non_field_errors) {
            errMsg = Array.isArray(resp.non_field_errors) 
                ? resp.non_field_errors.join(' ') 
                : String(resp.non_field_errors);
        }
        else if (typeof resp === 'object') {
          // collect first field errors
          const parts = [];
          for (const k of Object.keys(resp)) {
            const v = resp[k];
            if (Array.isArray(v)) parts.push(`${k}: ${v.join(' ')}`);
            else parts.push(`${k}: ${String(v)}`);
          }
          if (parts.length) errMsg = parts.join(' | ');
        }
      }
      return { success: false, error: errMsg };
    }
  };

  const verifyEmail = async (email, otp) => {
    try {
      const { data } = await authAPI.verifyEmail({ email, otp });
      return { success: true, message: data.detail };
    } catch (error) {
      return { 
         success: false, 
         error: error.response?.data?.detail || "Verification failed." 
       };
    }
  };

  const resendOTP = async (email) => {
    try {
      const { data } = await authAPI.resendOTP({ email });
      return { success: true, message: data.detail };
    } catch (error) {
      console.error("Resend OTP error:", error);
      return { success: false, error: error.response?.data?.detail || "Failed to resend OTP." };
    }
  };

  const logout = async (callApi = true) => {
    if (callApi && isAuthenticated) {
        try {
        const storedRefresh = getStoredAuth()?.tokens?.refresh;
        await authAPI.logout(storedRefresh ? { refresh: storedRefresh } : undefined);
        } catch (err) {
            console.error("Logout API call failed", err);
        }
    }
    clearAuthAndRedirect();
    setUser(null);
    setIsAuthenticated(false);
    toast.success("Logged out successfully");
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    googleLogin,
    signup,
    verifyEmail,
    resendOTP,
    logout,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
