import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Menu, X, Terminal, Image, Bolt, User, LogOut, Send, 
  Copy, Check, Bookmark, BookmarkCheck, Plus, Trash2, HelpCircle,
  Sun, Moon
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : "");

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Sidebar drawers state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("history"); // "history" or "saved"

  // App workspace states
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Form states
  const [inputVal, setInputVal] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general"); // "ui", "code", "image", "general"
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  const [attachedImage, setAttachedImage] = useState(null);
  const [attachedImagePreview, setAttachedImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Only image files are supported.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedImage(reader.result);
      setAttachedImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachedImage = () => {
    setAttachedImage(null);
    setAttachedImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Initialize data
  useEffect(() => {
    fetchThreads();
    fetchSavedPrompts();
    fetchTemplates();
  }, []);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  /* ==========================================================================
     API Calls
     ========================================================================== */
  const fetchThreads = async () => {
    try {
      const res = await fetch(`${API_URL}/api/threads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
      }
    } catch (err) {
      console.error("Fetch threads error:", err);
    }
  };

  const fetchSavedPrompts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prompts/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedPrompts(data);
      }
    } catch (err) {
      console.error("Fetch saved prompts error:", err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prompts/templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("Fetch templates error:", err);
    }
  };

  const loadThread = async (threadId) => {
    try {
      const res = await fetch(`${API_URL}/api/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveThread(data.thread);
        setMessages(data.messages);
        setSelectedCategory(data.thread.category || "general");
        setSidebarOpen(false);
      }
    } catch (err) {
      console.error("Load thread error:", err);
    }
  };

  const startNewThread = () => {
    setActiveThread({
      _id: "new",
      title: "New Thread",
      category: selectedCategory,
      createdAt: new Date().toISOString(),
    });
    setMessages([]);
    setSidebarOpen(false);
  };

  const deleteThread = async (e, threadId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this session?")) return;

    try {
      const res = await fetch(`${API_URL}/api/threads/${threadId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setThreads(threads.filter((t) => t._id !== threadId));
        if (activeThread?._id === threadId) {
          setActiveThread(null);
          setMessages([]);
        }
        showToast("Session removed");
      }
    } catch (err) {
      console.error("Delete thread error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawInput = inputVal.trim();
    if (!rawInput) return;

    let currentThread = activeThread;
    
    // Auto-create a thread if none is active or if it's the unsaved "new" thread
    if (!currentThread || currentThread._id === "new") {
      try {
        const res = await fetch(`${API_URL}/api/threads`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: "New Thread", category: selectedCategory }),
        });
        if (res.ok) {
          currentThread = await res.json();
          setThreads([currentThread, ...threads]);
          setActiveThread(currentThread);
        } else {
          return;
        }
      } catch (err) {
        console.error("Create thread on send error:", err);
        return;
      }
    }

    // Append user message immediately with image preview if attached
    const userMsg = { 
      role: "user", 
      rawInput, 
      imageUrl: attachedImagePreview, 
      timestamp: new Date() 
    };
    setMessages((prev) => [...prev, userMsg]);
    
    // Cache the image to send to backend, then clear the input fields
    const imageToSend = attachedImage;
    setInputVal("");
    removeAttachedImage();
    setSending(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }

    try {
      const res = await fetch(`${API_URL}/api/threads/${currentThread._id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          rawInput, 
          category: selectedCategory,
          imageUrl: imageToSend 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update messages with saved user message and assistant message
        setMessages((prev) => {
          // Remove the temporary user message and add backend response
          const filtered = prev.filter((m) => m.timestamp !== userMsg.timestamp);
          return [...filtered, data.userMessage, data.assistantMessage];
        });
        
        // Update threads list to reflect title updates
        fetchThreads();
      }
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setSending(false);
    }
  };

  const savePrompt = async (message) => {
    const title = window.prompt("Enter a label for this saved prompt:", activeThread?.title || "Saved Prompt");
    if (!title) return;

    try {
      const res = await fetch(`${API_URL}/api/prompts/saved`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          refinedPrompt: message.refinedPrompt,
          category: message.category,
        }),
      });

      if (res.ok) {
        showToast("Prompt saved successfully!");
        fetchSavedPrompts();
      }
    } catch (err) {
      console.error("Save prompt API error:", err);
    }
  };

  const deleteSavedPrompt = async (promptId) => {
    if (!window.confirm("Delete this saved prompt?")) return;
    try {
      const res = await fetch(`${API_URL}/api/prompts/saved/${promptId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSavedPrompts(savedPrompts.filter((p) => p._id !== promptId));
        showToast("Saved prompt removed");
      }
    } catch (err) {
      console.error("Delete saved prompt error:", err);
    }
  };

  /* ==========================================================================
     Helper actions
     ========================================================================== */
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      showToast("Prompt copied to clipboard!");
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleTextareaKeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-background text-on-background font-body h-full w-full flex flex-row relative overflow-hidden transition-colors duration-300">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary font-semibold text-xs py-3 px-6 rounded-full shadow-lg transition-transform duration-300">
          {toastMsg}
        </div>
      )}

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
        ></div>
      )}

      {/* Main Drawer Sidebar */}
      <aside className={`fixed md:relative top-0 left-0 h-screen w-80 bg-surface border-r border-outline-variant z-50 transform md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col shrink-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between">
          <h2 className="font-bold text-sm tracking-[0.1em] uppercase text-on-surface">Promptly</h2>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 flex items-center hover:text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-outline-variant">
          <button 
            onClick={startNewThread}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary rounded-lg py-3 font-semibold text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Thread</span>
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 text-center border-b border-outline-variant bg-surface-container-low text-xs font-semibold uppercase tracking-wider">
          <button 
            onClick={() => setActiveTab("history")}
            className={`py-3 border-b-2 transition-colors ${activeTab === "history" ? "border-primary text-on-surface" : "border-transparent text-on-surface-variant opacity-60"}`}
          >
            History
          </button>
          <button 
            onClick={() => setActiveTab("saved")}
            className={`py-3 border-b-2 transition-colors ${activeTab === "saved" ? "border-primary text-on-surface" : "border-transparent text-on-surface-variant opacity-60"}`}
          >
            Saved Prompts
          </button>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "history" ? (
            <div className="space-y-1">
              {threads.length === 0 ? (
                <div className="text-center py-8 text-xs text-on-surface-variant opacity-50">
                  No previous sessions
                </div>
              ) : (
                threads.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => loadThread(t._id)}
                    className={`w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-surface-container transition-colors group ${activeThread?._id === t._id ? "bg-surface-container border border-outline-variant" : "border border-transparent"}`}
                  >
                    <div className="flex flex-col gap-0.5 truncate pr-2">
                      <span className="text-xs font-semibold text-on-surface truncate">{t.title}</span>
                      <span className="text-[9px] text-on-surface-variant uppercase font-medium">
                        {new Date(t.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span 
                      onClick={(e) => deleteThread(e, t._id)}
                      className="text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {savedPrompts.length === 0 ? (
                <div className="text-center py-8 text-xs text-on-surface-variant opacity-50">
                  No saved prompts yet
                </div>
              ) : (
                savedPrompts.map((p) => (
                  <div key={p._id} className="p-3 bg-surface-container-low border border-outline-variant rounded-lg space-y-2">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs font-bold text-on-surface truncate">{p.title}</span>
                      <div className="flex gap-1 shrink-0">
                        <button 
                          onClick={() => handleCopy(p.refinedPrompt, p._id)}
                          className="p-1 text-on-surface-variant hover:text-primary transition-colors"
                        >
                          {copiedId === p._id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          onClick={() => deleteSavedPrompt(p._id)}
                          className="p-1 text-on-surface-variant hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-on-surface-variant line-clamp-3 italic">
                      {p.refinedPrompt}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-surface-container-highest flex items-center justify-center border border-outline-variant">
              <User className="w-4 h-4 text-on-surface-variant" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-surface truncate max-w-[120px]">{user?.name || "Pilot"}</span>
              <span className="text-[9px] text-secondary font-medium">Uplink Active</span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button 
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
              title={theme === "light" ? "Dark Mode" : "Light Mode"}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button 
              onClick={logout}
              className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Layout Workspace Content */}
      <div className="flex-1 min-w-0 flex flex-row overflow-hidden h-screen">
        
        {/* Center Panel (Chat view) */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
          
          {/* TopAppBar */}
          <header className="bg-surface text-on-surface w-full border-b border-outline-variant flex items-center justify-between px-6 py-4 z-30 shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-on-surface hover:text-primary transition-colors flex items-center"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-sm tracking-[0.1em] uppercase text-on-surface">
                {activeThread ? activeThread.title : "Workspace"}
              </h1>
            </div>
          </header>

          {/* Chat Logs Panel */}
          <div id="chat-history" className="flex-1 overflow-y-auto p-6 space-y-6 relative bg-background">
            <div className="grid-bg"></div>

            {!activeThread && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 z-10 relative space-y-4 max-w-md mx-auto">
                <div className="p-4 bg-surface-container rounded-full border border-outline-variant">
                  <Terminal className="w-8 h-8 text-on-surface-variant" />
                </div>
                <h3 className="text-lg font-bold text-on-surface">Start a Prompt Session</h3>
                <p className="text-sm text-on-surface-variant">
                  Type a quick, raw description of what you want to build, choose a category on the right, and let Promptly generate a high-fidelity prompt.
                </p>
                <button 
                  onClick={startNewThread}
                  className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors text-xs font-semibold uppercase"
                >
                  Create Session
                </button>
              </div>
            ) : (
              <>
                {/* Session header */}
                <div className="w-full flex justify-center py-2 z-10">
                  <span className="text-xs text-on-surface-variant uppercase tracking-widest bg-surface-container px-3 py-1 rounded-full border border-outline-variant">
                    {activeThread ? `Session // ${new Date(activeThread.createdAt).toLocaleDateString()}` : "Active Session"}
                  </span>
                </div>

                {/* System Connected Message */}
                <div className="w-full flex justify-center z-10">
                  <div className="bg-surface-container-high border border-outline-variant rounded-lg p-3 max-w-sm text-center">
                    <p className="text-xs text-on-surface font-semibold uppercase tracking-wide">Connected</p>
                    <p className="text-sm text-on-surface-variant mt-1">Ready. Expand low-effort queries into structured prompt blocks.</p>
                  </div>
                </div>

                {/* Messages Loop */}
                {messages.map((msg, index) => (
                  <div key={index} className="space-y-4">
                    {msg.role === "user" ? (
                      <div className="flex flex-col items-end w-full z-10 fade-in">
                        <div className="flex items-end gap-2 max-w-[85%]">
                          <div className="bg-primary text-on-primary rounded-t-xl rounded-l-xl rounded-br-sm p-4">
                            {msg.imageUrl && (
                              <img 
                                src={msg.imageUrl} 
                                alt="User attachment" 
                                className="max-w-xs max-h-48 rounded-lg mb-2 object-cover border border-outline/20"
                              />
                            )}
                            <p className="text-sm leading-relaxed">{msg.rawInput}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-on-surface-variant mt-1 mr-1">User • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start w-full z-10 mb-6 fade-in">
                        <div className="flex items-start gap-3 max-w-[85%]">
                          <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 border border-outline-variant">
                            <span className="material-symbols-outlined text-on-surface text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                          </div>
                          <div className="bg-surface-container-lowest rounded-t-xl rounded-r-xl rounded-bl-sm p-4 border border-outline-variant relative overflow-hidden">
                            <p className="text-xs text-on-surface font-semibold mb-2 uppercase tracking-wide">System Response</p>
                            <p className="text-sm text-on-surface leading-relaxed mb-4">Prompt parameters converted successfully.</p>
                            
                            {/* Refined Prompt Display */}
                            <div className="bg-surface-container p-3 rounded border border-outline-variant relative group transition-colors">
                              <div className="absolute top-2 right-2 flex gap-1 bg-surface-container-lowest p-1 rounded border border-outline-variant transition-opacity">
                                <button 
                                  onClick={() => handleCopy(msg.refinedPrompt, msg._id || index)}
                                  className="text-on-surface-variant hover:text-primary transition-colors p-1"
                                  title="Copy Prompt"
                                >
                                  {copiedId === (msg._id || index) ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button 
                                  onClick={() => savePrompt(msg)}
                                  className="text-on-surface-variant hover:text-primary transition-colors p-1"
                                  title="Bookmark Prompt"
                                >
                                  <Bookmark className="w-4 h-4" />
                                </button>
                              </div>
                              <pre className="text-xs text-on-surface font-mono whitespace-pre-wrap select-all font-body italic pr-12">
                                {msg.refinedPrompt}
                              </pre>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-on-surface-variant mt-1 ml-11">System • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing status spinner */}
                {sending && (
                  <div className="flex flex-col items-start w-full z-10 mb-20 fade-in">
                    <div className="flex items-start gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 border border-outline-variant">
                        <span className="material-symbols-outlined text-on-surface text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                      </div>
                      <div className="bg-surface-container-lowest rounded-t-xl rounded-r-xl rounded-bl-sm p-4 border border-outline-variant flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-pulse delay-75"></div>
                        <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-pulse delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Bottom Chat Form Input */}
          <div className="p-4 bg-gradient-to-t from-background via-background/90 to-transparent shrink-0">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex flex-col gap-2 bg-surface-container-lowest p-2 rounded-xl border border-outline-variant shadow-sm focus-within:border-primary transition-all">
              {attachedImagePreview && (
                <div className="flex items-center gap-2 p-2 border-b border-outline-variant/30">
                  <div className="relative w-14 h-14 rounded border border-outline-variant/50 overflow-hidden shrink-0 group">
                    <img src={attachedImagePreview} alt="Attached Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={removeAttachedImage}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <span className="text-xs text-on-surface-variant">Image attached</span>
                </div>
              )}
              <div className="flex items-end gap-2">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3 text-on-surface-variant hover:text-on-surface transition-colors rounded-lg flex-shrink-0 ${attachedImagePreview ? "text-primary hover:text-primary animate-pulse" : ""}`}
                  title="Attach Image"
                >
                  <span className="material-symbols-outlined">add_photo_alternate</span>
                </button>
                <textarea
                  ref={textareaRef}
                  id="chat-input"
                  rows={1}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleTextareaKeydown}
                  placeholder={selectedCategory === "general" ? "Enter prompt description..." : `Enter parameters for ${selectedCategory.toUpperCase()} prompt...`}
                  className="w-full bg-transparent border-none text-on-surface placeholder:text-on-surface-variant focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 text-sm"
                  style={{ scrollbarWidth: "none" }}
                />
                <button 
                  type="submit" 
                  disabled={sending || (!inputVal.trim() && !attachedImage)}
                  className="p-3 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity flex-shrink-0 disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Sidebar ("Assist" Panel - Desktop Only) */}
        <aside className="w-80 border-l border-outline-variant bg-surface overflow-y-auto p-6 hidden lg:flex flex-col space-y-6 shrink-0 h-full">
          <div>
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Quick Modifiers</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedCategory("ui")}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold uppercase tracking-wider ${selectedCategory === "ui" ? "bg-primary border-primary text-on-primary" : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container"}`}
              >
                <Terminal className="w-4 h-4" />
                <span>UI Design</span>
              </button>
              <button
                onClick={() => setSelectedCategory("code")}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold uppercase tracking-wider ${selectedCategory === "code" ? "bg-primary border-primary text-on-primary" : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container"}`}
              >
                <Bolt className="w-4 h-4" />
                <span>Code Gen</span>
              </button>
              <button
                onClick={() => setSelectedCategory("image")}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold uppercase tracking-wider ${selectedCategory === "image" ? "bg-primary border-primary text-on-primary" : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container"}`}
              >
                <Image className="w-4 h-4" />
                <span>Image Gen</span>
              </button>
              <button
                onClick={() => setSelectedCategory("general")}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold uppercase tracking-wider ${selectedCategory === "general" ? "bg-primary border-primary text-on-primary" : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container"}`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>General</span>
              </button>
            </div>
          </div>

          <div className="border-t border-outline-variant/30 pt-6">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Prompt Templates</h3>
            <div className="space-y-3">
              {templates.length === 0 ? (
                <span className="text-xs text-on-surface-variant opacity-60">No templates available</span>
              ) : (
                templates.map((tpl, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      setInputVal(tpl.promptSkeleton);
                      setSelectedCategory(tpl.category);
                      showToast(`Template "${tpl.title}" selected`);
                    }}
                    className="p-3 bg-surface-container-low border border-outline-variant rounded-lg hover:bg-surface-container transition-all cursor-pointer space-y-1 group"
                  >
                    <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors block">{tpl.title}</span>
                    <span className="text-[10px] text-on-surface-variant line-clamp-2 block leading-relaxed">{tpl.description}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
