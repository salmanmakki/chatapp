import { useEffect, useState } from "react";
import axios from "axios";
import { useSocketContext } from "./SocketContext.jsx";

function useGetPendingMessages() {
  const [pendingMessages, setPendingMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocketContext();

  const fetchPendingMessages = async () => {
    try {
      setLoading(true);
      console.log("Fetching pending messages...");
      // Get all messages with status "pending" for current user
      const res = await axios.get("/api/message/pending-messages", {
        withCredentials: true
      });
      console.log("Pending messages response:", res.data);
      setPendingMessages(res.data || []);
    } catch (error) {
      console.error("Error fetching pending messages:", error);
      console.error("Error details:", error.response?.data);
      setPendingMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch pending messages when socket connects
    if (socket) {
      console.log("Socket connected, fetching pending messages...");
      fetchPendingMessages();
      
      // Listen for new message requests
      socket.on("messageRequest", (data) => {
        console.log("Received message request via socket:", data);
        setPendingMessages(prev => [...prev, data]);
      });
    }
  }, [socket]);

  // Periodically check for new pending messages (for when user comes online)
  useEffect(() => {
    const interval = setInterval(() => {
      if (socket && socket.connected) {
        fetchPendingMessages();
      }
    }, 120000); // Check every 2 minutes instead of 60 seconds

    return () => clearInterval(interval);
  }, [socket]);

  const removePendingMessage = (messageId) => {
    setPendingMessages(prev => prev.filter(msg => msg.messageId !== messageId));
  };

  return { pendingMessages, loading, fetchPendingMessages, removePendingMessage };
}

export default useGetPendingMessages;
