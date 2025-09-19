import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequestJson } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Loader2,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  Minimize2,
  Maximize2,
} from "lucide-react";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiChatResponse {
  response: string;
  suggestions: string[];
  actionItems?: string[];
  conversationId: string;
}

interface AiInsightsProps {
  page: string;
  data?: any;
}

export function AiChatInterface({ page, data }: AiInsightsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; conversationId?: string; context?: any }): Promise<AiChatResponse> => {
      return await apiRequestJson<AiChatResponse>('POST', '/api/ai/chat', data);
    },
    onSuccess: (response: AiChatResponse) => {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(response.conversationId);
      setInputMessage('');
    },
    onError: (error) => {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or check if the AI service is properly configured.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    chatMutation.mutate({
      message: inputMessage.trim(),
      conversationId: conversationId || undefined,
      context: { currentPage: page, pageData: data }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: "Hello! I'm WorkFlu AI, your business assistant. I can help you with trading decisions, financial analysis, inventory management, and answer questions about your business operations. What would you like to know?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const getQuickStarterQuestions = () => {
    const starters = {
      'dashboard': [
        "What are my key business metrics today?",
        "Any urgent actions I should take?",
        "How is my cash flow looking?"
      ],
      'reports': [
        "Analyze my financial trends",
        "What anomalies do you see in my data?",
        "Generate an executive summary"
      ],
      'working-capital': [
        "How can I optimize my capital allocation?",
        "What's my cash flow forecast?",
        "Any risk alerts I should know about?"
      ],
      'purchases': [
        "Which suppliers should I prioritize?",
        "What's the best timing for my next purchase?",
        "Analyze my purchasing patterns"
      ],
      'warehouse': [
        "What inventory actions should I take?",
        "Which stock needs filtering?",
        "Optimize my warehouse operations"
      ],
      'default': [
        "Give me business insights",
        "What should I focus on today?",
        "Help me make a trading decision"
      ]
    };

    return starters[page as keyof typeof starters] || starters.default;
  };

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      startNewConversation();
    }
  }, []);

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        data-testid="ai-chat-trigger"
      >
        <Brain className="h-6 w-6" />
      </Button>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={`max-w-2xl h-[600px] p-0 ${isMinimized ? 'h-16' : ''}`}>
          <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <DialogTitle>WorkFlu AI Assistant</DialogTitle>
              <Badge variant="secondary" className="text-xs">
                Beta
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                data-testid="ai-chat-minimize"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                data-testid="ai-chat-close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {!isMinimized && (
            <>
              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4" data-testid="ai-chat-messages">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {chatMutation.isPending && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Quick Starter Questions */}
              {messages.length <= 1 && (
                <div className="p-4 border-t bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">Quick starters:</p>
                  <div className="flex flex-wrap gap-2">
                    {getQuickStarterQuestions().map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInputMessage(question);
                          setTimeout(handleSendMessage, 100);
                        }}
                        data-testid={`ai-quick-starter-${index}`}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your business..."
                    disabled={chatMutation.isPending}
                    data-testid="ai-chat-input"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || chatMutation.isPending}
                    data-testid="ai-chat-send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startNewConversation}
                    data-testid="ai-new-conversation"
                  >
                    New Conversation
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Press Enter to send, Shift+Enter for new line
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// AI Insights Panel Component
interface AiInsightsPanelProps {
  title: string;
  insight: string;
  type: 'info' | 'warning' | 'success' | 'trend';
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export function AiInsightsPanel({ title, insight, type, actions }: AiInsightsPanelProps) {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'trend':
        return <TrendingUp className="h-5 w-5 text-primary" />;
      default:
        return <Brain className="h-5 w-5 text-primary" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'warning':
        return 'border-l-warning';
      case 'success':
        return 'border-l-success';
      case 'trend':
        return 'border-l-primary';
      default:
        return 'border-l-primary';
    }
  };

  return (
    <Card className={`border-l-4 ${getBorderColor()}`} data-testid={`ai-insights-${type}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">{insight}</p>
        {actions && actions.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="flex gap-2 flex-wrap">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={action.action}
                  data-testid={`ai-action-${index}`}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Contextual Help Component
interface ContextualHelpProps {
  currentPage: string;
  userRole: string;
  className?: string;
}

export function ContextualHelp({ currentPage, userRole, className }: ContextualHelpProps) {
  const { data: help, isLoading } = useQuery({
    queryKey: ['/api/ai/contextual-help', currentPage, userRole],
    queryFn: async () => {
      return await apiRequestJson('POST', '/api/ai/contextual-help', {
        currentPage,
        userRole,
        currentData: {}
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading || !help) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Getting contextual help...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="contextual-help">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">AI Guidance</h3>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">{help.help}</p>
        
        {help.suggestions && help.suggestions.length > 0 && (
          <div className="space-y-2 mb-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Suggestions
            </h4>
            {help.suggestions.map((suggestion: string, index: number) => (
              <div key={index} className="text-xs p-2 bg-muted/50 rounded">
                {suggestion}
              </div>
            ))}
          </div>
        )}

        {help.quickActions && help.quickActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Quick Actions
            </h4>
            <div className="space-y-1">
              {help.quickActions.map((action: any, index: number) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span>{action.action}</span>
                  <Badge variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'default' : 'secondary'}>
                    {action.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}