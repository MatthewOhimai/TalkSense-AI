import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { authAPI } from "../../services/apiClient";
import { toast } from "react-hot-toast";
import { Lock } from "lucide-react";

export const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        old_password: "",
        new_password: "",
        confirm_new_password: "",
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
        // Clear error when user starts typing
        if (errors[id]) {
            setErrors((prev) => ({ ...prev, [id]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.old_password) newErrors.old_password = "Current password is required";
        if (!formData.new_password) newErrors.new_password = "New password is required";
        if (formData.new_password && formData.new_password.length < 8) {
            newErrors.new_password = "Password must be at least 8 characters";
        }
        if (formData.new_password !== formData.confirm_new_password) {
            newErrors.confirm_new_password = "Passwords do not match";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSaving(true);
        try {
            await authAPI.changePassword(formData);
            toast.success("Password changed successfully!");
            setFormData({
                old_password: "",
                new_password: "",
                confirm_new_password: "",
            });
            onClose();
        } catch (error) {
            console.error("Change password error:", error);
            const resp = error.response?.data;
            if (resp) {
                if (resp.detail) toast.error(resp.detail);
                else if (typeof resp === 'object') {
                    setErrors(resp);
                    const firstError = Object.values(resp)[0];
                    toast.error(Array.isArray(firstError) ? firstError[0] : String(firstError));
                } else {
                    toast.error("Failed to change password");
                }
            } else {
                toast.error("An unexpected error occurred");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    id="old_password"
                    type="password"
                    label="Current Password"
                    placeholder="••••••••"
                    value={formData.old_password}
                    onChange={handleChange}
                    error={errors.old_password}
                    startIcon={Lock}
                    required
                />
                <Input
                    id="new_password"
                    type="password"
                    label="New Password"
                    placeholder="••••••••"
                    value={formData.new_password}
                    onChange={handleChange}
                    error={errors.new_password}
                    startIcon={Lock}
                    required
                />
                <Input
                    id="confirm_new_password"
                    type="password"
                    label="Confirm New Password"
                    placeholder="••••••••"
                    value={formData.confirm_new_password}
                    onChange={handleChange}
                    error={errors.confirm_new_password}
                    startIcon={Lock}
                    required
                />
                <div className="pt-4 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSaving}>
                        Update Password
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
