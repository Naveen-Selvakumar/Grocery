import { useState, useRef, useEffect } from 'react'
import '../styles/chatbot.css'

const INITIAL_MESSAGE = {
  id: 1,
  from: 'bot',
  text: "👋 Hi! I'm **GrocyBot**, your Smart Grocery assistant!\n\nI can help you with:\n• 🛒 Products & Categories\n• 📦 Orders & Tracking\n• 💳 Payments & Checkout\n• 🚚 Delivery Information\n• 🔄 Returns & Refunds\n\nHow can I help you today?",
  time: new Date(),
}

const QUICK_REPLIES = [
  'Track my order',
  'Payment methods',
  'Delivery time',
  'Return policy',
  'How to checkout',
]

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Render simple markdown-style bold text (**text**)
function renderText(text) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <span key={i}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    )
  })
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isMinimized, isTyping])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  const openChat = () => {
    setIsOpen(true)
    setIsMinimized(false)
    setHasUnread(false)
  }

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev)
    if (isMinimized) setHasUnread(false)
  }

  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const sendMessage = async (text) => {
    const userText = (text || input).trim()
    if (!userText) return

    // Add user message
    const userMsg = { id: Date.now(), from: 'user', text: userText, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      })
      const data = await res.json()

      // Simulate a small typing delay for natural feel
      setTimeout(() => {
        setIsTyping(false)
        const botMsg = {
          id: Date.now() + 1,
          from: 'bot',
          text: data.success ? data.reply : "⚠️ Sorry, I couldn't process that. Please try again.",
          time: new Date(),
        }
        setMessages(prev => [...prev, botMsg])
        if (isMinimized) setHasUnread(true)
      }, 600)
    } catch {
      setTimeout(() => {
        setIsTyping(false)
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            from: 'bot',
            text: '⚠️ Unable to connect. Please check your internet connection and try again.',
            time: new Date(),
          },
        ])
      }, 600)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE])
  }

  return (
    <>
      {/* ── Floating Toggle Button ── */}
      {!isOpen && (
        <button
          className="chatbot-fab"
          onClick={openChat}
          aria-label="Open chat"
          title="Chat with GrocyBot"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {hasUnread && <span className="chatbot-fab-badge" />}
        </button>
      )}

      {/* ── Chat Window ── */}
      {isOpen && (
        <div className={`chatbot-window ${isMinimized ? 'chatbot-window--minimized' : ''}`}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🤖</div>
              <div>
                <div className="chatbot-name">GrocyBot</div>
                <div className="chatbot-status">
                  <span className="chatbot-status-dot" />
                  Online
                </div>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button onClick={clearChat} title="Clear chat" className="chatbot-icon-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
              <button onClick={toggleMinimize} title={isMinimized ? 'Expand' : 'Minimize'} className="chatbot-icon-btn">
                {isMinimized ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </button>
              <button onClick={closeChat} title="Close" className="chatbot-icon-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="chatbot-messages">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`chatbot-msg chatbot-msg--${msg.from}`}
                  >
                    {msg.from === 'bot' && (
                      <div className="chatbot-msg-avatar">🤖</div>
                    )}
                    <div className="chatbot-msg-content">
                      <div className="chatbot-msg-bubble">
                        {renderText(msg.text)}
                      </div>
                      <div className="chatbot-msg-time">{formatTime(msg.time)}</div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="chatbot-msg chatbot-msg--bot">
                    <div className="chatbot-msg-avatar">🤖</div>
                    <div className="chatbot-msg-content">
                      <div className="chatbot-msg-bubble chatbot-typing">
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies */}
              <div className="chatbot-quick-replies">
                {QUICK_REPLIES.map(qr => (
                  <button
                    key={qr}
                    className="chatbot-quick-btn"
                    onClick={() => sendMessage(qr)}
                  >
                    {qr}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="chatbot-input-area">
                <input
                  ref={inputRef}
                  type="text"
                  className="chatbot-input"
                  placeholder="Type a message…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={500}
                  disabled={isTyping}
                />
                <button
                  className="chatbot-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  aria-label="Send message"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
