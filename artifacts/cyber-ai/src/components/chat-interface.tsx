import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, Plus, Moon, Sun, Trash2, Bot, User, Languages, Paperclip, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTheme } from "./theme-provider";
import { useSpeechRecognition, type SpeechLanguage } from "@/hooks/use-speech-recognition";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListGeminiConversations, 
  useCreateGeminiConversation, 
  useGetGeminiConversation,
  useDeleteGeminiConversation,
  getListGeminiConversationsQueryKey,
  getGetGeminiConversationQueryKey
} from "@workspace/api-client-react";
import type { GeminiMessage } from "@workspace/api-client-react";

const SUGGESTED_TOPICS = [
  { label: "SQL Injection", icon: "💉", prompt: "What is SQL Injection and how can I prevent it in my application?" },
  { label: "XSS Protection", icon: "🛡️", prompt: "Explain Cross-Site Scripting (XSS) attacks and the best ways to protect against them." },
  { label: "Password Hashing", icon: "🔑", prompt: "What is the best way to hash and store passwords securely?" },
  { label: "API Security", icon: "🌐", prompt: "What are the most important API security best practices I should follow?" },
  { label: "Phishing Attacks", icon: "🎣", prompt: "How do phishing attacks work and how can users and systems detect them?" },
  { label: "Network Security", icon: "🔒", prompt: "What are the key principles of network security and common vulnerabilities to watch out for?" },
];

export function ChatInterface() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [speechLang, setSpeechLang] = useState<SpeechLanguage>("en-US");
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_BYTES = 200_000;
  const TEXT_EXTENSIONS = /\.(txt|md|json|csv|xml|yaml|yml|log|js|jsx|ts|tsx|py|rb|go|rs|java|c|h|cpp|hpp|cs|php|html|css|sh|sql|env|conf|ini|toml)$/i;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`File too large (max ${Math.round(MAX_FILE_BYTES / 1024)} KB)`);
      e.target.value = "";
      return;
    }
    if (!TEXT_EXTENSIONS.test(file.name) && !file.type.startsWith("text/")) {
      setFileError("Only text-based files are supported (code, txt, md, json, csv, etc.)");
      e.target.value = "";
      return;
    }
    try {
      const content = await file.text();
      setAttachedFile({ name: file.name, content });
    } catch {
      setFileError("Failed to read file");
    }
    e.target.value = "";
  };

  const clearAttachment = () => {
    setAttachedFile(null);
    setFileError(null);
  };

  const handleQuickSend = (prompt: string) => {
    if (isStreaming) return;
    handleSendMessage(undefined, prompt);
  };

  const { data: conversations } = useListGeminiConversations();
  const { data: activeConversation } = useGetGeminiConversation(activeConversationId as number, {
    query: {
      enabled: !!activeConversationId,
      queryKey: getGetGeminiConversationQueryKey(activeConversationId as number)
    }
  });

  const createConversation = useCreateGeminiConversation();
  const deleteConversation = useDeleteGeminiConversation();

  const handleSpeechResult = (text: string) => {
    setInputValue((prev) => (prev ? `${prev} ${text}` : text));
  };

  const { isRecording, toggleRecording, hasSupport: hasSpeechSupport } = useSpeechRecognition(handleSpeechResult, speechLang);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, streamingMessage, isStreaming]);

  const handleSendMessage = async (e?: React.FormEvent, overrideMessage?: string) => {
    if (e) e.preventDefault();
    const textToSend = overrideMessage ?? inputValue;
    if ((!textToSend.trim() && !attachedFile) || isStreaming) return;

    const baseText = textToSend.trim() || (attachedFile ? `Please review this file: ${attachedFile.name}` : "");
    const userMessage = attachedFile
      ? `${baseText}\n\n--- Attached file: ${attachedFile.name} ---\n\`\`\`\n${attachedFile.content}\n\`\`\``
      : baseText;
    setInputValue("");
    setAttachedFile(null);
    setFileError(null);
    setIsStreaming(true);
    setStreamingMessage("");

    let currentConvId = activeConversationId;

    if (!currentConvId) {
      const newConv = await createConversation.mutateAsync({
        data: { title: userMessage.substring(0, 50) + (userMessage.length > 50 ? "..." : "") }
      });
      currentConvId = newConv.id;
      setActiveConversationId(currentConvId);
      queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
    }

    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const response = await fetch(`${BASE}/api/gemini/conversations/${currentConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      
      queryClient.setQueryData(getGetGeminiConversationQueryKey(currentConvId), (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          messages: [
            ...oldData.messages,
            { id: Date.now(), conversationId: currentConvId, role: "user", content: userMessage, createdAt: new Date().toISOString() }
          ]
        };
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                // finished
              } else if (data.content) {
                setStreamingMessage(prev => prev + data.content);
              }
            } catch (e) {
              console.error("Failed to parse SSE JSON", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsStreaming(false);
      setStreamingMessage("");
      queryClient.invalidateQueries({ queryKey: getGetGeminiConversationQueryKey(currentConvId) });
      queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
    }
  };

  const handleDeleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation.mutateAsync({ id });
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
    queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
  };

  const handleClearHistory = async () => {
    if (!conversations?.length) return;
    await Promise.all(conversations.map((c) => deleteConversation.mutateAsync({ id: c.id })));
    setActiveConversationId(null);
    queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-sidebar flex flex-col flex-shrink-0">
        <div className="p-4 flex items-center justify-between">
          <span className="font-semibold text-sidebar-foreground">History</span>
          <Button variant="ghost" size="icon" onClick={() => setActiveConversationId(null)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {conversations?.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`group flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${activeConversationId === conv.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}
              >
                <div className="truncate pr-2">{conv.title || "New Conversation"}</div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-border flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={!conversations?.length}
                className="flex-1 justify-start gap-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all conversations?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {conversations?.length ?? 0} conversation{conversations?.length !== 1 ? "s" : ""} from your history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearHistory}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="font-bold text-lg flex items-center gap-2">
              Cyber AI
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </h1>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">v2.0</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setActiveConversationId(null)}>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!activeConversation?.messages?.length && !isStreaming && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-8">
              <div className="opacity-60 space-y-2">
                <Bot className="h-14 w-14 text-primary mx-auto" />
                <p className="text-lg font-semibold">Ready to assist.</p>
                <p className="text-sm text-muted-foreground">Select a topic or type your question below.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-lg w-full px-4">
                {SUGGESTED_TOPICS.map((topic) => (
                  <button
                    key={topic.label}
                    onClick={() => handleQuickSend(topic.prompt)}
                    disabled={isStreaming}
                    className="flex items-center gap-2.5 text-left px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors group disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="text-lg leading-none">{topic.icon}</span>
                    <span className="text-sm font-medium text-card-foreground group-hover:text-primary transition-colors">
                      {topic.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeConversation?.messages?.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-card border border-border text-card-foreground">
                <div className="flex items-center gap-2 mb-2 text-primary font-semibold text-xs uppercase tracking-wider">
                  <Bot className="h-4 w-4" />
                  Cyber AI
                </div>
                {streamingMessage ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                    <RenderFormattedText text={streamingMessage} />
                    <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
                  </div>
                ) : (
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background border-t border-border shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            {(attachedFile || fileError) && (
              <div className="flex items-center gap-2">
                {attachedFile && (
                  <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs px-3 py-1.5 rounded-md">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="font-mono truncate max-w-[240px]">{attachedFile.name}</span>
                    <span className="text-muted-foreground">
                      ({Math.round(attachedFile.content.length / 1024) || 1} KB)
                    </span>
                    <button
                      type="button"
                      onClick={clearAttachment}
                      className="hover:text-destructive ml-1"
                      aria-label="Remove attachment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {fileError && (
                  <div className="text-xs text-destructive">{fileError}</div>
                )}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".txt,.md,.json,.csv,.xml,.yaml,.yml,.log,.js,.jsx,.ts,.tsx,.py,.rb,.go,.rs,.java,.c,.h,.cpp,.hpp,.cs,.php,.html,.css,.sh,.sql,.env,.conf,.ini,.toml,text/*"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title="Attach a text file"
                className="h-10 w-10 shrink-0 text-muted-foreground hover:text-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="relative flex-1">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Message Cyber AI..."
                  className="w-full pr-24 bg-card border-input focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground"
                  disabled={isStreaming}
                />
                {hasSpeechSupport && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      title={speechLang === 'en-US' ? 'Switch to Arabic' : 'Switch to English'}
                      className="h-8 px-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-primary gap-1"
                      onClick={() => setSpeechLang((l) => (l === 'en-US' ? 'ar-SA' : 'en-US'))}
                      disabled={isStreaming || isRecording}
                    >
                      <Languages className="h-3.5 w-3.5" />
                      {speechLang === 'en-US' ? 'EN' : 'AR'}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      title={isRecording ? 'Stop recording' : `Speak (${speechLang === 'en-US' ? 'English' : 'Arabic'})`}
                      className={`h-8 w-8 ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}
                      onClick={toggleRecording}
                      disabled={isStreaming}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                size="icon" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 shrink-0"
                disabled={(!inputValue.trim() && !attachedFile) || isStreaming}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: GeminiMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div 
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-card border border-border text-card-foreground"
        }`}
      >
        <div className={`flex items-center gap-2 mb-1.5 font-semibold text-xs uppercase tracking-wider ${isUser ? "text-primary-foreground/80 justify-end" : "text-primary"}`}>
          {isUser ? (
            <>User <User className="h-3.5 w-3.5" /></>
          ) : (
            <><Bot className="h-3.5 w-3.5" /> Cyber AI</>
          )}
        </div>
        <div className={`prose prose-sm max-w-none break-words ${isUser ? "text-primary-foreground prose-invert" : "dark:prose-invert"}`}>
          <RenderFormattedText text={message.content} />
        </div>
      </div>
    </div>
  );
}

function RenderFormattedText({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const content = part.slice(3, -3);
          const lines = content.split('\n');
          const language = lines[0].trim();
          const code = lines.slice(1).join('\n');
          
          return (
            <div key={i} className="my-3 rounded overflow-hidden border border-border bg-[#0d0d12]">
              {language && (
                <div className="px-3 py-1 text-xs font-mono text-muted-foreground bg-black/40 border-b border-border/50 uppercase tracking-wider">
                  {language}
                </div>
              )}
              <pre className="p-3 overflow-x-auto text-sm font-mono text-[#e2e8f0] leading-relaxed">
                <code>{code || content}</code>
              </pre>
            </div>
          );
        }
        return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      })}
    </>
  );
}
