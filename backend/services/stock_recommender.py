import yfinance as yf
from backend.services.indicators import fetch_technical_indicators
from backend.services.fundamentals import fetch_fundamental_data

# ── Curated Stock Universe ────────────────────────────
# Categorized by risk level and sector
STOCK_UNIVERSE = {
    "low_risk": [
        "TCS", "INFY", "HDFCBANK", "ICICIBANK",
        "HINDUNILVR", "ITC", "NESTLEIND", "BAJFINANCE"
    ],
    "medium_risk": [
        "RELIANCE", "WIPRO", "AXISBANK", "KOTAKBANK",
        "TATAMOTORS", "MARUTI", "TITAN", "ASIAN PAINTS"
    ],
    "high_risk": [
        "TATASTEEL", "SUZLON", "YESBANK", "IDEA",
        "ZOMATO", "NYKAA", "PAYTM", "IRCTC"
    ]
}

# ── Curated SIP Universe ──────────────────────────────
SIP_UNIVERSE = {
    "low_risk": [
        {
            "name"          : "HDFC Nifty 50 Index Fund",
            "category"      : "Index Fund",
            "risk"          : "Low",
            "min_sip"       : 500,
            "expense_ratio" : 0.20,
            "returns_3yr"   : 14.2,
            "returns_5yr"   : 13.8,
            "why"           : "Tracks Nifty 50 — safest way to invest in Indian markets"
        },
        {
            "name"          : "Mirae Asset Large Cap Fund",
            "category"      : "Large Cap",
            "risk"          : "Low-Medium",
            "min_sip"       : 1000,
            "expense_ratio" : 0.54,
            "returns_3yr"   : 15.1,
            "returns_5yr"   : 14.9,
            "why"           : "Consistent performer — invests in India top 100 companies"
        }
    ],
    "medium_risk": [
        {
            "name"          : "Parag Parikh Flexi Cap Fund",
            "category"      : "Flexi Cap",
            "risk"          : "Medium",
            "min_sip"       : 1000,
            "expense_ratio" : 0.63,
            "returns_3yr"   : 18.4,
            "returns_5yr"   : 19.2,
            "why"           : "Best flexi cap — invests in India + global stocks like Google, Amazon"
        },
        {
            "name"          : "Kotak Emerging Equity Fund",
            "category"      : "Mid Cap",
            "risk"          : "Medium",
            "min_sip"       : 1000,
            "expense_ratio" : 0.44,
            "returns_3yr"   : 21.3,
            "returns_5yr"   : 20.1,
            "why"           : "Strong mid cap fund — higher returns but slightly more volatile"
        },
        {
            "name"          : "Nippon India Multi Cap Fund",
            "category"      : "Multi Cap",
            "risk"          : "Medium",
            "min_sip"       : 100,
            "expense_ratio" : 0.79,
            "returns_3yr"   : 22.1,
            "returns_5yr"   : 19.8,
            "why"           : "Diversified across large mid small cap — balanced growth"
        }
    ],
    "high_risk": [
        {
            "name"          : "Quant Small Cap Fund",
            "category"      : "Small Cap",
            "risk"          : "High",
            "min_sip"       : 1000,
            "expense_ratio" : 0.64,
            "returns_3yr"   : 32.4,
            "returns_5yr"   : 28.6,
            "why"           : "Highest returns but very volatile — only for long term 7+ years"
        },
        {
            "name"          : "Edelweiss Mid Cap Fund",
            "category"      : "Mid Cap",
            "risk"          : "High",
            "min_sip"       : 100,
            "expense_ratio" : 0.42,
            "returns_3yr"   : 26.8,
            "returns_5yr"   : 24.3,
            "why"           : "Strong mid cap performer — good for 5+ year horizon"
        }
    ]
}

# ── ETF Universe ──────────────────────────────────────
ETF_UNIVERSE = [
    {
        "symbol"        : "NIFTYBEES",
        "name"          : "Nippon Nifty BeES",
        "category"      : "Index ETF",
        "tracks"        : "Nifty 50",
        "risk"          : "Low",
        "expense_ratio" : 0.04,
        "why"           : "Cheapest way to own all Nifty 50 stocks. Buy like a stock."
    },
    {
        "symbol"        : "GOLDBEES",
        "name"          : "Nippon Gold BeES",
        "category"      : "Gold ETF",
        "tracks"        : "Gold Price",
        "risk"          : "Low-Medium",
        "expense_ratio" : 0.54,
        "why"           : "Digital gold — protect against inflation and market crashes"
    },
    {
        "symbol"        : "BANKBEES",
        "name"          : "Nippon Bank BeES",
        "category"      : "Sectoral ETF",
        "tracks"        : "Nifty Bank",
        "risk"          : "Medium",
        "expense_ratio" : 0.19,
        "why"           : "Banking sector ETF — bet on India financial growth"
    },
    {
        "symbol"        : "ITBEES",
        "name"          : "Nippon IT BeES",
        "category"      : "Sectoral ETF",
        "tracks"        : "Nifty IT",
        "risk"          : "Medium",
        "expense_ratio" : 0.89,
        "why"           : "IT sector ETF — bet on Indian tech companies"
    },
    {
        "symbol"        : "JUNIORBEES",
        "name"          : "Nippon Junior BeES",
        "category"      : "Index ETF",
        "tracks"        : "Nifty Next 50",
        "risk"          : "Medium",
        "expense_ratio" : 0.19,
        "why"           : "Next 50 companies after Nifty 50 — higher growth potential"
    }
]


def get_stock_recommendations(
    budget: float,
    risk_level: str = "medium",
    max_recommendations: int = 5
) -> dict:
    """
    Recommends best stocks to buy within your budget.

    Args:
        budget: Available amount in Rs
        risk_level: "low", "medium", or "high"
        max_recommendations: Number of stocks to recommend

    Returns:
        List of recommended stocks with reasoning
    """
    # Get stocks for risk level
    if risk_level == "low":
        stocks_to_scan = STOCK_UNIVERSE["low_risk"]
    elif risk_level == "high":
        stocks_to_scan = (
            STOCK_UNIVERSE["medium_risk"] +
            STOCK_UNIVERSE["high_risk"]
        )
    else:
        stocks_to_scan = (
            STOCK_UNIVERSE["low_risk"] +
            STOCK_UNIVERSE["medium_risk"]
        )

    recommendations = []

    for symbol in stocks_to_scan:
        try:
            # Get current price
            ticker = yf.Ticker(f"{symbol}.NS")
            info   = ticker.fast_info
            price  = round(info.last_price, 2)

            # Skip if price exceeds budget
            if price > budget:
                continue

            # Get recommendation score
            indicators   = fetch_technical_indicators(symbol)
            fundamentals = fetch_fundamental_data(symbol)

            if not indicators or not fundamentals:
                continue

            # Calculate scores
            tech_score = 50
            rsi = indicators["indicators"]["rsi"]["value"]
            if rsi < 35:
                tech_score += 20
            elif rsi < 50:
                tech_score += 10
            elif rsi > 70:
                tech_score -= 20

            price_vs_ma50 = indicators["indicators"]["moving_averages"]["ma50"]
            if price > price_vs_ma50:
                tech_score += 15
            else:
                tech_score -= 15

            fund_score = fundamentals.get("fundamental_score", 50)

            final_score = round(
                (tech_score * 0.40) +
                (fund_score * 0.40) +
                (50 * 0.20), 1
            )

            # Only recommend if score is decent
            if final_score < 45:
                continue

            # Shares you can buy with budget
            shares_possible = int(budget / price)

            recommendations.append({
                "symbol"         : symbol,
                "company_name"   : fundamentals["company_info"].get("sector", symbol),
                "current_price"  : price,
                "score"          : final_score,
                "shares_possible": shares_possible,
                "investment_needed": round(shares_possible * price, 2),
                "pe_ratio"       : fundamentals["valuation"].get("pe_ratio"),
                "rsi"            : round(rsi, 2),
                "signal"         : "BUY" if final_score >= 60 else "WATCH",
                "why"            : f"Score {final_score}/100. "
                                   f"RSI {round(rsi,1)} — "
                                   f"{'oversold opportunity' if rsi < 45 else 'neutral'}. "
                                   f"Fundamentals: {fundamentals['financial_health']['debt_signal']}.",
                "hindi_reason"   : f"Score {final_score}/100 hai. "
                                   f"Rs.{budget} mein {shares_possible} share kharid sakte ho."
            })

        except Exception as e:
            print(f"Error scanning {symbol}: {e}")
            continue

    # Sort by score — best first
    recommendations.sort(key=lambda x: x["score"], reverse=True)

    return {
        "budget"          : budget,
        "risk_level"      : risk_level,
        "total_found"     : len(recommendations),
        "recommendations" : recommendations[:max_recommendations]
    }


def get_sip_recommendations(
    monthly_budget: float,
    risk_level: str = "medium",
    investment_years: int = 10
) -> dict:
    """
    Recommends best SIPs for your monthly budget and risk level.

    Args:
        monthly_budget: Monthly SIP amount in Rs
        risk_level: "low", "medium", or "high"
        investment_years: How long you plan to invest

    Returns:
        SIP recommendations with projections
    """
    if risk_level == "low":
        sips = SIP_UNIVERSE["low_risk"]
    elif risk_level == "high":
        sips = SIP_UNIVERSE["high_risk"]
    else:
        sips = SIP_UNIVERSE["medium_risk"]

    # Filter by minimum SIP amount
    affordable = [s for s in sips if s["min_sip"] <= monthly_budget]

    # Add projections for each fund
    recommendations = []
    for fund in affordable:
        monthly_rate  = fund["returns_3yr"] / 100 / 12
        total_months  = investment_years * 12
        total_invested = monthly_budget * total_months

        if monthly_rate > 0:
            future_value = monthly_budget * (
                ((1 + monthly_rate) ** total_months - 1) / monthly_rate
            ) * (1 + monthly_rate)
        else:
            future_value = total_invested

        recommendations.append({
            **fund,
            "your_monthly_sip"  : monthly_budget,
            "projection": {
                "years"          : investment_years,
                "total_invested" : round(total_invested, 2),
                "expected_value" : round(future_value, 2),
                "expected_profit": round(future_value - total_invested, 2),
                "returns_percent": round(
                    ((future_value - total_invested) / total_invested) * 100, 2
                )
            },
            "hindi_summary": f"Rs.{monthly_budget}/month, {investment_years} saal mein "
                             f"Rs.{round(total_invested):,} invest karoge. "
                             f"Expected: Rs.{round(future_value):,}"
        })

    # Sort by expected returns
    recommendations.sort(
        key=lambda x: x["projection"]["expected_value"],
        reverse=True
    )

    return {
        "monthly_budget"  : monthly_budget,
        "risk_level"      : risk_level,
        "investment_years": investment_years,
        "recommendations" : recommendations
    }


def get_etf_recommendations(
    budget: float,
    goal: str = "wealth"
) -> dict:
    """
    Recommends best ETFs based on your goal.

    Args:
        budget: Available amount in Rs
        goal: "wealth", "safety", "gold", "sector"

    Returns:
        ETF recommendations
    """
    recommendations = []

    for etf in ETF_UNIVERSE:
        try:
            ticker = yf.Ticker(f"{etf['symbol']}.NS")
            info   = ticker.fast_info
            price  = round(info.last_price, 2)

            units_possible = int(budget / price)

            if units_possible < 1:
                continue

            # Filter by goal
            if goal == "safety" and etf["risk"] not in ["Low", "Low-Medium"]:
                continue
            if goal == "gold" and etf["category"] != "Gold ETF":
                continue
            if goal == "sector" and etf["category"] != "Sectoral ETF":
                continue

            recommendations.append({
                **etf,
                "current_price"   : price,
                "units_possible"  : units_possible,
                "investment_needed": round(units_possible * price, 2),
                "hindi_summary"   : f"Rs.{budget} mein {units_possible} units. "
                                    f"Tracks: {etf['tracks']}"
            })

        except Exception as e:
            print(f"Error fetching ETF {etf['symbol']}: {e}")
            continue

    return {
        "budget"          : budget,
        "goal"            : goal,
        "recommendations" : recommendations
    }


def get_complete_recommendation(
    budget: float,
    monthly_sip: float,
    risk_level: str = "medium",
    investment_years: int = 10
) -> dict:
    """
    Complete investment recommendation combining
    stocks + SIPs + ETFs for your budget.

    Args:
        budget: Lump sum available for stocks/ETFs
        monthly_sip: Monthly amount for SIPs
        risk_level: "low", "medium", or "high"
        investment_years: Investment horizon

    Returns:
        Complete investment plan
    """
    stocks = get_stock_recommendations(budget, risk_level)
    sips   = get_sip_recommendations(monthly_sip, risk_level, investment_years)
    etfs   = get_etf_recommendations(budget, "wealth")

    # Suggested allocation
    if risk_level == "low":
        allocation = {
            "large_cap_stocks": "40%",
            "index_etf"       : "30%",
            "debt_fund_sip"   : "20%",
            "gold_etf"        : "10%"
        }
        allocation_hindi = "40% bade stocks, 30% index ETF, 20% debt fund, 10% gold"
    elif risk_level == "high":
        allocation = {
            "mid_small_stocks": "50%",
            "sectoral_etf"    : "20%",
            "aggressive_sip"  : "30%",
        }
        allocation_hindi = "50% mid/small stocks, 20% sectoral ETF, 30% aggressive SIP"
    else:
        allocation = {
            "large_cap_stocks": "30%",
            "index_etf"       : "20%",
            "flexi_cap_sip"   : "30%",
            "gold_etf"        : "10%",
            "cash_reserve"    : "10%"
        }
        allocation_hindi = "30% stocks, 20% ETF, 30% SIP, 10% gold, 10% cash"

    return {
        "your_profile": {
            "lump_sum_budget" : budget,
            "monthly_sip"     : monthly_sip,
            "risk_level"      : risk_level,
            "investment_years": investment_years
        },
        "suggested_allocation": allocation,
        "allocation_hindi"    : allocation_hindi,
        "stock_picks"         : stocks["recommendations"][:3],
        "sip_picks"           : sips["recommendations"][:3],
        "etf_picks"           : etfs["recommendations"][:3],
        "overall_summary": {
            "hindi"  : f"Aapke Rs.{budget} lump sum ke liye top stocks "
                       f"aur Rs.{monthly_sip}/month SIP ke liye best funds "
                       f"recommend kiye hain. Risk level: {risk_level}.",
            "english": f"Based on Rs.{budget} lump sum and "
                       f"Rs.{monthly_sip}/month SIP with {risk_level} risk "
                       f"over {investment_years} years."
        }
    }