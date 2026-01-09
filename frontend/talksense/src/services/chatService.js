import apiClient, { getAccessToken } from "./apiClient";

/**
 * Service for handling chat-related API calls
 */
const chatService = {
  // ... existing methods ...
  /**
   * List all chat sessions for the current user
   */
  getSessions: () => apiClient.get("/chat/sessions/"),

  /**
   * Get archived sessions
   */
  getArchivedSessions: () => apiClient.get("/chat/sessions/archived/"),

  /**
   * Create a new chat session
   * @param {Object} data - { title: string } (optional)
   */
  createSession: (data = {}) => apiClient.post("/chat/sessions/", data),

  /**
   * Get a specific chat session with its messages
   * @param {string|number} sessionId
   */
  getSession: (sessionId) => apiClient.get(`/chat/sessions/${sessionId}/`),

  /**
   * Update session details (like title)
   * @param {string|number} sessionId
   * @param {Object} data - { title: string }
   */
  updateSession: (sessionId, data) =>
    apiClient.patch(`/chat/sessions/${sessionId}/`, data),

  /**
   * Archive a session
   * @param {string|number} sessionId
   */
  archiveSession: (sessionId) =>
    apiClient.post(`/chat/sessions/${sessionId}/archive/`),

  /**
   * Unarchive a session
   * @param {string|number} sessionId
   */
  unarchiveSession: (sessionId) =>
    apiClient.post(`/chat/sessions/${sessionId}/unarchive/`),

  /**
   * Delete a session
   * @param {string|number} sessionId
   */
  deleteSession: (sessionId) =>
    apiClient.delete(`/chat/sessions/${sessionId}/`),

  /**
   * Pin a session
   * @param {string|number} sessionId
   */
  pinSession: (sessionId) => apiClient.post(`/chat/sessions/${sessionId}/pin/`),

  /**
   * Unpin a session
   * @param {string|number} sessionId
   */
  unpinSession: (sessionId) =>
    apiClient.post(`/chat/sessions/${sessionId}/unpin/`),

  /**
   * Send a message to a session
   * @param {Object} data - { session_id, content, use_rag, temperature }
   */
  sendMessage: (data) => apiClient.post("/chat/messages/", data),

  /**
   * Rate an AI message
   * @param {string|number} messageId
   * @param {number} rating - 1 to 5
   */
  rateMessage: (messageId, rating) =>
    apiClient.post(`/chat/messages/${messageId}/rate/`, { rating }),

  /**
   * Stream a message via fetch (to support Auth headers)
   */
  streamMessage: async (data, onChunk, onComplete, onError) => {
    try {
      const baseUrl = apiClient.defaults.baseURL;
      const token = getAccessToken();

      const response = await fetch(`${baseUrl}/chat/messages/stream/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // EventSource format: "data: chunk\n\n"
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const text = line.replace("data: ", "");
            fullText += text;
            onChunk(text);
          }
        }
      }

      onComplete?.(fullText);
    } catch (error) {
      console.error("Streaming error:", error);
      // Pass a sanitized error - don't expose raw API details
      onError?.(new Error("Something went wrong. Please try again."));
    }
  },

  /**
   * Get a public chat session (no auth required)
   * @param {string} sessionId
   */
  getPublicSession: (sessionId) =>
    apiClient.get(`/chat/sessions/${sessionId}/public/`),

  /**
   * Toggle public sharing for a session
   * @param {string} sessionId
   */
  togglePublic: (sessionId) =>
    apiClient.post(`/chat/sessions/${sessionId}/toggle_public/`),
};

export default chatService;
