import { useEffect, useState } from "react";
import axios from "axios";
import { useSocketContext } from "./SocketContext.jsx";

function useGetAllUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { newMessageAlert } = useSocketContext();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/user/allusers", {
        withCredentials: true,
      });
      setAllUsers(
        Array.isArray(res.data) ? res.data : res.data.users || []
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Update users list locally when new message is received (without full refresh)
  useEffect(() => {
    if (newMessageAlert) {
      setAllUsers(prevUsers => {
        const updatedUsers = [...prevUsers];
        const messageSenderId = newMessageAlert.senderId;
        const messageReceiverId = newMessageAlert.receiverId;
        
        // Find the user who sent/received the message
        const userIndex = updatedUsers.findIndex(user => 
          user._id === messageSenderId || user._id === messageReceiverId
        );
        
        if (userIndex !== -1) {
          // Update the user's last message and time
          updatedUsers[userIndex] = {
            ...updatedUsers[userIndex],
            lastMessage: newMessageAlert,
            lastMessageTime: newMessageAlert.createdAt
          };
          
          // Move this user to the top (most recent)
          const [updatedUser] = updatedUsers.splice(userIndex, 1);
          updatedUsers.unshift(updatedUser);
        }
        
        return updatedUsers;
      });
    }
  }, [newMessageAlert]);

  return [allUsers, loading];
}

export default useGetAllUsers;
