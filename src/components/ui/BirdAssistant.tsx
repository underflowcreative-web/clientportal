"use client";

import React, { useState, useRef, useEffect } from "react";
import Button from "./Button";
import Input from "./Input";

interface Message {
  id: string;
  sender: "scribe" | "user";
  text: string;
  timestamp: Date;
}

export default function BirdAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "scribe",
      text: "Greetings! I am the ClientHub Assistant, here to guide you. Ask me anything about your project workspace, milestones, files, or invoices, and I will be happy to assist.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const responseText = getScribeResponse(input);
      const scribeMessage: Message = {
        id: Math.random().toString(),
        sender: "scribe",
        text: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, scribeMessage]);
    }, 800);
  };

  const getScribeResponse = (query: string): string => {
    const q = query.toLowerCase();
    
    if (q.includes("project") || q.includes("work")) {
      return "You can view active projects in the 'Projects' area. There you will find progress, current statuses (like Development or Testing), and estimated launch dates.";
    }
    if (q.includes("milestone") || q.includes("timeline") || q.includes("progress")) {
      return "The timelines are under the 'Timeline' tab. It shows completed milestones (in mint green) and upcoming project targets.";
    }
    if (q.includes("invoice") || q.includes("pay") || q.includes("bill") || q.includes("money")) {
      return "Your invoices and balance details are in the 'Invoices' section. You can check issue dates, due dates, outstanding balances, and download PDF copies.";
    }
    if (q.includes("file") || q.includes("upload") || q.includes("download") || q.includes("asset")) {
      return "To share design files or download completed assets, visit the 'Files' center. You can securely upload multiple file formats directly into your project workspace folder.";
    }
    if (q.includes("request") || q.includes("change") || q.includes("revision")) {
      return "To request edits, revisions, or log design changes, use the 'Requests' page. You can set the priority to Low, Medium, or High and check our progress.";
    }
    if (q.includes("help") || q.includes("what is this") || q.includes("how to")) {
      return "This portal is your personal dashboard to collaborate with our creative team. Use the left sidebar to navigate and track your active projects, timelines, files, and billing.";
    }
    if (q.includes("hello") || q.includes("hi") || q.includes("greetings")) {
      return "Greetings! How can I assist you with your projects today?";
    }
    
    return "I have logged your query. For direct consultation with our designers, you may also email us directly at underflow.creative@gmail.com. What else can I help you find?";
  };

  // Stationary styling (bottom-right of screen)
  const birdStyle: React.CSSProperties = isOpen
    ? {
        position: "absolute",
        top: "-46px",
        left: "12px",
        zIndex: 55,
      }
    : {
        position: "fixed",
        right: "24px",
        bottom: "24px",
        zIndex: 50,
      };

  return (
    <div className="z-50 font-sans">
      {/* Custom CSS for gentle hover and glowing wings */}
      <style>{`
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }
        @keyframes softPulseGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(215, 137, 127, 0.4)); }
          50% { filter: drop-shadow(0 0 10px rgba(215, 137, 127, 0.7)); }
        }
        .phoenix-hover-float {
          animation: gentleFloat 3s infinite ease-in-out, softPulseGlow 3s infinite ease-in-out;
        }
      `}</style>

      {/* "May I help you" Speech Bubble (Visible only when closed) */}
      {!isOpen && (
        <div className="fixed right-20 bottom-8 flex items-center pointer-events-none z-50 animate-bounce">
          <div className="bg-white border border-[#EADFD9] text-[#3A2E2C] text-xs font-semibold px-3.5 py-2 rounded-full shadow-[0_4px_12px_rgba(99,152,169,0.06)] flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 bg-[#96C7B3] rounded-full animate-pulse" />
            May I help you?
          </div>
          {/* Bubble Arrow pointing to the bird */}
          <div className="w-2 h-2 bg-white border-r border-b border-[#EADFD9] rotate-[-45deg] -translate-x-1" />
        </div>
      )}

      {/* The Interactive Phoenix Bird */}
      <div 
        style={birdStyle}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto cursor-pointer hover:scale-105 transition-transform duration-200"
      >
        <div className={isOpen ? "filter drop-shadow-[0_0_6px_rgba(215,137,127,0.5)]" : "phoenix-hover-float"}>
          <svg 
            viewBox="0 0 64 64" 
            className="w-14 h-14 select-none active:scale-95 transition-transform duration-200"
          >
            <defs>
              <linearGradient id="pastelFireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F9B95C" /> {/* Pêche */}
                <stop offset="60%" stopColor="#D7897F" /> {/* Nectarine */}
                <stop offset="100%" stopColor="#C3766D" />
              </linearGradient>
            </defs>
            {/* Left Wing */}
            <path 
              d="M 32,28 C 22,12 8,16 6,26 C 12,30 20,28 32,32 Z" 
              fill="url(#pastelFireGrad)" 
            />
            {/* Right Wing */}
            <path 
              d="M 32,28 C 42,12 56,16 58,26 C 52,30 44,28 32,32 Z" 
              fill="url(#pastelFireGrad)" 
            />
            {/* Tail Flame Feathers */}
            <path 
              d="M 28,32 C 26,45 20,54 32,60 C 44,54 38,45 36,32 C 34,36 30,36 28,32 Z" 
              fill="url(#pastelFireGrad)" 
              opacity="0.9" 
            />
            {/* Inner Flame Streak */}
            <path 
              d="M 30,32 C 30,40 27,47 32,53 C 37,47 34,40 34,32 Z" 
              fill="#F9B95C" 
              opacity="0.8" 
            />
            {/* Body */}
            <path 
              d="M 27,26 C 27,15 37,15 37,26 C 37,34 33,40 32,40 C 31,40 27,34 27,26 Z" 
              fill="url(#pastelFireGrad)" 
            />
            {/* Head & Crest */}
            <circle cx="32" cy="15" r="4.5" fill="#F9B95C" />
            <polygon points="32,9 34,13 30,13" fill="#D7897F" />
            {/* Beak */}
            <polygon points="32,12 35,15 32,15" fill="#F9B95C" />
          </svg>
        </div>
      </div>

      {/* Chat Window (frosted-glass pastel design) */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[460px] bg-white/95 backdrop-blur-md border border-[#EADFD9] rounded-2xl shadow-[0_20px_50px_rgba(99,152,169,0.12)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FAF6F2] to-[#F5ECE8] px-4 py-3 border-b border-[#EADFD9] flex items-center gap-3 pl-16">
            <div>
              <p className="text-sm font-semibold text-[#D7897F] tracking-wide uppercase">ClientHub Assistant</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#96C7B3] rounded-full animate-pulse" />
                <span className="text-[10px] text-[#7E6E6A] font-semibold uppercase tracking-wider">Online</span>
              </div>
            </div>
            
            {/* Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="ml-auto text-[#7E6E6A] hover:text-[#D7897F] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#6398A9] text-white font-medium rounded-tr-none shadow-[0_4px_12px_rgba(99,152,169,0.2)]"
                      : "bg-[#F5ECE8] text-[#3A2E2C] border border-[#EADFD9]/60 rounded-tl-none shadow-sm"
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.sender === "user" ? "text-white/70" : "text-[#7E6E6A]"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-[#FAF6F2]/80 border-t border-[#EADFD9] flex gap-2"
          >
            <div className="flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the assistant..."
                className="w-full bg-white border border-[#EADFD9] rounded-lg px-3 py-2 text-sm text-[#3A2E2C] placeholder-gray-400 focus:outline-none focus:border-[#6398A9]/60 focus:ring-1 focus:ring-[#6398A9]/60"
              />
            </div>
            <button
              type="submit"
              className="bg-[#6398A9] hover:bg-[#D7897F] text-white font-semibold px-4 rounded-lg text-sm flex items-center justify-center cursor-pointer transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
