import os
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime
import requests

load_dotenv()

# ── Initialize Clients ────────────────────────────────
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

OLLAMA_URL  = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2"


# ── Call Groq API ─────────────────────────────────────
def call_groq(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.7
) -> str:
    """
    Calls Groq API with Llama 3.3 70B model.
    Primary AI for StockSage — fastest and smartest.

    Args:
        system_prompt: Instructions for the AI
        user_message: The actual question/request
        temperature: 0 = deterministic, 1 = creative

    Returns:
        AI response as string
    """
    try:
        response = groq_client.chat.completions.create(
            model    = "llama-3.3-70b-versatile",
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message}
            ],
            temperature = temperature,
            max_tokens  = 1024
        )
        return response.choices[0].message.content

    except Exception as e:
        print(f"Groq API error: {e}")
        return None


# ── Call Ollama (Local) ───────────────────────────────
def call_ollama(
    system_prompt: str,
    user_message: str
) -> str:
    """
    Calls Ollama running locally on your PC.
    Fallback when Groq is unavailable or rate limited.
    Works completely offline.

    Args:
        system_prompt: Instructions for the AI
        user_message: The actual question/request

    Returns:
        AI response as string
    """
    try:
        full_prompt = f"{system_prompt}\n\nUser: {user_message}\nAssistant:"

        response = requests.post(
            OLLAMA_URL,
            json={
                "model" : OLLAMA_MODEL,
                "prompt": full_prompt,
                "stream": False
            },
            timeout=60
        )

        if response.status_code == 200:
            return response.json().get("response", "")
        else:
            print(f"Ollama error: {response.status_code}")
            return None

    except Exception as e:
        print(f"Ollama error: {e}")
        return None


# ── Smart AI Call — Auto Fallback ─────────────────────
def call_ai(
    system_prompt: str,
    user_message: str,
    prefer_local: bool = False
) -> dict:
    """
    Intelligently calls the best available AI.
    Tries Groq first, falls back to Ollama.

    Args:
        system_prompt: Instructions for the AI
        user_message: The actual question/request
        prefer_local: If True, try Ollama first

    Returns:
        Dictionary with response and source
    """
    if prefer_local:
        # Try Ollama first
        response = call_ollama(system_prompt, user_message)
        if response:
            return {"response": response, "source": "ollama"}

        # Fallback to Groq
        response = call_groq(system_prompt, user_message)
        if response:
            return {"response": response, "source": "groq"}
    else:
        # Try Groq first
        response = call_groq(system_prompt, user_message)
        if response:
            return {"response": response, "source": "groq"}

        # Fallback to Ollama
        response = call_ollama(system_prompt, user_message)
        if response:
            return {"response": response, "source": "ollama"}

    return {
        "response": "AI service temporarily unavailable. Please try again.",
        "source"  : "none"
    }


# ── Build Portfolio Context ───────────────────────────
def build_portfolio_context(portfolio_data: dict) -> str:
    """
    Converts portfolio data into a compact string
    that fits within the AI's context window.

    Args:
        portfolio_data: Portfolio dictionary from DB

    Returns:
        Compact portfolio context string
    """
    if not portfolio_data or not portfolio_data.get("holdings"):
        return "Portfolio is empty."

    context = "CURRENT PORTFOLIO:\n"

    for h in portfolio_data["holdings"]:
        pnl_sign = "+" if h["pnl"] >= 0 else ""
        context += (
            f"- {h['symbol']}: {h['quantity']} shares, "
            f"bought at Rs.{h['buy_price']}, "
            f"now Rs.{h['current_price']}, "
            f"P&L: {pnl_sign}Rs.{h['pnl']} ({pnl_sign}{h['pnl_percent']}%)\n"
        )

    summary = portfolio_data.get("summary", {})
    context += (
        f"\nTOTAL: Invested Rs.{summary.get('total_invested', 0)}, "
        f"Current Rs.{summary.get('current_value', 0)}, "
        f"P&L: Rs.{summary.get('total_pnl', 0)} "
        f"({summary.get('total_pnl_percent', 0)}%)\n"
    )

    return context


# ── Portfolio Chat ────────────────────────────────────
def chat_with_portfolio(
    user_question: str,
    portfolio_context: str,
    chat_history: list = None,
    father_mode: bool  = False
) -> dict:
    """
    AI chat that knows your portfolio and answers
    investment questions intelligently.

    Args:
        user_question: What the user asked
        portfolio_context: Current portfolio data as string
        chat_history: Previous messages for context
        father_mode: If True, respond in simple Hindi-English

    Returns:
        AI response with source info
    """
    if father_mode:
        language_instruction = """
        IMPORTANT: Respond in simple Hindi-English mixed language (Hinglish).
        Use simple words. No technical jargon.
        Example style: "Aapka TCS share abhi theek hai.
        Price thoda neeche hai lekin company strong hai."
        Keep response short — maximum 3-4 sentences.
        """
    else:
        language_instruction = """
        Respond in clear English.
        Be concise but thorough.
        Use bullet points for clarity when needed.
        """

    system_prompt = f"""You are StockSage AI — a personal investment advisor
for Indian stock market investors.

{language_instruction}

PORTFOLIO CONTEXT:
{portfolio_context}

IMPORTANT RULES:
1. You know the user's exact portfolio — refer to their specific stocks
2. Give specific, actionable advice based on their actual holdings
3. Always mention relevant risks
4. Never guarantee returns — always say "expected" or "historical"
5. If asked about a stock not in portfolio, still answer helpfully
6. Today's date: {datetime.now().strftime("%d %b %Y")}

You are helpful, honest, and always prioritize
the user's financial wellbeing over excitement."""

    # Include chat history for context
    if chat_history:
        history_text = "\n".join([
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in chat_history[-6:]  # Last 6 messages
        ])
        user_message = f"CHAT HISTORY:\n{history_text}\n\nCURRENT QUESTION: {user_question}"
    else:
        user_message = user_question

    result = call_ai(system_prompt, user_message)

    return {
        "question"   : user_question,
        "answer"     : result["response"],
        "ai_source"  : result["source"],
        "father_mode": father_mode,
        "timestamp"  : datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


# ── Daily Morning Briefing ────────────────────────────
def generate_daily_briefing(
    portfolio_data: dict,
    news_data: dict,
    alerts_data: dict,
    father_mode: bool = False
) -> dict:
    """
    Generates a personalized daily morning briefing
    combining portfolio status + news + alerts.

    Like having a personal financial advisor
    call you every morning.

    Args:
        portfolio_data: Current portfolio with P&L
        news_data: Today's market news and sentiment
        alerts_data: Any active alerts
        father_mode: Simple Hindi-English if True

    Returns:
        Complete daily briefing
    """
    portfolio_context = build_portfolio_context(portfolio_data)

    # Build news summary
    news_summary = "TODAY'S MARKET NEWS:\n"
    if news_data.get("market_sentiment"):
        sentiment = news_data["market_sentiment"]
        news_summary += f"Overall market mood: {sentiment.get('overall', 'neutral')}\n"
        news_summary += f"Score: {sentiment.get('score', 0)}/100\n\n"

    # Build alerts summary
    alerts_summary = "ACTIVE ALERTS:\n"
    if alerts_data.get("alerts"):
        for alert in alerts_data["alerts"][:3]:
            alerts_summary += f"- {alert['symbol']}: {alert['message']}\n"
    else:
        alerts_summary += "No urgent alerts today.\n"

    if father_mode:
        briefing_instruction = """
        Create a morning briefing in simple Hindi-English (Hinglish).
        Format:
        1. Good morning greeting
        2. Portfolio status in 1-2 simple lines
        3. Most important thing to know today (1 line)
        4. One simple action if needed
        5. Motivational closing line

        Keep it SHORT — like a WhatsApp message from a trusted friend.
        Maximum 8-10 lines total.
        """
    else:
        briefing_instruction = """
        Create a professional morning briefing.
        Format:
        1. Date and market opening status
        2. Portfolio overnight summary
        3. Key news affecting your holdings
        4. Active alerts and recommended actions
        5. Today's watchlist — what to monitor
        6. One key insight for the day

        Be specific, data-driven, and actionable.
        """

    system_prompt = f"""You are StockSage AI — generating a personalized
daily morning briefing for an Indian stock market investor.

{briefing_instruction}

{portfolio_context}

{news_summary}

{alerts_summary}

Today: {datetime.now().strftime("%A, %d %B %Y")}
Market opens at 9:15 AM IST."""

    user_message = "Generate my personalized morning briefing for today."

    result = call_ai(system_prompt, user_message)

    return {
        "date"        : datetime.now().strftime("%A, %d %B %Y"),
        "briefing"    : result["response"],
        "ai_source"   : result["source"],
        "father_mode" : father_mode,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


# ── Stock Analysis ────────────────────────────────────
def analyse_stock_with_ai(
    symbol: str,
    indicators: dict,
    fundamentals: dict,
    news: dict,
    recommendation: dict
) -> dict:
    """
    Deep AI analysis of a single stock combining
    technical + fundamental + news + recommendation.

    Args:
        symbol: NSE stock symbol
        indicators: Technical indicators dict
        fundamentals: Fundamental data dict
        news: Recent news and sentiment
        recommendation: Buy/Hold/Sell recommendation

    Returns:
        Comprehensive AI analysis
    """
    # Build context
    tech_context = f"""
TECHNICAL ANALYSIS:
- Current Price: Rs.{indicators.get('current_price', 'N/A')}
- RSI: {indicators['indicators']['rsi']['value']} ({indicators['indicators']['rsi']['signal']})
- MA Signal: {indicators['indicators']['moving_averages']['signal']}
- MACD: {indicators['indicators']['macd']['signal']}
- Bollinger Bands: {indicators['indicators']['bollinger_bands']['signal']}
"""

    fund_context = f"""
FUNDAMENTAL ANALYSIS:
- PE Ratio: {fundamentals['valuation'].get('pe_ratio', 'N/A')} ({fundamentals['valuation'].get('pe_signal', '')})
- Profit Margin: {fundamentals['profitability'].get('profit_margin', 'N/A')}
- ROE: {fundamentals['profitability'].get('roe', 'N/A')}
- Debt Signal: {fundamentals['financial_health'].get('debt_signal', 'N/A')}
- Fundamental Score: {fundamentals.get('fundamental_score', 'N/A')}/100
"""

    news_context = f"""
NEWS SENTIMENT:
- Overall: {news.get('overall_sentiment', {}).get('overall', 'neutral')}
- Recent headlines: {', '.join(news.get('articles', [{}])[:2] and [a.get('title', '') for a in news.get('articles', [])[:2]])}
"""

    rec_context = f"""
CURRENT RECOMMENDATION:
- Signal: {recommendation.get('recommendation', {}).get('signal', 'N/A')}
- Score: {recommendation.get('recommendation', {}).get('final_score', 'N/A')}/100
- Summary: {recommendation.get('recommendation', {}).get('summary', '')}
"""

    system_prompt = f"""You are StockSage AI — a senior equity analyst
for Indian stock markets.

Analyse {symbol} comprehensively using all available data.
Provide:
1. Overall assessment (2-3 sentences)
2. Key strengths (2-3 bullet points)
3. Key risks (2-3 bullet points)
4. Specific price levels to watch
5. Clear recommendation with reasoning
6. One line for father (simple Hindi-English)

Be specific, data-driven, and honest about uncertainties.
Today: {datetime.now().strftime("%d %b %Y")}"""

    user_message = f"""
Analyse {symbol} stock:

{tech_context}
{fund_context}
{news_context}
{rec_context}

Provide a comprehensive investment analysis.
"""

    result = call_ai(system_prompt, user_message)

    return {
        "symbol"     : symbol,
        "analysis"   : result["response"],
        "ai_source"  : result["source"],
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }