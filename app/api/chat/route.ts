import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Forward the request to the Python FastAPI backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend-production-21c2.up.railway.app";
    const response = await fetch(`${backendUrl}/analyze?prompt=${encodeURIComponent(message)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`FastAPI server responded with status: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      answer: data.result,
      chainOfThought: data.chain_of_thought,
      plotData: data.plot_data || null, // Include plot data if available
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
