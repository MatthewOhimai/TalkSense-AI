import api from "./apiClient";

export const adminAPI = {
  /**
   * Get all analytics summary
   * @param {number} days - Number of days of data to fetch (default: 30)
   */
  getAnalytics: (days = 30) => api.get(`/chat/admin/?days=${days}`),

  /**
   * Get engagement trends for daily charts
   * @param {number} days - Number of days to fetch trends for
   */
  getTrends: (days = 7) => api.get(`/chat/admin/trends/?days=${days}`),

  searchLogs: (query = "") =>
    api.get(`/chat/admin/logs/?q=${encodeURIComponent(query)}`),

  /**
   * Trigger the automated feedback dataset export
   */
  triggerExport: () => api.post("/chat/admin/trigger_export/"),

  /**
   * Knowledge Base management
   */
  getKnowledgeBase: () => api.get("/chat/knowledge/"),

  uploadDocument: (formData) =>
    api.post("/chat/knowledge/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deleteDocument: (id) => api.delete(`/chat/knowledge/${id}/`),

  /**
   * User Management
   */
  getUsers: (search = "") =>
    api.get(`/chat/users/?search=${encodeURIComponent(search)}`),
  toggleUserStatus: (id) => api.post(`/chat/users/${id}/toggle_status/`),

  /**
   * System Settings (Model Swapper etc.)
   */
  getSettings: () => api.get("/chat/settings/"),
  updateSetting: (key, value) =>
    api.post("/chat/settings/update_setting/", { key, value }),
};

export default adminAPI;
