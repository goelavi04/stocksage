import pandas as pd
import pandas_ta as ta
import yfinance as yf


def fetch_technical_indicators(symbol: str):
    """
    Calculates technical indicators for a given stock.
    These indicators feed directly into the Recommendation Engine.

    Indicators calculated:
    - RSI (14 day)
    - Moving Averages (MA20, MA50, MA200)
    - Bollinger Bands
    - MACD
    """
    try:
        # Step 1: Get 1 year of historical data
        # We need enough history to calculate MA200 accurately
        ticker = yf.Ticker(f"{symbol.upper()}.NS")
        df = ticker.history(period="1y")

        if df.empty:
            return None

        # Step 2: Calculate RSI (14 day)
        df["RSI"] = ta.rsi(df["Close"], length=14)

        # Step 3: Calculate Moving Averages
        df["MA20"]  = ta.sma(df["Close"], length=20)
        df["MA50"]  = ta.sma(df["Close"], length=50)
        df["MA200"] = ta.sma(df["Close"], length=200)

        # Step 4: Calculate Bollinger Bands
        bbands = ta.bbands(df["Close"], length=20, std=2)
        df["BB_upper"]  = bbands["BBU_20_2.0_2.0"]
        df["BB_middle"] = bbands["BBM_20_2.0_2.0"]
        df["BB_lower"]  = bbands["BBL_20_2.0_2.0"]

        # Step 5: Calculate MACD
        macd = ta.macd(df["Close"], fast=12, slow=26, signal=9)
        df["MACD"]        = macd["MACD_12_26_9"]
        df["MACD_signal"] = macd["MACDs_12_26_9"]
        df["MACD_hist"]   = macd["MACDh_12_26_9"]

        # Step 6: Get the latest values (most recent trading day)
        latest = df.iloc[-1]
        current_price = round(latest["Close"], 2)

        # Step 7: Generate signal interpretations
        rsi_value = round(latest["RSI"], 2)
        if rsi_value < 35:
            rsi_signal = "Oversold — potential buy opportunity"
        elif rsi_value > 70:
            rsi_signal = "Overbought — consider waiting for pullback"
        else:
            rsi_signal = "Neutral"

        # MA trend signal
        ma50_value = round(latest["MA50"], 2)
        if current_price > ma50_value:
            ma_signal = "Bullish — price above MA50"
        else:
            ma_signal = "Bearish — price below MA50"

        # Bollinger Band position
        bb_upper = round(latest["BB_upper"], 2)
        bb_lower = round(latest["BB_lower"], 2)
        if current_price > bb_upper:
            bb_signal = "Price above upper band — overbought"
        elif current_price < bb_lower:
            bb_signal = "Price below lower band — oversold"
        else:
            bb_signal = "Price within bands — normal range"

        # MACD signal
        macd_value         = round(latest["MACD"], 2)
        macd_signal_value  = round(latest["MACD_signal"], 2)
        if macd_value > macd_signal_value:
            macd_interpretation = "Bullish — MACD above signal line"
        else:
            macd_interpretation = "Bearish — MACD below signal line"

        return {
    "symbol": symbol.upper(),
    "current_price": float(round(latest["Close"], 2)),
    "indicators": {
        "rsi": {
            "value": float(round(latest["RSI"], 2)),
            "signal": rsi_signal
        },
        "moving_averages": {
            "ma20": float(round(latest["MA20"], 2)),
            "ma50": float(round(latest["MA50"], 2)),
            "ma200": float(round(latest["MA200"], 2)),
            "signal": ma_signal
        },
        "bollinger_bands": {
            "upper": float(round(latest["BB_upper"], 2)),
            "middle": float(round(latest["BB_middle"], 2)),
            "lower": float(round(latest["BB_lower"], 2)),
            "signal": bb_signal
        },
        "macd": {
            "macd": float(round(latest["MACD"], 2)),
            "signal_line": float(round(latest["MACD_signal"], 2)),
            "histogram": float(round(latest["MACD_hist"], 2)),
            "signal": macd_interpretation
        }
    }
}

    except Exception as e:
        print(f"Error calculating indicators for {symbol}: {e}")
        return None