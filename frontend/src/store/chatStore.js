import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { io } from "socket.io-client";
import { API_URL } from "../lib/config.js";

export const useChatStore = defineStore("chat", () => {
  const rooms = ref([]);
  const activeRoomId = ref(null);
  const messages = ref([]);
  const socket = ref(null);
  const error = ref(null);

  const activeRoom = computed(() =>
    rooms.value.find((r) => r.id === activeRoomId.value),
  );

  const upsertRoom = (room) => {
    const existing = rooms.value.find((r) => r.id === room.id);
    if (existing) {
      Object.assign(existing, room);
    } else {
      rooms.value.push(room);
    }
  };

  const removeRoomLocally = (roomId) => {
    rooms.value = rooms.value.filter((r) => r.id !== roomId);
    if (activeRoomId.value === roomId) {
      activeRoomId.value = null;
      messages.value = [];
    }
  };

  const initChat = async (userId) => {
    try {
      if (socket.value) {
        socket.value.disconnect();
      }

      socket.value = io(API_URL);

      socket.value.on("connect", () => {
        socket.value.emit("identify", userId);
      });

      socket.value.on("connect_error", () => {
        error.value = "Connection lost. Trying to reconnect...";
      });

      socket.value.on("room_created", (newRoom) => {
        upsertRoom(newRoom);
      });

      socket.value.on("room_renamed", (data) => {
        const room = rooms.value.find((r) => r.id === Number(data.roomId));
        if (room) room.name = data.newName;
      });

      socket.value.on("room_deleted", (data) => {
        removeRoomLocally(Number(data.roomId));
      });

      socket.value.on("receive_message", (newMessage) => {
        if (activeRoomId.value === newMessage.roomId) {
          messages.value.push(newMessage);
        }
      });

      socket.value.on("message_error", (data) => {
        error.value = data.message || "Failed to send message.";
      });

      await fetchRooms(userId);
    } catch {
      error.value = "Failed to initialize chat connection.";
    }
  };

  const fetchRooms = async (userId) => {
    error.value = null;

    try {
      const response = await fetch(`${API_URL}/rooms?userId=${userId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch rooms from server.");
      }

      rooms.value = await response.json();
    } catch (err) {
      error.value = err.message;
    }
  };

  const changeRoom = async (roomId, userId) => {
    error.value = null;
    activeRoomId.value = roomId;

    if (socket.value) {
      socket.value.emit("join_room", roomId);
    }

    try {
      const messagesResponse = await fetch(
        `${API_URL}/rooms/${roomId}/messages?userId=${userId}`,
      );
      if (!messagesResponse.ok) {
        throw new Error("Failed to load message history.");
      }

      messages.value = await messagesResponse.json();
    } catch (err) {
      error.value = err.message;
    }
  };

  const createRoom = async (name, userId) => {
    error.value = null;
    try {
      const response = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, userId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create room.");
      }
      upsertRoom(data);
    } catch (err) {
      error.value = err.message;
    }
  };

  const renameRoom = async (roomId, userId, newName) => {
    error.value = null;
    try {
      const response = await fetch(`${API_URL}/rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName, userId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to rename room.");
      }
      const room = rooms.value.find((r) => r.id === roomId);
      if (room) room.name = data.name;
    } catch (err) {
      error.value = err.message;
    }
  };

  const deleteRoom = async (roomId, userId) => {
    error.value = null;
    try {
      const response = await fetch(`${API_URL}/rooms/${roomId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete room.");
      }
      removeRoomLocally(roomId);
    } catch (err) {
      error.value = err.message;
    }
  };

  const addMember = async (roomId, userId, username) => {
    error.value = null;
    try {
      const response = await fetch(`${API_URL}/rooms/${roomId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to add member.");
      }
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    }
  };

  const leaveRoom = async (roomId, userId) => {
    error.value = null;
    try {
      const response = await fetch(`${API_URL}/rooms/${roomId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to leave room.");
      }
      removeRoomLocally(roomId);
    } catch (err) {
      error.value = err.message;
    }
  };

  const searchUsers = async (query, userId) => {
    try {
      const response = await fetch(
        `${API_URL}/users?query=${encodeURIComponent(query)}&userId=${userId}`,
      );
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  };

  const sendMessage = (text, userId) => {
    if (!activeRoomId.value || !socket.value) return;
    socket.value.emit("send_message", {
      text,
      userId,
      roomId: activeRoomId.value,
    });
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }
    rooms.value = [];
    activeRoomId.value = null;
    messages.value = [];
    error.value = null;
  };

  return {
    rooms,
    activeRoomId,
    messages,
    error,
    activeRoom,
    initChat,
    changeRoom,
    createRoom,
    renameRoom,
    deleteRoom,
    addMember,
    leaveRoom,
    searchUsers,
    sendMessage,
    clearError,
    reset,
  };
});
