import React, { useState } from 'react';
import { useSocketContext } from '../context/SocketContext.jsx';
import useGetPendingMessages from '../context/useGetPendingMessages.js';
import axios from 'axios';
import API_CONFIG from '../config/api.js';
import { logger } from '../utils/logger.js';

function MessageRequests() {
  const { pendingMessages, loading, removePendingMessage } = useGetPendingMessages();
  const [acceptLoading, setAcceptLoading] = useState({});

  logger.log("MessageRequests component - current requests:", pendingMessages);

  const acceptRequest = async (messageId, senderId) => {
    logger.log("Accepting request for messageId:", messageId, "from sender:", senderId);
    logger.log("MessageId type:", typeof messageId);
    setAcceptLoading(prev => ({ ...prev, [messageId]: true }));
    try {
      logger.log("Making API call to:", `/api/message/accept-pending/${messageId}`);
      const response = await axios.post(`/api/message/accept-pending/${messageId}`, {}, {
        withCredentials: true
      });
      logger.log("Accept response:", response.data);
      
      // Remove from pending messages
      removePendingMessage(messageId);
      
      logger.log('Message request accepted successfully');
    } catch (error) {
      logger.error('Error accepting request:', error);
      logger.error('Error details:', error.response?.data);
      logger.error('Error status:', error.response?.status);
      logger.error('Error config:', error.config);
    } finally {
      setAcceptLoading(prev => ({ ...prev, [messageId]: false }));
    }
  };

  const deleteRequest = async (messageId) => {
    logger.log("Deleting request for messageId:", messageId);
    logger.log("MessageId type:", typeof messageId);
    setAcceptLoading(prev => ({ ...prev, [messageId]: true }));
    try {
      logger.log("Making delete API call to:", `/api/message/reject-pending/${messageId}`);
      const response = await axios.post(`/api/message/reject-pending/${messageId}`, {}, {
        withCredentials: true
      });
      logger.log("Delete response:", response.data);
      
      // Remove from pending messages
      removePendingMessage(messageId);
      
      logger.log('Message request deleted successfully');
    } catch (error) {
      logger.error('Error deleting request:', error);
      logger.error('Error details:', error.response?.data);
      logger.error('Error status:', error.response?.status);
      logger.error('Error config:', error.config);
    } finally {
      setAcceptLoading(prev => ({ ...prev, [messageId]: false }));
    }
  };

  if (pendingMessages.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-h-96 overflow-y-auto">
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/70 rounded-xl shadow-xl shadow-slate-950/50">
        <div className="p-4 border-b border-slate-700/70">
          <h3 className="text-white font-semibold">Message Requests</h3>
          <p className="text-slate-400 text-sm mt-1">
            {pendingMessages.length} {pendingMessages.length === 1 ? 'request' : 'requests'}
          </p>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {pendingMessages.map((request) => (
            <div key={request.messageId} className="p-4 border-b border-slate-700/70 last:border-b-0">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <img
                    src={
                      request.senderProfilePic?.startsWith("http")
                        ? request.senderProfilePic
                        : request.senderProfilePic?.startsWith("/uploads")
                        ? `${API_CONFIG.BASE_URL}${request.senderProfilePic}`
                        : request.senderProfilePic || "/user.jpg"
                    }
                    alt={request.senderName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium text-sm">
                      {request.senderName}
                    </h4>
                    <span className="text-slate-500 text-xs">
                      {new Date(request.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <p className="text-slate-300 text-sm mt-1 truncate">
                    {request.message}
                  </p>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => acceptRequest(request.messageId, request.senderId)}
                      disabled={acceptLoading[request.messageId]}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition"
                    >
                      {acceptLoading[request.messageId] ? '...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => deleteRequest(request.messageId)}
                      disabled={acceptLoading[request.messageId]}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition"
                    >
                      {acceptLoading[request.messageId] ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MessageRequests;
