import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { userAPI, persistTokens } from "../../services/apiClient";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { toast } from "react-hot-toast";
import { User, Mail, Upload, Loader2, LogOut, KeyRound } from "lucide-react";
import { resolveImageUrl } from "../../lib/utils";
import { ChangePasswordModal } from "../../components/profile/ChangePasswordModal";

const ProfilePage = () => {
    const { logout, setUser: setContextUser } = useAuth(); // Ensure AuthContext exposes setUser if possible, or we reload
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
    });
    const [profilePicture, setProfilePicture] = useState(null); // File object
    const [previewUrl, setPreviewUrl] = useState(null); // Preview URL
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [authProvider, setAuthProvider] = useState("email");

    // Fetch latest profile data on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                 const { data } = await userAPI.getProfile();
                 setFormData({
                     first_name: data.first_name || "",
                     last_name: data.last_name || "",
                     email: data.email || "",
                 });
                 setAuthProvider(data.auth_provider || "email");
                 if (data.profile_picture) {
                     const resolvedUrl = resolveImageUrl(data.profile_picture);
                     setPreviewUrl(resolvedUrl);
                 }
            } catch (error) {
                console.error("Failed to fetch profile", error);
                toast.error("Failed to load profile data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Always send multipart so the API consistently parses file/fields
            const submitData = new FormData();
            submitData.append("first_name", formData.first_name);
            submitData.append("last_name", formData.last_name);
            if (profilePicture) {
                submitData.append("profile_picture", profilePicture);
            }

            const { data } = await userAPI.updateProfile(submitData);

            toast.success("Profile updated successfully!");
            // Update local form state with returned data
            setFormData((prev) => ({
                ...prev,
                first_name: data.first_name || prev.first_name,
                last_name: data.last_name || prev.last_name,
                email: data.email || prev.email,
            }));
            if (data.profile_picture) {
                setPreviewUrl(resolveImageUrl(data.profile_picture));
            }

            const updatedUser = {
                ...data,
                profile_picture: resolveImageUrl(data.profile_picture),
            };

            // Update global auth user so other parts reflect changes
            if (typeof setContextUser === 'function') {
                setContextUser((u) => ({ ...(u || {}), ...updatedUser }));
            }
            // Persist updated user in localStorage so other tabs / reloads reflect change
            try {
                persistTokens((current) => {
                    if (!current) return current;
                    return { ...current, user: { ...(current.user || {}), ...updatedUser } };
                });
            } catch (e) {
                console.error("Failed to persist updated user:", e);
            }

        } catch (error) {
            console.error("Profile update error:", error);
            const resp = error.response?.data;
            if (resp) {
                // try to show meaningful message
                if (resp.detail) toast.error(resp.detail);
                else if (typeof resp === 'object') {
                    const parts = [];
                    for (const k of Object.keys(resp)) {
                        const v = resp[k];
                        if (Array.isArray(v)) parts.push(`${k}: ${v.join(' ')}`);
                        else parts.push(`${k}: ${String(v)}`);
                    }
                    toast.error(parts.join(' | '));
                } else {
                    toast.error(String(resp));
                }
            } else {
                toast.error("Failed to update profile.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-8">My Profile</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar / Actions */}
                <div className="md:col-span-1 space-y-6">
                     <Card className="p-6 text-center">
                        <div className="relative w-32 h-32 mx-auto mb-4">
                            {previewUrl ? (
                                <img 
                                    src={previewUrl} 
                                    alt="Profile" 
                                    className="w-full h-full rounded-full object-cover border-4 border-slate-100"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <User className="w-12 h-12" />
                                </div>
                            )}
                            <label 
                                htmlFor="profile-upload" 
                                className="absolute bottom-0 right-0 bg-[var(--color-primary)] text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                                title="Change Profile Picture"
                            >
                                <Upload className="w-4 h-4" />
                                <input 
                                    type="file" 
                                    id="profile-upload" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                        <h2 className="text-xl font-semibold text-[var(--color-text-main)]">
                            {formData.first_name} {formData.last_name}
                        </h2>
                        <p className="text-sm text-[var(--color-text-muted)]">{formData.email}</p>
                     </Card>


                     {authProvider === "email" ? (
                         <Button 
                            variant="outline" 
                            onClick={() => setIsChangePasswordOpen(true)} 
                            className="w-full mb-3"
                         >
                            <KeyRound className="w-4 h-4 mr-2" />
                            Change Password
                         </Button>
                     ) : (
                         <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-3 text-center">
                             <p className="text-xs text-slate-500">
                                Password is managed via <span className="font-semibold capitalize">{authProvider}</span>
                             </p>
                         </div>
                     )}

                     <Button 
                        variant="outline" 
                        onClick={() => logout()} 
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                     >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                     </Button>
                </div>

                {/* Main Content / Form */}
                <div className="md:col-span-2">
                    <Card className="p-8">
                        <h3 className="text-xl font-semibold mb-6">Personal Information</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Input
                                        id="first_name"
                                        label="First Name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        placeholder="Jane"
                                    />
                                </div>
                                <div>
                                    <Input
                                        id="last_name"
                                        label="Last Name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        placeholder="Doe"
                                    />
                                </div>
                             </div>

                             <div>
                                <Input
                                    id="email"
                                    type="email"
                                    label="Email Address"
                                    value={formData.email}
                                    disabled
                                    startIcon={Mail}
                                    className="bg-slate-50 text-slate-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Email address cannot be changed.
                                </p>
                             </div>

                             <div className="pt-4 flex justify-end">
                                <Button type="submit" isLoading={isSaving} className="px-8">
                                    Save Changes
                                </Button>
                             </div>
                        </form>
                    </Card>
                </div>
            </div>

            <ChangePasswordModal 
                isOpen={isChangePasswordOpen} 
                onClose={() => setIsChangePasswordOpen(false)} 
            />
        </div>
    );
};

export default ProfilePage;
