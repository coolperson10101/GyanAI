import os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from langchain_community.llms import AzureOpenAI
from langchain_openai import AzureChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain_experimental.agents.agent_toolkits import create_pandas_dataframe_agent
from langchain.callbacks.base import BaseCallbackHandler
import io
import sys

# 1. Load CSV and fill NaNs with 0
FeedbackDetailsDF = pd.read_csv("data/FeedbackDetails.csv").fillna(value = 0)
IdeasBoxDF = pd.read_csv("data/Ideas_Tracker.csv").fillna(value = 0)

# 2. Initialize LangChain Pandas DataFrame agent with Azure OpenAI
llm = AzureChatOpenAI(
    openai_api_version="2024-12-01-preview",
    azure_deployment="gpt-4.1",
    azure_endpoint="https://agenticaiazurefoundry.openai.azure.com/",
    api_key="8xoeqAg8DsDsmLHqrsEvgPfqpyRBMURNK2JCQCjVbE95zu0FilIoJQQJ99BFACYeBjFXJ3w3AAAAACOGY1TV",
    temperature = 0.2,
)

memory = ConversationBufferMemory(return_messages=True)

# Create DataFrame agent
df_agent = create_pandas_dataframe_agent(
    llm=llm,
    df=[FeedbackDetailsDF, IdeasBoxDF],
    verbose=True,
    allow_dangerous_code=True,
    agent_kwargs= {
        "prefix": """ You are GyanAI, an expert data analyst that helps Gyansys employees answer queries about the company.
                    You have access to two pandas DataFrames:
                        1. FeedbackDetailsDF - Employee feedback data
                        2. IdeasBoxDF - Ideas tracker data 
                    Ratings are defined as follows: 
                        1 - Poor
                        2 - Very Weak
                        3 - Weak
                        4 - Below Average
                        5 - Meets Expectations
                        6 - Above Average
                        7 - Good
                        8 - Exceeds Expectations
                        9 - Excellent
                        10 - Outstanding
                    Check similar columns for information in the case that users misremember column names. 
                    Practice and Class are similar columns, so if the user asks for information from one, you should also check the other for it.
                    Do the same for the columns Employee Title and Employee Band. 
                    Similarly, users might forget exact distinctions in the dataframe, so you can ask them to clarify ambiguous terms. 
                    Always AVOID placeholder text in your responses, include all relevant information from the dataframe always. """}
)

def smart_data_chat(query):
    # Get conversation history
    chat_history = memory.chat_memory.messages
    
    # If there's previous context, enhance the query
    if chat_history:
        # Get the last few messages for context
        recent_context = chat_history[-4:]  # Last 2 exchanges
        
        # Build context-aware query
        context_query = f"""
Previous conversation context:
{recent_context}

Current question: {query}

Please use the context from the previous conversation to answer the current question appropriately.
"""
    else:
        context_query = query
    
    # Save user query
    memory.chat_memory.add_user_message(query)
    
    # Get response from DataFrame agent
    result = df_agent.invoke({"input": context_query})
    response = result["output"]
    
    # Save response
    memory.chat_memory.add_ai_message(response)
    
    return response

# 3. FastAPI app and /analyze endpoint
app = FastAPI()

# 4. Enable CORS for localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        #"http://localhost:3000",  # for local development
        "http://frontend-production-5c3c.up.railway.app"  # for production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeResponse(BaseModel):
    result: str
    chain_of_thought: str

@app.get("/analyze", response_model=AnalyzeResponse)
async def analyze(prompt: str = Query(..., description="Prompt for the agent")):
    # Capture stdout to get the full verbose output
    old_stdout = sys.stdout
    sys.stdout = mystdout = io.StringIO()
    
    try:
        # Use the smart_data_chat function for memory capabilities
        response = smart_data_chat(prompt)
    finally:
        sys.stdout = old_stdout
    
    reasoning = mystdout.getvalue()
    
    return {
        "result": response,
        "chain_of_thought": reasoning
    } 