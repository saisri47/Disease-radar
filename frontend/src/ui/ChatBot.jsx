import React, { useState, useRef, useEffect } from 'react';
import { apiUrl } from '../config';
import '../styles/ChatBot.css';

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hello! I'm your AI Health Assistant. Ask me about precautions for any symptoms like fever, cough, headache, and more.",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call backend API
      const response = await fetch(apiUrl('/api/precautions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: inputValue,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage = {
          id: messages.length + 2,
          text: data.response,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const errorMessage = {
          id: messages.length + 2,
          text: '❌ Sorry, I encountered an error. Please try again.',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        text: '❌ Unable to connect. Please make sure the backend is running.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          className="chat-button"
          onClick={() => setIsOpen(true)}
          title="Open AI Health Assistant"
        >
          💬
        </button>
      )}

      {/* Chat Popup */}
      {isOpen && (
        <div className="chat-popup">
          {/* Header */}
          <div className="chat-header">
            <h3>🤖 Health Assistant</h3>
            <button
              className="close-button"
              onClick={() => setIsOpen(false)}
              title="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-content">{msg.text}</div>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="message bot-message">
                <div className="message-content">
                  <span className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              placeholder="Ask about precautions..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="chat-input"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="send-button"
            >
              →
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;
