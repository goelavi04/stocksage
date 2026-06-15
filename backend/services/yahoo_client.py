import requests
import time
from threading import Lock

_session = None
_crumb = None
_crumb_time = 0
_lock = Lock()

_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://finance.yahoo.com/',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
}


def _fetch_crumb(s: requests.Session) -> str | None:
    """Try to fetch a Yahoo Finance crumb (single attempt)."""
    try:
        r = s.get('https://query2.finance.yahoo.com/v1/test/getcrumb', timeout=10)
        if r.status_code == 200 and r.text.strip():
            return r.text.strip()
        print(f"[Yahoo] Crumb not available (status {r.status_code})")
    except Exception as e:
        print(f"[Yahoo] Crumb fetch error: {e}")
    return None


def _init_session() -> bool:
    global _session, _crumb, _crumb_time
    try:
        s = requests.Session()
        s.headers.update(_HEADERS)
        # Warm up cookies — always save session even if crumb fails
        s.get('https://finance.yahoo.com', timeout=15, allow_redirects=True)
        _session = s
        _crumb_time = time.time()
        _crumb = _fetch_crumb(s)
        if _crumb:
            print(f"[Yahoo] Session ready with crumb")
        else:
            print("[Yahoo] Session ready (no crumb — fundamentals may be unavailable)")
        return True
    except Exception as e:
        print(f"[Yahoo] Session init error: {e}")
    return False


def _get():
    global _session, _crumb, _crumb_time
    with _lock:
        if _session is None or time.time() - _crumb_time > 1500:
            _init_session()
    return _session, _crumb


def chart(symbol: str, interval: str = '1d', range_: str = '1y') -> dict | None:
    """Return the first chart result for a Yahoo Finance symbol (e.g. 'TCS.NS')."""
    session, crumb = _get()
    if not session:
        return None

    params = {'interval': interval, 'range': range_, 'includePrePost': 'false'}
    if crumb:
        params['crumb'] = crumb

    for base in ['https://query2.finance.yahoo.com', 'https://query1.finance.yahoo.com']:
        try:
            resp = session.get(f"{base}/v8/finance/chart/{symbol}", params=params, timeout=15)
            if resp.status_code == 200:
                result = resp.json().get('chart', {}).get('result')
                if result:
                    return result[0]
            elif resp.status_code == 401:
                # Crumb expired — reinitialize and retry once
                with _lock:
                    _init_session()
                session, crumb = _session, _crumb
                if crumb:
                    params['crumb'] = crumb
        except Exception as e:
            print(f"[Yahoo] chart error ({base}/{symbol}): {e}")
    return None


def summary(symbol: str, modules: str) -> dict | None:
    """Return quoteSummary result for a Yahoo Finance symbol."""
    global _crumb, _crumb_time
    session, crumb = _get()
    if not session:
        return None

    # If no crumb yet, try to get one now (session is warm)
    if not crumb:
        crumb = _fetch_crumb(session)
        if crumb:
            _crumb = crumb
            _crumb_time = time.time()

    if not crumb:
        return None  # quoteSummary requires a valid crumb

    params = {'modules': modules, 'crumb': crumb}
    url = f"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{symbol}"
    try:
        resp = session.get(url, params=params, timeout=15)
        if resp.status_code == 200:
            result = resp.json().get('quoteSummary', {}).get('result')
            if result:
                return result[0]
        elif resp.status_code == 401:
            # Crumb expired — refresh once and retry
            new_crumb = _fetch_crumb(session)
            if new_crumb:
                _crumb = new_crumb
                _crumb_time = time.time()
                params['crumb'] = new_crumb
                resp2 = session.get(url, params=params, timeout=15)
                if resp2.status_code == 200:
                    result = resp2.json().get('quoteSummary', {}).get('result')
                    if result:
                        return result[0]
    except Exception as e:
        print(f"[Yahoo] summary error ({symbol}): {e}")
    return None
