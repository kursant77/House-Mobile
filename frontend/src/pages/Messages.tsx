import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChatStore } from "@/store/chatStore";
import { conversationService } from "@/services/api/conversations";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy load heavy chat components
const VirtualizedMessageList = lazy(() => import("@/components/chat/VirtualizedMessageList").then(m => ({ default: m.VirtualizedMessageList })));
const ChatInput = lazy(() => import("@/components/chat/ChatInput").then(m => ({ default: m.ChatInput })));

export default function Messages() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  const {
    conversations,
    currentConversation,
    fetchConversations,
    setCurrentConversation,
    isLoadingConversations,
  } = useChatStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (conversationId) {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
        if (isMobile) {
          setShowSidebar(false);
        }
      } else {
        // Conversation not found in list, try to fetch it
        conversationService.getConversation(conversationId).then((conv) => {
          if (conv) {
            setCurrentConversation(conv);
            if (isMobile) {
              setShowSidebar(false);
            }
          }
        });
      }
    } else {
      setCurrentConversation(null);
      if (isMobile) {
        setShowSidebar(true);
      }
    }
  }, [conversationId, conversations, setCurrentConversation, isMobile]);

  const handleConversationSelect = useCallback((conversation: any) => {
    setCurrentConversation(conversation);
    navigate(`/messages/${conversation.id}`);
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [setCurrentConversation, navigate, isMobile]);

  const handleBackToConversations = useCallback(() => {
    navigate("/messages");
    setCurrentConversation(null);
    if (isMobile) {
      setShowSidebar(true);
    }
  }, [navigate, setCurrentConversation, isMobile]);

  const handleNewConversation = useCallback(() => {
    navigate("/messages/new");
  }, [navigate]);

  return (
    <div className="flex h-full bg-[#FFFFFF] dark:bg-[#0E1621] overflow-hidden">
      {/* Sidebar - Conversation List */}
      <div
        className={cn(
          "flex flex-col border-r border-[#E4EDFD] dark:border-[#2B2B2B] bg-[#FFFFFF] dark:bg-[#17212B] transition-all duration-200 ease-out",
          showSidebar
            ? "w-full md:w-80 lg:w-96 translate-x-0"
            : "w-0 md:w-80 lg:w-96 -translate-x-full md:translate-x-0 overflow-hidden"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4EDFD] dark:border-[#2B2B2B] shrink-0">
          <h1 className="text-lg font-semibold">Xabarlar</h1>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNewConversation}
            className="rounded-full h-9 w-9"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <ConversationList
          conversations={conversations}
          currentConversationId={conversationId}
          onSelect={handleConversationSelect}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F0F2F5] dark:bg-[#0E1621]">
        {currentConversation ? (
          <>
            <ChatHeader
              conversation={currentConversation}
              onBack={isMobile ? handleBackToConversations : undefined}
            />
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              }
            >
              <VirtualizedMessageList conversationId={currentConversation.id} />
            </Suspense>
            <Suspense
              fallback={
                <div className="border-t border-border bg-background shrink-0 h-16 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <ChatInput conversationId={currentConversation.id} />
            </Suspense>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 bg-[#F0F2F5] dark:bg-[#0E1621]">
            <div className="text-center space-y-4 max-w-md">
              <div className="mx-auto w-24 h-24 rounded-full bg-[#E4EDFD] dark:bg-[#2B2B2B] flex items-center justify-center">
                <MessageSquare className="h-12 w-12 text-[#3390EC]" />
              </div>
              <h2 className="text-2xl font-semibold">Xabarlar bo'sh</h2>
              <p className="text-muted-foreground">
                Suhbatni boshlash uchun chapdan birini tanlang yoki yangi suhbat yarating.
              </p>
              <Button
                onClick={handleNewConversation}
                className="mt-4 bg-[#3390EC] hover:bg-[#2B7FD1]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yangi suhbat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
