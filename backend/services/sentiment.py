from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch

# ── Load FinBERT Model ────────────────────────────────
# This downloads the model first time (~440MB)
# After that it's cached on your PC forever
# No internet needed after first download

print("Loading FinBERT model... (first time takes 2-3 minutes)")

MODEL_NAME = "ProsusAI/finbert"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

# Create sentiment pipeline
# Pipeline = a ready to use AI tool that handles everything automatically
sentiment_pipeline = pipeline(
    "text-classification",
    model=model,
    tokenizer=tokenizer,
    device=-1  # -1 = CPU, 0 = GPU (we use CPU)
)

print("FinBERT model loaded successfully ✅")


def analyse_sentiment(text: str) -> dict:
    """
    Analyses sentiment of a financial news headline.

    Args:
        text: News headline or short paragraph

    Returns:
        Dictionary with sentiment label and confidence score
    """
    try:
        # Truncate text if too long
        # FinBERT has a 512 token limit
        text = text[:512]

        result = sentiment_pipeline(text)[0]

        label = result["label"].lower()
        confidence = round(result["score"], 4)

        # Map to our standard labels
        if label == "positive":
            emoji = "🟢"
            impact = "good"
        elif label == "negative":
            emoji = "🔴"
            impact = "bad"
        elif label == "neutral":
            emoji = "⚪"
            impact = "neutral"
        else:
            emoji = "🟡"
            impact = "uncertain"

        return {
            "sentiment": label,
            "confidence": confidence,
            "emoji": emoji,
            "impact": impact,
            "text": text[:100] + "..." if len(text) > 100 else text
        }

    except Exception as e:
        print(f"Sentiment analysis error: {e}")
        return {
            "sentiment": "neutral",
            "confidence": 0.0,
            "emoji": "⚪",
            "impact": "neutral",
            "text": text[:100]
        }


def analyse_news_batch(headlines: list) -> list:
    """
    Analyses sentiment for a list of headlines at once.
    More efficient than calling analyse_sentiment one by one.

    Args:
        headlines: List of news headline strings

    Returns:
        List of sentiment results
    """
    results = []
    for headline in headlines:
        sentiment = analyse_sentiment(headline)
        results.append(sentiment)
    return results


def get_overall_sentiment(headlines: list) -> dict:
    """
    Gets overall market sentiment from multiple headlines.
    Used to judge if today is a good or bad day for markets.

    Args:
        headlines: List of news headlines

    Returns:
        Overall sentiment summary
    """
    if not headlines:
        return {"overall": "neutral", "score": 0}

    results = analyse_news_batch(headlines)

    # Count sentiments
    positive = sum(1 for r in results if r["sentiment"] == "positive")
    negative = sum(1 for r in results if r["sentiment"] == "negative")
    neutral  = sum(1 for r in results if r["sentiment"] == "neutral")

    total = len(results)

    # Calculate sentiment score (-100 to +100)
    score = round(((positive - negative) / total) * 100, 1)

    if score > 30:
        overall = "positive"
        market_mood = "🟢 Market mood is positive today"
        hindi = "Aaj market ka mood achha hai"
    elif score < -30:
        overall = "negative"
        market_mood = "🔴 Market mood is negative today"
        hindi = "Aaj market ka mood kharab hai — cautious rahein"
    else:
        overall = "neutral"
        market_mood = "⚪ Market mood is mixed today"
        hindi = "Aaj market mixed hai — koi bada move nahi"

    return {
        "overall": overall,
        "score": score,
        "market_mood": market_mood,
        "hindi_summary": hindi,
        "breakdown": {
            "positive": positive,
            "negative": negative,
            "neutral": neutral,
            "total": total
        }
    }