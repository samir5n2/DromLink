import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Phone, MoreVertical, Paperclip, Smile, Send, FileText, Download, Shield, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  sender: number;
  receiver: number;
  content: string;
  timestamp: string;
  is_read: boolean;
  sender_name?: string;
  receiver_name?: string;
  sender_type?: string;
  receiver_type?: string;
  sender_profile_id?: string;
  receiver_profile_id?: string;
  sender_avatar?: string;
  receiver_avatar?: string;
  attachment?: string;
  is_chat_closed?: boolean;
  booking_request?: number;
  contact_message?: number;
}

interface Conversation {
  id: string; // user ID of the other person
  name: string;
  initials: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  online?: boolean;
  unread: number;
  profileType?: string;
  profileId?: string;
  isLocked?: boolean;
  bookingRequest?: number;
  contactMessage?: number;
}

const Messages = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { isLoggedIn, userEmail, isAdmin, userType } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("user");
  const targetUserName = searchParams.get("name") || "User";

  // State
  const [selectedChat, setSelectedChat] = useState<string>(targetUserId || "");
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const emojis = ["😊", "😂", "🥰", "😍", "😒", "😭", "👍", "🙏", "🔥", "❤️", "✨", "🙌", "👋", "🎉", "🤔", "👀"];

  // Fetch me to know my ID
  useEffect(() => {
    if (isLoggedIn) {
      fetchApi('/me/').then(res => setMyUserId(res.user_id)).catch(() => {});
    }
  }, [isLoggedIn]);

  // Fetch all messages
  const { data: allMessages = [], isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => await fetchApi('/messages/'),
    enabled: isLoggedIn && myUserId !== null,
    refetchInterval: 5000, // basic polling for new messages
  });

  // Calculate conversations from messages
  const conversations = useMemo(() => {
    if (!myUserId) return [];
    
    const convMap = new Map<string, Conversation>();
    
    // Add target user from URL if not exists yet
    if (targetUserId) {
      convMap.set(targetUserId, {
        id: targetUserId,
        name: targetUserName,
        initials: targetUserName.substring(0, 2).toUpperCase(),
        lastMessage: "No messages yet",
        time: "",
        unread: 0
      });
    }

    allMessages.forEach((msg: Message) => {
      // Strict ID check for identifying own messages
      const isMe = msg.sender === myUserId;
      
      let otherId: string;
      let otherName: string;
      let otherType: string | undefined;
      let otherProfileId: string | undefined;

      // Aggressive Unification:
      // Grouping by the ID of the "other" person in the conversation
      const otherUserId = isMe ? msg.receiver : msg.sender;
      
      if (otherUserId) {
        otherId = otherUserId.toString();
      } else if (msg.contact_message) {
        otherId = `contact_${msg.contact_message}`;
      } else {
        otherId = isMe ? "system" : "guest";
      }

      otherName = isMe ? (msg.receiver_name || "User") : (msg.sender_name || "Guest");
      otherType = isMe ? msg.receiver_type : msg.sender_type;
      otherProfileId = isMe ? msg.receiver_profile_id : msg.sender_profile_id;
      
      const existing = convMap.get(otherId);
      const msgDate = new Date(msg.timestamp);
      
      const bookingReqId = msg.booking_request || existing?.bookingRequest;
      const contactMsgId = msg.contact_message || existing?.contactMessage;

      if (!existing || new Date(existing.time || 0) < msgDate) {
        convMap.set(otherId, {
          id: otherId,
          name: otherName,
          initials: otherName.substring(0, 2).toUpperCase(),
          avatar: isMe ? msg.receiver_avatar : msg.sender_avatar,
          lastMessage: msg.content,
          time: msg.timestamp,
          unread: (!isMe && !msg.is_read) ? (existing?.unread || 0) + 1 : (existing?.unread || 0),
          profileType: otherType,
          profileId: otherProfileId,
          isLocked: msg.is_chat_closed || existing?.isLocked || ((msg.content.includes("تم إنهاء هذه المحادثة") || msg.content.includes("This conversation has been ended")) && msg.sender_type === 'admin'),
          bookingRequest: bookingReqId,
          contactMessage: contactMsgId
        });
      }
    });

    return Array.from(convMap.values()).sort((a, b) => {
      return new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime();
    });
  }, [allMessages, myUserId, targetUserId, targetUserName]);

  // Messages for selected chat
  const currentMessages = useMemo(() => {
    if (!selectedChat) return [];
    return allMessages.filter((msg: Message) => {
      const isMe = msg.sender === myUserId;
      const otherUserId = isMe ? msg.receiver : msg.sender;
      let otherId: string;
      
      if (otherUserId) {
        otherId = otherUserId.toString();
      } else if (msg.contact_message) {
        otherId = `contact_${msg.contact_message}`;
      } else {
        otherId = isMe ? "system" : "guest";
      }
      return otherId === selectedChat;
    }).sort((a: Message, b: Message) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [allMessages, selectedChat, myUserId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // Mark as read when chat selected
  useEffect(() => {
    if (selectedChat && isLoggedIn) {
      const payload: any = {};
      let shouldSend = false;

      if (selectedChat.startsWith('contact_')) {
        const id = parseInt(selectedChat.replace('contact_', ''));
        if (!isNaN(id)) {
          payload.contact_message_id = id;
          shouldSend = true;
        }
      } else {
        const id = parseInt(selectedChat);
        if (!isNaN(id)) {
          payload.sender_id = id;
          shouldSend = true;
        }
      }

      if (shouldSend) {
        fetchApi('/messages/mark_as_read/', {
          method: 'POST',
          body: JSON.stringify(payload)
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }).catch(() => {});
      }
    }
  }, [selectedChat, isLoggedIn, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, file }: { content: string, file?: File | null }) => {
      if (!selectedChat) return;
      
      const formData = new FormData();
      formData.append('receiver', selectedChat);
      formData.append('content', content);
      
      // If we are in a contact inquiry thread, make sure the backend knows it
      if (selectedChat.startsWith('contact_')) {
        const contactId = selectedChat.replace('contact_', '');
        formData.append('contact_message', contactId);
      }
      
      if (file) {
        formData.append('attachment', file);
      }

      await fetchApi('/messages/', {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessageInput("");
      setSelectedFile(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const lockChatMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation) return;
      
      if (selectedConversation.bookingRequest) {
        await fetchApi(`/booking-requests/${selectedConversation.bookingRequest}/`, {
          method: 'PATCH',
          body: JSON.stringify({ is_chat_closed: true })
        });
      } else if (selectedConversation.contactMessage) {
        // Resolve contact message
        await fetchApi(`/contact-messages/${selectedConversation.contactMessage}/`, {
          method: 'PATCH',
          body: JSON.stringify({ is_resolved: true })
        });
        
        // Also send a locking message to the thread
        const formData = new FormData();
        formData.append('receiver', selectedChat);
        formData.append('contact_message', selectedConversation.contactMessage.toString());
        formData.append('content', isAr ? "تم حل هذا الاستفسار وإغلاق المحادثة." : "This inquiry has been resolved and the conversation is closed.");
        formData.append('is_chat_closed', "true");
        await fetchApi('/messages/', {
          method: 'POST',
          body: formData
        });
      } else {
        // General chat lock by Admin
        const formData = new FormData();
        formData.append('receiver', selectedChat);
        formData.append('content', isAr ? "تم إنهاء هذه المحادثة من قبل المسؤول." : "This conversation has been ended by an administrator.");
        formData.append('is_chat_closed', "true");
        await fetchApi('/messages/', {
          method: 'POST',
          body: formData
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({ title: "Success", description: "Chat has been locked." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const handleSend = () => {
    if (!messageInput.trim() && !selectedFile) return;
    sendMessageMutation.mutate({ content: messageInput.trim(), file: selectedFile });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const addEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
  };

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversation = conversations.find((c) => c.id === selectedChat);

  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">{t('messages.signInPrompt')}</p>
      </div>
    );
  }

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{t('messages.title')}</h2>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('messages.filterPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 && !isLoading && (
            <div className="p-4 text-center text-muted-foreground text-sm">{t('messages.noConv')}</div>
          )}
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedChat(conv.id)}
              className={cn(
                "w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50",
                selectedChat === conv.id && "bg-primary/5 border-l-2 border-l-primary"
              )}
            >
              <div className="relative shrink-0">
                <Avatar className="h-10 w-10">
                  {conv.avatar && <img src={conv.avatar} alt={conv.name} className="h-full w-full object-cover" />}
                  <AvatarFallback className="bg-muted text-sm font-medium">
                    {conv.initials}
                  </AvatarFallback>
                </Avatar>
                {conv.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm truncate">{conv.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(conv.time)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <Badge className="bg-primary text-primary-foreground text-[10px] h-5 w-5 rounded-full p-0 flex items-center justify-center shrink-0">
                  {conv.unread}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        {selectedConversation ? (
          <>
            <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
              <div 
                className={cn(
                  "flex items-center gap-3", 
                  selectedConversation.profileId && "cursor-pointer group/header"
                )}
                onClick={() => {
                  if (selectedConversation.profileId && selectedConversation.profileType) {
                    navigate(`/profile/${selectedConversation.profileType}/${selectedConversation.profileId}`);
                  }
                }}
              >
                <Avatar className="h-10 w-10 group-hover/header:ring-2 group-hover/header:ring-primary transition-all">
                  {selectedConversation.avatar && <img src={selectedConversation.avatar} alt={selectedConversation.name} className="h-full w-full object-cover" />}
                  <AvatarFallback className="bg-muted font-medium">
                    {selectedConversation.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm group-hover/header:text-primary transition-colors">
                    {selectedConversation.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground group-hover/header:underline">{t('messages.viewProfile')}</p>
                </div>
              </div>
                <div className="flex items-center gap-2">
                  {isAdmin && !selectedConversation.isLocked && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 px-4 text-xs gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-full transition-all animate-fade-in"
                      onClick={() => {
                        if (window.confirm(isAr ? "هل أنت متأكد من إنهاء هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to end this conversation? This cannot be undone.")) {
                          lockChatMutation.mutate();
                        }
                      }}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      {isAr ? "إنهاء المحادثة" : "End Conversation"}
                    </Button>
                  )}
                  <div className="relative hidden sm:block">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder={t('messages.searchInChat')} className="pl-8 h-8 w-40 text-xs" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {currentMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  {t('messages.startConv')}
                </div>
              ) : (
                currentMessages.map((msg, idx) => {
                  const msgDateStr = formatDate(msg.timestamp);
                  const prevMsgDateStr = idx > 0 ? formatDate(currentMessages[idx - 1].timestamp) : null;
                  const showDate = msgDateStr !== prevMsgDateStr;
                  const isMe = msg.sender === myUserId;

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                            {msgDateStr}
                          </span>
                        </div>
                      )}
                      <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[70%] space-y-1", isMe ? "items-end" : "items-start")}>
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-3 text-sm",
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            {msg.attachment && (
                              <div className="mt-2 pt-2 border-t border-white/20">
                                <a 
                                  href={msg.attachment.startsWith('http') ? msg.attachment : `${API_BASE_URL.replace('/api', '')}${msg.attachment}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs hover:underline"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  {msg.attachment.split('/').pop() || "Attachment"}
                                </a>
                              </div>
                            )}
                          </div>
                          <div className={cn("flex items-center gap-1 px-1", isMe && "justify-end")}>
                            <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                            {isMe && <span className="text-[10px] text-primary">✓✓</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area or Locked Banner */}
            <div className="border-t px-6 py-3 space-y-2 shrink-0 bg-card">
              {selectedConversation.isLocked ? (
                <div className="flex flex-col items-center justify-center py-6 bg-muted/30 rounded-xl border border-dashed border-border animate-fade-in my-2">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <Shield className="h-5 w-5" />
                    <span className="font-bold text-sm">
                      {isAr ? "تم إنهاء هذه المحادثة" : "This conversation has been ended"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center px-4">
                    {isAr ? "لقد تم إغلاق هذا الحوار من قبل المسؤول. لا يمكنك إرسال رسائل جديدة." : "This chat has been closed by the administrator. You cannot send new messages."}
                  </p>
                </div>
              ) : (
                <>
                  {selectedFile && (
                    <div className="flex items-center justify-between bg-muted p-2 rounded-lg text-xs animate-in slide-in-from-bottom-2">
                      <span className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-primary" /> {selectedFile.name}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive" onClick={() => setSelectedFile(null)}>×</Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn("h-9 w-9 shrink-0 hover:text-primary hover:bg-primary/10", selectedFile && "text-primary bg-primary/10")} 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 hover:text-primary hover:bg-primary/10">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" className="w-64 p-2 border-border shadow-xl">
                        <div className="grid grid-cols-4 gap-1">
                          {emojis.map(emoji => (
                            <button
                              key={emoji}
                              className="h-10 w-10 flex items-center justify-center text-xl hover:bg-muted rounded-md transition-colors"
                              onClick={() => addEmoji(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Input
                      placeholder={t('messages.typeMessage')}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      className="flex-1 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 h-10 rounded-full px-4"
                    />
                    <Button
                      size="icon"
                      className="h-10 w-10 rounded-full shrink-0 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                      onClick={handleSend}
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>{t('messages.encrypted')}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Send className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">{t('messages.yourMessages')}</h3>
              <p className="text-sm text-muted-foreground">{t('messages.selectConv')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
