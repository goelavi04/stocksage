from datetime import datetime
from dateutil.relativedelta import relativedelta


def calculate_sip(
    monthly_amount: float,
    annual_return_rate: float,
    years: int,
    inflation_rate: float = 6.0
) -> dict:
    """
    Calculates SIP returns with year by year breakdown.

    Args:
        monthly_amount: Monthly SIP amount in Rs
        annual_return_rate: Expected annual return %
        years: Investment duration in years
        inflation_rate: Annual inflation rate % (default 6%)

    Returns:
        Complete SIP calculation with projections
    """
    monthly_rate    = annual_return_rate / 100 / 12
    total_months    = years * 12
    total_invested  = monthly_amount * total_months

    # SIP Future Value Formula
    # FV = P × ((1 + r)^n - 1) / r × (1 + r)
    if monthly_rate > 0:
        future_value = monthly_amount * (
            ((1 + monthly_rate) ** total_months - 1) / monthly_rate
        ) * (1 + monthly_rate)
    else:
        future_value = total_invested

    wealth_gained       = future_value - total_invested
    absolute_returns    = round((wealth_gained / total_invested) * 100, 2)

    # Inflation adjusted value
    inflation_monthly   = inflation_rate / 100 / 12
    if inflation_monthly > 0:
        inflation_adjusted = future_value / (
            (1 + inflation_monthly) ** total_months
        )
    else:
        inflation_adjusted = future_value

    # Year by year breakdown
    yearly_breakdown = []
    running_value    = 0
    running_invested = 0

    for year in range(1, years + 1):
        months_so_far    = year * 12
        running_invested = monthly_amount * months_so_far

        if monthly_rate > 0:
            running_value = monthly_amount * (
                ((1 + monthly_rate) ** months_so_far - 1) / monthly_rate
            ) * (1 + monthly_rate)
        else:
            running_value = running_invested

        yearly_breakdown.append({
            "year"            : year,
            "invested_so_far" : round(running_invested, 2),
            "current_value"   : round(running_value, 2),
            "profit_so_far"   : round(running_value - running_invested, 2),
            "returns_percent" : round(
                ((running_value - running_invested) / running_invested) * 100, 2
            )
        })

    # Different scenarios
    scenarios = []
    for rate in [8, 10, 12, 15, 18]:
        r = rate / 100 / 12
        if r > 0:
            fv = monthly_amount * (
                ((1 + r) ** total_months - 1) / r
            ) * (1 + r)
        else:
            fv = total_invested

        scenarios.append({
            "return_rate"   : rate,
            "future_value"  : round(fv, 2),
            "wealth_gained" : round(fv - total_invested, 2),
            "label"         : {
                8 : "Conservative (Debt Fund)",
                10: "Moderate (Balanced Fund)",
                12: "Growth (Large Cap Fund)",
                15: "Aggressive (Mid Cap Fund)",
                18: "Very Aggressive (Small Cap Fund)"
            }[rate]
        })

    return {
        "inputs": {
            "monthly_amount"    : monthly_amount,
            "annual_return_rate": annual_return_rate,
            "years"             : years,
            "inflation_rate"    : inflation_rate
        },
        "results": {
            "total_invested"      : round(total_invested, 2),
            "future_value"        : round(future_value, 2),
            "wealth_gained"       : round(wealth_gained, 2),
            "absolute_returns"    : absolute_returns,
            "inflation_adjusted"  : round(inflation_adjusted, 2),
            "effective_return"    : round(annual_return_rate - inflation_rate, 2)
        },
        "summary": {
            "hindi": f"Aap {years} saal mein Rs.{round(total_invested):,} invest karenge. "
                     f"Expected corpus: Rs.{round(future_value):,}. "
                     f"Inflation adjust karke: Rs.{round(inflation_adjusted):,}.",
            "english": f"Investing Rs.{monthly_amount:,.0f}/month for {years} years "
                       f"at {annual_return_rate}% returns Rs.{round(future_value):,}. "
                       f"Real value after inflation: Rs.{round(inflation_adjusted):,}."
        },
        "yearly_breakdown": yearly_breakdown,
        "scenarios"        : scenarios
    }


def analyse_existing_sip(
    fund_name: str,
    monthly_amount: float,
    start_date: str,
    expected_rate: float = 12.0
) -> dict:
    """
    Analyses an existing SIP — how much have you made so far
    and what will you make if you continue.

    Args:
        fund_name: Name of the mutual fund
        monthly_amount: Monthly SIP amount
        start_date: When SIP started (YYYY-MM-DD)
        expected_rate: Expected annual return rate

    Returns:
        Complete analysis of existing SIP
    """
    try:
        start  = datetime.strptime(start_date, "%Y-%m-%d")
        today  = datetime.now()
        months_completed = (
            (today.year - start.year) * 12 +
            (today.month - start.month)
        )

        if months_completed <= 0:
            months_completed = 1

        # What you've invested so far
        invested_so_far = monthly_amount * months_completed

        # What it should be worth now
        monthly_rate = expected_rate / 100 / 12
        if monthly_rate > 0:
            current_value = monthly_amount * (
                ((1 + monthly_rate) ** months_completed - 1) / monthly_rate
            ) * (1 + monthly_rate)
        else:
            current_value = invested_so_far

        profit_so_far   = current_value - invested_so_far
        returns_percent = round((profit_so_far / invested_so_far) * 100, 2)

        # Future projections — if you continue for 5, 10, 15, 20 years
        projections = []
        years_completed = months_completed / 12

        for future_years in [5, 10, 15, 20]:
            if future_years <= years_completed:
                continue

            remaining_months = int((future_years - years_completed) * 12)
            total_months     = months_completed + remaining_months
            total_invested   = monthly_amount * total_months

            if monthly_rate > 0:
                fv = monthly_amount * (
                    ((1 + monthly_rate) ** total_months - 1) / monthly_rate
                ) * (1 + monthly_rate)
            else:
                fv = total_invested

            projections.append({
                "years_from_start" : future_years,
                "years_remaining"  : round(future_years - years_completed, 1),
                "total_invested"   : round(total_invested, 2),
                "expected_value"   : round(fv, 2),
                "expected_profit"  : round(fv - total_invested, 2)
            })

        return {
            "fund_name"        : fund_name,
            "monthly_amount"   : monthly_amount,
            "start_date"       : start_date,
            "months_completed" : months_completed,
            "years_completed"  : round(years_completed, 1),
            "current_status": {
                "invested_so_far" : round(invested_so_far, 2),
                "current_value"   : round(current_value, 2),
                "profit_so_far"   : round(profit_so_far, 2),
                "returns_percent" : returns_percent
            },
            "future_projections": projections,
            "summary": {
                "hindi"  : f"Aapne {months_completed} mahine mein "
                           f"Rs.{round(invested_so_far):,} invest kiya. "
                           f"Expected value: Rs.{round(current_value):,}. "
                           f"Profit: Rs.{round(profit_so_far):,}.",
                "english": f"After {months_completed} months, invested "
                           f"Rs.{round(invested_so_far):,}. "
                           f"Expected value: Rs.{round(current_value):,}. "
                           f"Profit: Rs.{round(profit_so_far):,}."
            }
        }

    except Exception as e:
        print(f"SIP analysis error: {e}")
        return None