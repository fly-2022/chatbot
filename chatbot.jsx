import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Trash2, Edit2, Check, X, AlertCircle, Send, MessageCircle, Database } from 'lucide-react';

const KnowledgeBot = () => {
  const defaultKnowledgeBase = [
    {
      id: 1,
      question: "What are your business hours?",
      answer: "We're open Monday to Friday, 9 AM to 6 PM. Weekends by appointment only.",
      category: "General",
      views: 45
    },
    {
      id: 2,
      question: "How do I reset my password?",
      answer: "Click 'Forgot Password' on the login page, enter your email, and follow the instructions sent to your inbox.",
      category: "Account",
      views: 120
    },
    {
      id: 3,
      question: "What payment methods do you accept?",
      answer: "We accept credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers.",
      category: "Billing",
      views: 87
    }
  ];

  const [knowledgeBase, setKnowledgeBase] = useState(defaultKnowledgeBase);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState(null);

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'kb'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [lastSearch, setLastSearch] = useState('');
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI assistant. I can answer your questions using our knowledge base and provide intelligent responses. What would you like to know?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const chatEndRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load knowledge base from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('knowledgeBase');
      if (stored) {
        const parsedData = JSON.parse(stored);
        setKnowledgeBase(parsedData);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      setStorageError('Failed to load knowledge base from storage.');
      setIsLoading(false);
    }
  }, []);

  // Save knowledge base to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('knowledgeBase', JSON.stringify(knowledgeBase));
        setStorageError(null);
      } catch (error) {
        console.error('Error saving knowledge base:', error);
        setStorageError('Failed to save changes. Your browser storage may be full.');
      }
    }
  }, [knowledgeBase, isLoading]);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Calculate relevance score
  const calculateRelevance = (query, question, answer) => {
    const q = query.toLowerCase();
    const questionLower = question.toLowerCase();
    const answerLower = answer.toLowerCase();

    let score = 0;

    const queryWords = q.split(/\s+/).filter(w => w.length > 2);
    const questionWords = questionLower.split(/\s+/);
    const matchedWords = queryWords.filter(qw => questionWords.some(qw2 => qw2.includes(qw) || qw.includes(qw2)));
    score += matchedWords.length * 30;

    if (questionLower.startsWith(q)) score += 50;
    if (questionLower.includes(q)) score += 25;

    const answerWords = answerLower.split(/\s+/);
    const answerMatches = queryWords.filter(qw => answerWords.some(aw => aw.includes(qw)));
    score += answerMatches.length * 5;

    if (answerLower.includes(q)) score += 10;

    return score;
  };

  // Find relevant knowledge base entries
  const findRelevantEntries = (userQuery) => {
    const ranked = knowledgeBase
      .map(item => ({
        ...item,
        relevance: calculateRelevance(userQuery, item.question, item.answer)
      }))
      .filter(item => item.relevance > 0)
      .sort((a, b) => {
        if (b.relevance !== a.relevance) return b.relevance - a.relevance;
        return b.views - a.views;
      })
      .slice(0, 3); // Top 3 relevant entries

    return ranked;
  };

  // Search with relevance ranking
  const handleSearch = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      setLastSearch('');
      return;
    }

    const ranked = knowledgeBase
      .map(item => ({
        ...item,
        relevance: calculateRelevance(trimmedQuery, item.question, item.answer)
      }))
      .filter(item => item.relevance > 0)
      .sort((a, b) => {
        if (b.relevance !== a.relevance) return b.relevance - a.relevance;
        return b.views - a.views;
      });

    setResults(ranked);
    setLastSearch(trimmedQuery);
  };

  // Handle adding/updating knowledge
  const handleSave = () => {
    const trimmedQuestion = newQuestion.trim();
    const trimmedAnswer = newAnswer.trim();

    if (!trimmedQuestion || !trimmedAnswer) {
      alert('Please fill in both question and answer');
      return;
    }

    if (editingId) {
      setKnowledgeBase(
        knowledgeBase.map(item =>
          item.id === editingId
            ? {
                ...item,
                question: trimmedQuestion,
                answer: trimmedAnswer,
                category: newCategory
              }
            : item
        )
      );
      setEditingId(null);
    } else {
      setKnowledgeBase([
        ...knowledgeBase,
        {
          id: Date.now(),
          question: trimmedQuestion,
          answer: trimmedAnswer,
          category: newCategory,
          views: 0
        }
      ]);
    }

    setNewQuestion('');
    setNewAnswer('');
    setNewCategory('General');
    setShowAddForm(false);

    if (lastSearch) {
      setTimeout(handleSearch, 0);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setNewQuestion(item.question);
    setNewAnswer(item.answer);
    setNewCategory(item.category);
    setShowAddForm(true);
    searchInputRef.current?.blur();
  };

  const handleDelete = (id) => {
    setKnowledgeBase(knowledgeBase.filter(item => item.id !== id));
    setResults(results.filter(item => item.id !== id));
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewQuestion('');
    setNewAnswer('');
    setNewCategory('General');
    setShowAddForm(false);
  };

  const handleResultClick = (item) => {
    setKnowledgeBase(
      knowledgeBase.map(kb =>
        kb.id === item.id ? { ...kb, views: kb.views + 1 } : kb
      )
    );
  };

  const categories = [...new Set(knowledgeBase.map(item => item.category))];

  // Handle chat message
  const handleChatSubmit = async () => {
    const trimmedInput = chatInput.trim();
    if (!trimmedInput) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: trimmedInput
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoadingChat(true);

    try {
      // Find relevant knowledge base entries
      const relevantEntries = findRelevantEntries(trimmedInput);
      
      // Build context from knowledge base
      let context = '';
      if (relevantEntries.length > 0) {
        context = 'Relevant information from knowledge base:\n\n';
        relevantEntries.forEach(entry => {
          context += `Q: ${entry.question}\nA: ${entry.answer}\n\n`;
        });
      }

      // Call Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `You are a helpful customer support assistant. You have access to a knowledge base with FAQs and common answers.

${context}

User question: ${trimmedInput}

Please provide a helpful answer. If relevant information is available in the knowledge base, use it and cite it naturally. Otherwise, provide a helpful response based on your general knowledge.`
            }
          ]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get response');
      }

      const botResponse = data.content[0]?.text || 'I apologize, but I could not generate a response.';

      // Add bot message
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse,
        sources: relevantEntries.length > 0 ? relevantEntries : null
      };

      setChatMessages(prev => [...prev, botMessage]);

      // Update view counts for referenced entries
      if (relevantEntries.length > 0) {
        setKnowledgeBase(prev =>
          prev.map(kb =>
            relevantEntries.find(re => re.id === kb.id)
              ? { ...kb, views: kb.views + 1 }
              : kb
          )
        );
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `I encountered an error: ${error.message}. Please make sure your API key is configured correctly.`,
        isError: true
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header with Tabs */}
      <div className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
        <div className="max-w-4xl mx-auto px-6 py-0">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <button
                onClick={() => {
                  setActiveTab('chat');
                  setChatInput('');
                }}
                className={`flex items-center gap-2 px-4 py-4 font-medium transition-all border-b-2 ${
                  activeTab === 'chat'
                    ? 'text-white border-blue-500'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <MessageCircle size={20} />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('kb')}
                className={`flex items-center gap-2 px-4 py-4 font-medium transition-all border-b-2 ${
                  activeTab === 'kb'
                    ? 'text-white border-blue-500'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <Database size={20} />
                Knowledge Base ({knowledgeBase.length})
              </button>
            </div>
            
            {/* Storage Status */}
            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  Loading...
                </div>
              ) : storageError ? (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  Error
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-400 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Synced
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Storage Error Alert */}
      {storageError && (
        <div className="bg-red-900/20 border-b border-red-700/50 px-6 py-3 text-red-300 text-sm">
          ⚠️ {storageError}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chat' ? (
          // Chat Interface
          <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400">Start a conversation...</p>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className={`max-w-2xl ${
                        msg.type === 'user'
                          ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
                          : 'bg-slate-800 text-slate-100 rounded-2xl rounded-tl-none border border-slate-700'
                      } px-6 py-4`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      {msg.isError && (
                        <div className="mt-3 pt-3 border-t border-red-400/30 text-xs text-red-300">
                          Please check your API configuration
                        </div>
                      )}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-600 space-y-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase">Sources:</p>
                          {msg.sources.map(source => (
                            <div key={source.id} className="text-xs bg-slate-700/50 rounded p-2">
                              <p className="font-medium text-blue-300">{source.question}</p>
                              <p className="text-slate-300 mt-1">{source.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoadingChat && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-100 rounded-2xl rounded-tl-none border border-slate-700 px-6 py-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-700 bg-slate-900 px-6 py-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSubmit();
                      }
                    }}
                    placeholder="Type your question here..."
                    disabled={isLoadingChat}
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={handleChatSubmit}
                    disabled={isLoadingChat || !chatInput.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Press Enter to send • The bot will search your knowledge base for relevant information
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Knowledge Base Tab
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">
                <Search size={20} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search knowledge base..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Search
              </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    {editingId ? 'Edit Entry' : 'Add New Q&A'}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Question
                  </label>
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Enter your question..."
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Answer
                  </label>
                  <textarea
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="Enter the answer..."
                    rows="4"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="">+ Add new category</option>
                  </select>
                  {newCategory === '' && (
                    <input
                      type="text"
                      placeholder="Enter new category name..."
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full mt-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Check size={18} />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Add Button */}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-xl font-medium transition-all group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                Add Q&A Pair
              </button>
            )}

            {/* Results */}
            {lastSearch && results.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Search Results
                  </h2>
                  <span className="text-xs text-slate-500">
                    {results.length} result{results.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {results.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => handleResultClick(item)}
                    className="group cursor-pointer bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 hover:bg-slate-750 transition-all"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.3s ease-out forwards',
                      opacity: 0
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors break-words">
                          {item.question}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2.5 py-1 bg-blue-900/40 text-blue-300 rounded-full">
                            {item.category}
                          </span>
                          <span className="text-xs text-slate-500">
                            Viewed {item.views} time{item.views !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                          className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this entry?')) {
                              handleDelete(item.id);
                            }
                          }}
                          className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed break-words">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {lastSearch && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="p-3 bg-slate-800 rounded-lg mb-4">
                  <AlertCircle size={24} className="text-slate-500" />
                </div>
                <h3 className="text-slate-300 font-medium mb-2">
                  No results found
                </h3>
                <p className="text-slate-400 text-sm mb-6 max-w-sm">
                  Try a different search term, or add a new Q&A pair to expand your knowledge base.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  Add new entry
                </button>
              </div>
            )}

            {/* Browse All */}
            {!lastSearch && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  All Entries
                </h2>
                {knowledgeBase
                  .sort((a, b) => b.views - a.views)
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className="group cursor-pointer bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 hover:bg-slate-750 transition-all"
                      style={{
                        animationDelay: `${index * 30}ms`,
                        animation: 'fadeInUp 0.3s ease-out forwards',
                        opacity: 0
                      }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors break-words">
                            {item.question}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2.5 py-1 bg-blue-900/40 text-blue-300 rounded-full">
                              {item.category}
                            </span>
                            <span className="text-xs text-slate-500">
                              Viewed {item.views} time{item.views !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this entry?')) {
                                handleDelete(item.id);
                              }
                            }}
                            className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed break-words">
                        {item.answer}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-in {
          animation: slideInFromTop 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default KnowledgeBot;
