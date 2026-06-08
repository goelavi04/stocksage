from backend.services.sentiment import analyse_sentiment, get_overall_sentiment

# Test with real headlines about your stocks
headlines = [
    "JIO Financial Services wins RBI payment bank approval",
    "Vodafone Idea defaults on adjusted gross revenue dues",
    "Tata Steel reports record quarterly profit on strong demand",
    "Indian markets fall 500 points on global selloff",
    "SEBI introduces new regulations for financial services companies"
]

print("Testing FinBERT on real headlines...")
print()

for h in headlines:
    result = analyse_sentiment(h)
    print(f"{result['emoji']} {result['sentiment'].upper()} ({result['confidence']}) — {h[:60]}")

print()
print("Overall sentiment:")
overall = get_overall_sentiment(headlines)
print(overall['market_mood'])
print(overall['hindi_summary'])
print("Score:", overall['score'])