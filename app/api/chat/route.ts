import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Forward the request to the Python FastAPI backend
    const response = await fetch(`http://localhost:8000/analyze?prompt=${encodeURIComponent(message)}`, {
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
