/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider.jsx";
import io from "socket.io-client";
import API_CONFIG from "../config/api.js";
const socketContext = createContext();

// it is a hook.
export const useSocketContext = () => {
  return useContext(socketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [newMessageAlert, setNewMessageAlert] = useState(null);
  const [authUser] = useAuth();

  useEffect(() => {
    if (!authUser) {
      // Clear socket-related state on logout or when user is not available
      setSocket(null);
      setOnlineUsers([]);
      setNewMessageAlert(null);
      return;
    }

    const newSocket = io(API_CONFIG.SOCKET_URL, {
      query: {
        userId: authUser.user._id,
      },
    });

    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // Listen for new messages to update contact list
    newSocket.on("newMessage", (message) => {
      setNewMessageAlert(message);
    });

    return () => {
      newSocket.close();
      setSocket(null);
      setOnlineUsers([]);
      setNewMessageAlert(null);
    };
  }, [authUser]);
  return (
    <socketContext.Provider value={{ socket, onlineUsers, newMessageAlert }}>
      {children}
    </socketContext.Provider>
  );
};
