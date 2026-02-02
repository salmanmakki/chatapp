import React, { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation.js";
import axios from "axios";
const useGetMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessage, selectedConversation } = useConversation();

  useEffect(() => {
    const getMessages = async () => {
      setLoading(true);
      if (selectedConversation && selectedConversation._id) {
        try {
          const res = await axios.get(
            `/api/message/get/${selectedConversation._id}`
          );
          setMessage(res.data);

          // Tell backend: I have opened this chat, so mark messages that were
          // sent TO me in this conversation as seen. The backend should then
          // emit a "messagesSeen" socket event to the sender so their UI can
          // switch to coloured double ticks.
          try {
            await axios.post(
              `/api/message/mark-seen/${selectedConversation._id}`
            );
          } catch (err) {
            console.log("Error marking messages as seen", err);
          }

          setLoading(false);
        } catch (error) {
          console.log("Error in getting messages", error);
          setLoading(false);
        }
      }
    };
    getMessages();
  }, [selectedConversation, setMessage]);
  return { loading, messages };
};

export default useGetMessage;
