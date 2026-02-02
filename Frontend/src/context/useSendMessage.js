import React, { useState } from "react";
import useConversation from "../zustand/useConversation.js";
import axios from "axios";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessage, selectedConversation } = useConversation();

  const appendMessage = (savedMessage) => {
    const enhancedMessage = { ...savedMessage, status: savedMessage.status || "sent" };
    setMessage([...messages, enhancedMessage]);
  };

  const replaceMessage = (updatedMessage) => {
    const next = messages.map((m) =>
      m._id === updatedMessage._id ? { ...m, ...updatedMessage } : m
    );
    setMessage(next);
  };

  // Send text OR attachment (image/video/document)
  // kind: "image" | "video" | "document" | undefined
  const sendMessages = async (message, file, kind) => {
    if (!selectedConversation?._id) return;

    setLoading(true);
    try {
      let res;

      if (file) {
        const formData = new FormData();
        if (message && message.trim().length > 0) {
          formData.append("message", message);
        }

        if (kind === "image") {
          formData.append("image", file);
          res = await axios.post(
            `/api/message/send-image/${selectedConversation._id}`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
        } else {
          // video / document
          if (kind) formData.append("kind", kind);
          formData.append("file", file);
          res = await axios.post(
            `/api/message/send-file/${selectedConversation._id}`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
        }
      } else {
        res = await axios.post(`/api/message/send/${selectedConversation._id}`, {
          message,
        });
      }

      appendMessage(res.data);
    } catch (error) {
      console.log("Error in send messages", error);
    } finally {
      setLoading(false);
    }
  };

  const sendLocation = async ({ lat, lng, label }) => {
    if (!selectedConversation?._id) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `/api/message/send-location/${selectedConversation._id}`,
        { lat, lng, label }
      );
      appendMessage(res.data);
    } catch (error) {
      console.log("Error sending location", error);
    } finally {
      setLoading(false);
    }
  };

  const sendContact = async ({ name, phone, email }) => {
    if (!selectedConversation?._id) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `/api/message/send-contact/${selectedConversation._id}`,
        { name, phone, email }
      );
      appendMessage(res.data);
    } catch (error) {
      console.log("Error sending contact", error);
    } finally {
      setLoading(false);
    }
  };

  const sendPoll = async ({ question, options, allowMultiple }) => {
    if (!selectedConversation?._id) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `/api/message/send-poll/${selectedConversation._id}`,
        { question, options, allowMultiple }
      );
      appendMessage(res.data);
    } catch (error) {
      console.log("Error sending poll", error);
    } finally {
      setLoading(false);
    }
  };

  const votePoll = async ({ messageId, optionId }) => {
    setLoading(true);
    try {
      const res = await axios.post(`/api/message/vote/${messageId}`, { optionId });
      replaceMessage(res.data);
    } catch (error) {
      console.log("Error voting poll", error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendMessages, sendLocation, sendContact, sendPoll, votePoll };
};

export default useSendMessage;
