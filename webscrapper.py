"""
Scrape outage metadata from istheservicedown.com using cloudscraper.
Bypasses Cloudflare automatically, then parses with BeautifulSoup.
"""

import re
import json
import asyncio
from pathlib import Path
from datetime import datetime
from bs4 import BeautifulSoup
import cloudscraper
from urllib.parse import urljoin


# ---------------------------------------------------------------------------
#  Helpers

def text(el):
    return el.get_text(strip=True) if el else ""

def attr(el, name):
    return el.get(name) if el and el.has_attr(name) else None

def parse_datetime(raw):
    if not raw:
        return None
    try:
        # Try ISO format first
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).isoformat()
    except Exception:
        try:
            # Try parsing title format: "Wednesday, November 5, 2025 9:52 PM"
            # Common formats: "%A, %B %d, %Y %I:%M %p" or "%A, %B %d, %Y %I:%M %p"
            dt = datetime.strptime(raw, "%A, %B %d, %Y %I:%M %p")
            return dt.isoformat()
        except Exception:
            # If all parsing fails, return raw value
            return raw


# ---------------------------------------------------------------------------
#  Parsers

def parse_head_meta(soup):
    head = {}
    head["title"] = text(soup.find("title"))
    head["canonical"] = attr(soup.find("link", rel="canonical"), "href")

    for name in ["description", "generated", "robots", "theme-color", "msapplication-TileColor"]:
        tag = soup.find("meta", attrs={"name": name})
        if tag:
            head[name] = attr(tag, "content")

    # Open Graph
    og = {}
    for prop in ["og:site_name", "og:type", "og:title", "og:description", "og:image", "og:url"]:
        tag = soup.find("meta", property=prop)
        if tag:
            og[prop.split(":")[1]] = attr(tag, "content")
    if og:
        head["open_graph"] = og

    # Twitter
    tw = {}
    for name in [
        "twitter:site", "twitter:site:id", "twitter:card", "twitter:creator",
        "twitter:title", "twitter:description", "twitter:image", "twitter:domain"
    ]:
        tag = soup.find("meta", attrs={"name": name})
        if tag:
            tw[name.split(":")[1]] = attr(tag, "content")
    if tw:
        head["twitter"] = tw

    return head


def parse_json_ld(soup):
    graphs = []
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string)
        except Exception:
            continue
        if isinstance(data, dict) and "@graph" in data:
            graphs.extend(data["@graph"])
        else:
            graphs.append(data)

    result = {"graphs": graphs}
    for key in ["Article", "WebPage", "ImageObject", "BreadcrumbList"]:
        node = next((g for g in graphs if isinstance(g, dict) and g.get("@type") == key), None)
        if node:
            result[key.lower()] = node
    return result


def parse_service_header(soup):
    return {
        "title_h1": text(soup.select_one("main article header h1")),
        "subtitle_h2": text(soup.select_one("main article header h2")),
        "logo": attr(soup.select_one(".service-logo-container img"), "src"),
    }


def parse_service_status(soup):
    box = soup.select_one(".service-status-alert-box")
    if not box:
        return {}

    return {
        "status_class": " ".join(box.get("class", [])),
        "title": text(box.select_one(".status-title-normal, .status-title-major, .status-title-some")),
        "summary": text(box.select_one(".status-summary")),
    }


def parse_star_rating(soup):
    container = soup.select_one(".star-rating-text")
    if not container:
        return {}

    current = container.select_one(".star-rating-current")
    count = container.select_one(".star-rating-count")

    return {
        "current": text(current) or None,
        "count": text(count) or None,
    }


def parse_chart(soup):
    chart = {}
    for script in soup.find_all("script"):
        if script.string and "var chartTs" in script.string:
            match = re.search(r"var\s+chartTs\s*=\s*(\d+)", script.string)
            if match:
                chart["chart_ts"] = match.group(1)
            break

    img = soup.select_one("#chart-container #chart-img")
    if img:
        chart["image_src"] = attr(img, "src")
        # chart["image_alt"] = attr(img, "alt")
        alt = attr(img, "alt") or ""
        m = re.search(r"(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2})", alt)
        if m:
            chart["alt_time"] = m.group(1)
    return chart


def parse_most_reported(soup):
    problems = []
    for li in soup.select("ol.doughtnut-list > li"):
        label = text(li.select_one("p"))
        percent_text = text(li.select_one("p span")) or attr(li.select_one("img"), "alt") or ""
        m = re.search(r"(\d+)%", percent_text)
        percent = int(m.group(1)) if m else None
        label = re.sub(r"\(\d+%\)", "", label).strip()
        problems.append({"label": label, "percent": percent})
    return problems


def parse_live_outage_cities(soup):
    cities = []
    header = next((h for h in soup.find_all("h3") if "Live Outage Map" in text(h)), None)
    para = header.find_next("p") if header else None
    if not para:
        return cities
    for a in para.find_all("a"):
        cities.append({"city": text(a), "href": attr(a, "href")})
    return cities


def parse_latest_reports(soup):
    reports = []
    for tr in soup.select("#latestreports tr"):
        cells = tr.find_all("td")
        if len(cells) != 3:
            continue
        time_el = cells[2].find("time")
        reports.append({
            "city": text(cells[0]),
            "reason": text(cells[1]),
            "time_human": text(cells[2]),
            "time_iso": parse_datetime(attr(time_el, "datetime")),
        })
    return reports


def parse_issue_feed(soup):
    issues = []
    for li in soup.select("ul.reports > li"):
        # Get the first span.pseudolink (user name), not the one inside time span
        pseudolinks = li.select("span.pseudolink")
        user = text(pseudolinks[0]) if pseudolinks else None
        
        # Get text from p > span
        p_tag = li.select_one("p")
        body = text(p_tag.select_one("span")) if p_tag else None
        
        # Get time from time tag
        time_el = li.select_one("time")
        time_iso = parse_datetime(attr(time_el, "datetime")) if time_el else None
        
        # Get location from city-link
        loc_el = li.select_one("a.city-link")
        location = text(loc_el) if loc_el else None
        
        entry = {
            "user": user,
            "text": body,
            "time_iso": time_iso,
        }
        if location:
            entry["location"] = location
        
        issues.append(entry)
    return issues


def parse_company_posts(soup):
    posts_section = soup.select_one("#twitter-timeline-section")
    posts = []
    if not posts_section:
        return posts
    
    for anchor in posts_section.select("a"):
        tweet = {
            "url": attr(anchor, "href"),
            "name": text(anchor.select_one(".twitter-timeline-name")) or None,
            "reply_context": text(anchor.select_one(".twitter-timeline-reply")) or None,
            "text": text(anchor.select_one(".twitter-timeline-text")) or None,
        }
        
        time_tag = anchor.select_one(".twitter-timeline-time time")
        if time_tag and time_tag.has_attr("datetime"):
            tweet["timestamp"] = time_tag["datetime"]
        elif time_tag:
            tweet["timestamp"] = text(time_tag)
        
        posts.append(tweet)
    
    return posts


def last_15_days_status(html, base_url: str = "https://istheservicedown.com"):
    """
    Parse the outage map table of most affected locations.

    Accepts either a BeautifulSoup instance or raw HTML.
    """
    if isinstance(html, BeautifulSoup):
        soup = html
    else:
        soup = BeautifulSoup(html, "html.parser")

    table = soup.find("table", id="status-table")
    if not table:
        return []

    body = table.find("tbody") or table
    rows = []
    for tr in body.find_all("tr"):
        cells = tr.find_all("td")
        if len(cells) != 2:
            continue

        location_cell, reports_cell = cells
        link = location_cell.find("a")

        location = text(link) if link else text(location_cell)
        href = attr(link, "href")
        absolute_href = urljoin(base_url, href) if href else None

        reports_text = text(reports_cell)
        try:
            reports = int(reports_text.replace(",", ""))
        except (TypeError, ValueError):
            reports = reports_text or None

        rows.append(
            {
                "location": location or None,
                #"href": absolute_href,
                "reports": reports,
            }
        )

    return rows



# ---------------------------------------------------------------------------
#  Main

def parse_outage_page(html):
    soup = BeautifulSoup(html, "html.parser")
    return {
        # "head_meta": parse_head_meta(soup),
        # "json_ld": parse_json_ld(soup),
        # "service_header": parse_service_header(soup),
        # "service_status": parse_service_status(soup),
        "star_rating": parse_star_rating(soup),
        "chart": parse_chart(soup),
        "most_reported_problems": parse_most_reported(soup),
        #"live_outage_cities": parse_live_outage_cities(soup),
        "latest_reports": parse_latest_reports(soup),
        "issues_reports": parse_issue_feed(soup),
        "company_posts": parse_company_posts(soup),
    }



# ---------------------------------------------------------------------------
#  Async functions

async def scrape_outage_page(service_provider: str) -> dict:
    """
    Asynchronously scrape outage page for a given service provider.
    
    Args:
        service_provider: Name of the service provider (e.g., "att", "verizon")
    
    Returns:
        dict: Parsed outage data
    """
    url = f"https://istheservicedown.com/problems/{service_provider}"
    map_url = f"https://istheservicedown.com/problems/{service_provider}/map"

    def _fetch_html(url: str) -> str:
        scraper = cloudscraper.create_scraper(browser={"browser": "chrome", "platform": "windows", "desktop": True})
        return scraper.get(url, timeout=30).text

    html, map_html = await asyncio.gather(
        asyncio.to_thread(_fetch_html, url),
        asyncio.to_thread(_fetch_html, map_url)
    )

    data = parse_outage_page(html)
    data["last_15_days_status"] = last_15_days_status(map_html)
    
    return data


async def scrape_and_save(service_provider: str) -> dict:
    """
    Scrape outage data and save to scraped-data folder.
    
    Args:
        service_provider: Name of the service provider
    
    Returns:
        dict: Parsed outage data
    """
    data = await scrape_outage_page(service_provider)
    
    output_dir = Path("scraped-data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"{service_provider.lower()}.json"
    output_path = output_dir / filename
    
    # Write the data to file
    json_str = json.dumps(data, indent=2, ensure_ascii=True)
    output_path.write_text(json_str)
    
    # Verify the write
    issues_count = len(data.get("issues_reports", []))
    print(f"[SAVE] Saved {issues_count} issues_reports to {output_path}")
    
    return data


# ---------------------------------------------------------------------------
#  Fetch and run

if __name__ == "__main__":
    async def main():
        data = await scrape_and_save("att")
        print(f"Scraped and saved AT&T outage metadata")
    
    asyncio.run(main())
