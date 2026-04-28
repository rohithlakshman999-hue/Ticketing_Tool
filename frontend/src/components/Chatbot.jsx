import React, { useState } from 'react';
import api from '../services/api';
import { MessageSquare, X } from 'lucide-react';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'bot', text: 'Hi! Let me try to help before you create a ticket. What seems to be the issue?' }]);
  const [input, setInput] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const res = await api.post('/ai/chat', { message: userMessage.text });
      setMessages(prev => [...prev, { sender: 'bot', text: res.data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Oops! AI Service unavailable.' }]);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-transform hover:scale-105 z-50 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-8 right-8 w-[350px] h-[450px] bg-white rounded-xl shadow-2xl z-50 flex flex-col border border-gray-200 overflow-hidden">
          <div className="p-4 bg-blue-600 text-white flex justify-between items-center shadow-sm">
            <strong className="font-semibold tracking-wide">AI Assistant</strong>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex border-t border-gray-200 bg-white p-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 p-2 outline-none text-sm text-gray-800" 
            />
            <button type="submit" className="px-4 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default Chatbot;
