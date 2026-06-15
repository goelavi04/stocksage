import pandas as pd
import pandas_ta as ta
from datetime import datetime
from backend.services.yahoo_client import chart


def fetch_technical_indicators(symbol: str):
    try:
        result = chart(f"{symbol.upper()}.NS", interval='1d', range_='1y')
        if not result:
            result = chart(f"{symbol.upper()}.BO", interval='1d', range_='1y')
        if not result:
            return None

        timestamps = result.get('timestamp', [])
        q = result.get('indicators', {}).get('quote', [{}])[0]

        df = pd.DataFrame({
            'Open':   q.get('open',   []),
            'High':   q.get('high',   []),
            'Low':    q.get('low',    []),
            'Close':  q.get('close',  []),
            'Volume': q.get('volume', []),
        }, index=pd.to_datetime([datetime.fromtimestamp(ts) for ts in timestamps]))
        df.dropna(subset=['Close'], inplace=True)

        if df.empty:
            return None

        df["RSI"] = ta.rsi(df["Close"], length=14)

        df["MA20"]  = ta.sma(df["Close"], length=20)
        df["MA50"]  = ta.sma(df["Close"], length=50)
        df["MA200"] = ta.sma(df["Close"], length=200)

        bbands = ta.bbands(df["Close"], length=20, std=2)
        # pandas_ta column names vary by version; try both suffixes
        bb_col_upper  = next((c for c in bbands.columns if c.startswith('BBU')), None)
        bb_col_middle = next((c for c in bbands.columns if c.startswith('BBM')), None)
        bb_col_lower  = next((c for c in bbands.columns if c.startswith('BBL')), None)
        if bb_col_upper:
            df["BB_upper"]  = bbands[bb_col_upper]
            df["BB_middle"] = bbands[bb_col_middle]
            df["BB_lower"]  = bbands[bb_col_lower]

        macd = ta.macd(df["Close"], fast=12, slow=26, signal=9)
        macd_col        = next((c for c in macd.columns if c.startswith('MACD_')), None)
        macd_sig_col    = next((c for c in macd.columns if c.startswith('MACDs_')), None)
        macd_hist_col   = next((c for c in macd.columns if c.startswith('MACDh_')), None)
        if macd_col:
            df["MACD"]        = macd[macd_col]
            df["MACD_signal"] = macd[macd_sig_col]
            df["MACD_hist"]   = macd[macd_hist_col]

        latest = df.iloc[-1]
        current_price = round(float(latest["Close"]), 2)

        rsi_value = round(float(latest["RSI"]), 2) if pd.notna(latest.get("RSI")) else 50.0
        if rsi_value < 35:
            rsi_signal = "Oversold — potential buy opportunity"
        elif rsi_value > 70:
            rsi_signal = "Overbought — consider waiting for pullback"
        else:
            rsi_signal = "Neutral"

        ma50_value = round(float(latest["MA50"]), 2) if pd.notna(latest.get("MA50")) else current_price
        ma_signal = "Bullish — price above MA50" if current_price > ma50_value else "Bearish — price below MA50"

        bb_upper = round(float(latest["BB_upper"]), 2) if "BB_upper" in df.columns and pd.notna(latest.get("BB_upper")) else current_price * 1.05
        bb_lower = round(float(latest["BB_lower"]), 2) if "BB_lower" in df.columns and pd.notna(latest.get("BB_lower")) else current_price * 0.95
        if current_price > bb_upper:
            bb_signal = "Price above upper band — overbought"
        elif current_price < bb_lower:
            bb_signal = "Price below lower band — oversold"
        else:
            bb_signal = "Price within bands — normal range"

        macd_val  = round(float(latest["MACD"]), 2) if "MACD" in df.columns and pd.notna(latest.get("MACD")) else 0
        macd_sig  = round(float(latest["MACD_signal"]), 2) if "MACD_signal" in df.columns and pd.notna(latest.get("MACD_signal")) else 0
        macd_interp = "Bullish — MACD above signal line" if macd_val > macd_sig else "Bearish — MACD below signal line"

        return {
            "symbol": symbol.upper(),
            "current_price": current_price,
            "indicators": {
                "rsi": {
                    "value": rsi_value,
                    "signal": rsi_signal,
                },
                "moving_averages": {
                    "ma20":   round(float(latest["MA20"]), 2) if pd.notna(latest.get("MA20")) else None,
                    "ma50":   ma50_value,
                    "ma200":  round(float(latest["MA200"]), 2) if pd.notna(latest.get("MA200")) else None,
                    "signal": ma_signal,
                },
                "bollinger_bands": {
                    "upper":  bb_upper,
                    "middle": round(float(latest["BB_middle"]), 2) if "BB_middle" in df.columns and pd.notna(latest.get("BB_middle")) else current_price,
                    "lower":  bb_lower,
                    "signal": bb_signal,
                },
                "macd": {
                    "macd":        macd_val,
                    "signal_line": macd_sig,
                    "histogram":   round(float(latest["MACD_hist"]), 2) if "MACD_hist" in df.columns and pd.notna(latest.get("MACD_hist")) else 0,
                    "signal":      macd_interp,
                },
            },
        }

    except Exception as e:
        print(f"[fetch_technical_indicators] {symbol}: {e}")
        return None
