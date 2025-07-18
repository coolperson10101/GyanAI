"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Send, Bot, User, ChevronDown, Loader2, Plus, RotateCcw } from "lucide-react"

interface Message {
  role: "user" | "ai"
  content: string
  chainOfThought?: string | null
  plotData?: string | null  // Base64 encoded plot image
  timestamp: Date
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const exampleQuestions = [
    "What questions can I ask you?",
    "Give me details on Krishna Murthy Gandhi",
    "What are the overall ratings?",
    "Show me the top 5 employees by rating",
    "Which employees have the highest ratings?",
    "Are there trends in feedback over time?",
    "What are the most frequent reasons for low ratings or rejection?"
  ]

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (question: string = input) => {
    if (!question.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: question.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: question.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const aiMessage: Message = {
        role: "ai",
        content: data.answer,
        chainOfThought: data.chainOfThought || null,
        plotData: data.plotData || null, // Assuming plotData is part of the response
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: Message = {
        role: "ai",
        content: `I apologize, but I encountered an error processing your request. Please try again.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const handleExampleClick = (question: string) => {
    handleSubmit(question)
  }

  return (
    <div className="h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/50">
        <div className="p-6 border-b border-gray-200">
          <Button
            onClick={clearChat}
            className="w-full justify-start gap-3 h-11 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            New conversation
          </Button>
        </div>

        <div className="flex-1 p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Example prompts</h3>
            <div className="space-y-2">
              {exampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(question)}
                  disabled={isLoading}
                  className="w-full text-left p-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 hover:shadow-sm transition-all duration-200 disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">GyanAI</div>
              <div className="text-xs text-gray-500">Employee Data Assistant</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">GyanAI</h1>
                <p className="text-sm text-gray-500">Ask questions about your employee feedback data</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button onClick={clearChat} variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bot className="w-8 h-8 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">How can I help you today?</h2>
                  <p className="text-gray-600 leading-relaxed">
                    I can help you analyze your employee feedback data. Ask me about ratings, employee details, or any
                    insights you'd like to discover from your dataset.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8">
                {messages.map((message, index) => (
                  <div key={index} className="mb-8">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {message.role === "user" ? (
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-orange-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {message.role === "user" ? "You" : "GyanAI"}
                          </span>
                        </div>
                        <div className="prose prose-gray max-w-none">
                          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">{message.content}</div>
                        </div>
                        {message.chainOfThought && message.chainOfThought !== "" && (
                          <div className="mt-4">
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-500 hover:text-gray-700 p-0 h-auto font-normal"
                                >
                                  <ChevronDown className="w-4 h-4 mr-1" />
                                  View thinking process
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-3">
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                  <div className="text-sm text-gray-600 font-medium mb-2">Thinking process:</div>
                                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                                    {message.chainOfThought}
                                  </pre>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="mb-8">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-orange-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-900">GyanAI</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
              className="relative"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message GyanAI..."
                disabled={isLoading}
                className="w-full pr-12 h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-xl shadow-sm"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="sm"
                className="absolute right-2 top-2 h-8 w-8 p-0 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
            <div className="mt-2 text-xs text-gray-500 text-center">
              GyanAI can make mistakes. Please verify important information.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
