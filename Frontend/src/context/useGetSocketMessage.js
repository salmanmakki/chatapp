import React, { useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../zustand/useConversation.js";
import { useAuth } from "./AuthProvider";
import sound from "../assets/notification.mp3";

const useGetSocketMessage = () => {
  const { socket } = useSocketContext();
  const { messages, setMessage, selectedConversation } = useConversation();
  const [authUser] = useAuth();
  const myId = authUser?.user?._id;

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const notification = new Audio(sound);
      notification.play();
      // Just append the new message; status changes come from a separate
      // "messagesSeen" event so we don't rely on replies.
      setMessage([...messages, newMessage]);
    };

    const handleMessagesSeen = ({ conversationId, seenBy }) => {
      // Backend should emit this event when someone OPENS a chat and marks
      // messages as seen. When the other user (not me) opens this chat,
      // mark my outgoing messages in that conversation as seen so the UI
      // shows coloured double ticks.
      if (!myId) return;
      if (!selectedConversation || conversationId !== selectedConversation._id)
        return;
      if (seenBy === myId) return; // I opened, not the other user

      const updated = messages.map((msg) =>
        msg.senderId === myId ? { ...msg, status: "seen" } : msg
      );
      setMessage(updated);
    };

    const handleMessageUpdated = (updatedMessage) => {
      if (!updatedMessage?._id) return;
      const next = messages.map((m) =>
        m._id === updatedMessage._id ? { ...m, ...updatedMessage } : m
      );
      setMessage(next);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("messageUpdated", handleMessageUpdated);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("messageUpdated", handleMessageUpdated);
    };
  }, [socket, messages, setMessage, myId, selectedConversation]);
};

export default useGetSocketMessage;
