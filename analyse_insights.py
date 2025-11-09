prompt="""
Analyze telecom service data and generate a comprehensive dashboard JSON for UI display.

CRITICAL RULES - STRICTLY ENFORCE:
1. Output ONLY valid JSON - no markdown, no code blocks, no explanations, no comments
2. Extract ALL values from actual data provided - DO NOT invent or estimate values
3. DO NOT HALLUCINATE - Only use information that exists in the provided data. If data is not present, use null or empty values. Never make up facts, numbers, locations, or insights.
4. All percentages MUST be between 0-100 (inclusive)
5. pain_index MUST be between 0.0-10.0 (inclusive) - round to 1 decimal place
6. star_rating MUST be between 0.0-5.0 (inclusive) - round to 2 decimal places
7. All counts MUST be non-negative integers (>= 0)
8. Array lengths: key_metrics (4-5), active_outages (max 10), problem_distribution (all from data), geographic_hotspots (top 3-5), recent_activity (6-8), critical_insights (3-4), recommendations (2-3), sentiment.samples (3-4)
9. Status values: "good", "moderate", or "major issues" ONLY
10. Status colors: "green", "yellow", or "red" ONLY
11. Severity values: "high", "medium", or "low" ONLY
12. Trend values: "up", "down", or "stable" ONLY
13. Trend direction: "improving", "declining", or "stable" ONLY
14. Sentiment percentages MUST sum to 100 (negative + neutral + positive = 100)
15. Problem distribution percentages should sum to approximately 100 (allow small rounding differences)
16. Use actual timestamps from data - format as ISO 8601 strings
17. If data is missing, use null or empty array/string - DO NOT invent values
18. For critical_insights and recommendations: Only derive from actual data patterns. Do not create generic or made-up insights.
19. For geographic_hotspots: Only include cities/locations that appear in the actual data.
20. For customer sentiment samples: Only use actual user comments/text from the data, do not create fake complaints.

Extract and structure:
1. Header: provider name, overall status (good/moderate/major issues), star rating, total recent reports
2. Key metrics: top 4-5 KPIs with values, icons, and trend indicators (up/down/stable)
3. Active outages: list with city, reason, time ago, severity (high/medium/low)
4. Problem breakdown: distribution percentages for chart visualization
5. Geographic hotspots: top affected cities with report counts and severity
6. Recent activity: timeline of last 6-8 outages with timestamps
7. Customer sentiment: percentage breakdown, top 3-4 sample complaints
8. Trend analysis: based on chart, is service improving/declining/stable
9. Critical insights: top 3-4 key findings that need attention
10. Recommendations: 2-3 actionable items

Calculate pain_index (0.0-10.0):
  pain_index = (0.4 * negative_sentiment%) + (0.3 * internet_issue%) + (0.2 * blackout%) + (0.1 * active_outage_cities/total_cities*100)
  Ensure result is clamped between 0.0 and 10.0

Output JSON structure:
{{
  "header": {{
    "provider": "<name>",
    "status": "<good|moderate|major issues>",
    "status_color": "<green|yellow|red>",
    "star_rating": <number>,
    "rating_count": "<formatted>",
    "total_reports_24h": <count>,
    "last_updated": "<timestamp>"
  }},
  "key_metrics": [
    {{
      "title": "<metric name>",
      "value": "<formatted value>",
      "icon": "<emoji>",
      "trend": "<up|down|stable>",
      "trend_value": "<+5% or -2%>"
    }}
  ],
  "active_outages": [
    {{
      "city": "<name>",
      "reason": "<type>",
      "time_ago": "<human readable>",
      "severity": "<high|medium|low>",
      "timestamp": "<ISO>"
    }}
  ],
  "problem_distribution": [
    {{"label": "<type>", "percent": <number>, "color": "<hex>"}}
  ],
  "geographic_hotspots": [
    {{
      "city": "<name>",
      "reports_count": <number>,
      "severity": "<high|medium|low>",
      "top_issue": "<type>"
    }}
  ],
  "recent_activity": [
    {{
      "time": "<human readable>",
      "city": "<name>",
      "issue": "<type>",
      "timestamp": "<ISO>"
    }}
  ],
  "sentiment": {{
    "negative": <percent>,
    "neutral": <percent>,
    "positive": <percent>,
    "samples": [
      {{
        "user": "<name>",
        "text": "<complaint>",
        "tone": "<frustrated|angry|disappointed>",
        "time_ago": "<human readable>"
      }}
    ]
  }},
  "trend_analysis": {{
    "direction": "<improving|declining|stable>",
    "description": "<brief explanation>",
    "chart_insights": "<key findings from chart>"
  }},
  "critical_insights": [
    "<insight 1>",
    "<insight 2>",
    "<insight 3>"
  ],
  "pain_index": <number between 0.0-10.0, rounded to 1 decimal>,
  "recommendations": [
    "<actionable item 1>",
    "<actionable item 2>"
  ]
}}

Data provided:
{data}

Chart analysis (last 24h trends):
{analysis}

VALIDATION CHECKLIST BEFORE OUTPUTTING:
- All percentages are 0-100
- pain_index is 0.0-10.0
- star_rating is 0.0-5.0
- All counts are >= 0
- Sentiment percentages sum to 100
- Array lengths match specified ranges
- Status/severity/trend values are from allowed lists only
- All values extracted from actual data (no invented numbers, no hallucinated content)
- NO HALLUCINATION: Every insight, location, complaint, and metric must come from the actual data provided
- Timestamps are valid ISO 8601 format
- Output is pure JSON (no markdown, no code blocks, no text before/after)

Extract all numbers from actual data. Use timestamps from latest_reports and issues_reports. Calculate trends from chart analysis. 
Output ONLY valid JSON - no markdown code blocks, no explanations, no comments, no text outside JSON.
"""

import json
import re
import asyncio
import os
import aiohttp
from pathlib import Path
from dotenv import load_dotenv
from webscrapper import scrape_and_save
from imageanalysis_nemotron import analyze_chart_image

load_dotenv()

async def analyze_insights(service_provider: str) -> dict:
    """
    Analyze insights for a service provider and generate dashboard JSON.
    
    Args:
        service_provider: Name of the service provider (e.g., "att", "verizon")
    
    Returns:
        dict: Dashboard JSON result
    """
    data = await scrape_and_save(service_provider)

    try:
        image_url = data["chart"]["image_src"]
        analysis = await analyze_chart_image(image_url)
        analysis_text = analysis["choices"][0]["message"]["content"]
    except (KeyError, TypeError):
        analysis_text = "No chart data available for the last 24 hours."

    api_url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "nvidia/nemotron-nano-9b-v2:free",
        "messages": [
            {
                "role": "user",
                "content": prompt.format(data=json.dumps(data), analysis=analysis_text)
            }
        ]
    }

    connector = aiohttp.TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        async with session.post(api_url, headers=headers, json=payload) as response:
            result = await response.json()
            if response.status != 200:
                raise Exception(f"API error: {result}")
            if "choices" not in result or not result["choices"]:
                raise Exception(f"Invalid API response: {result}")
    
    dashboard_content = result["choices"][0]["message"]["content"]
    
    # Remove markdown code block formatting if present
    dashboard_content = re.sub(r'^```(?:json)?\n?', '', dashboard_content)
    dashboard_content = re.sub(r'\n?```$', '', dashboard_content)
    dashboard_content = dashboard_content.strip()
    
    # Parse and validate JSON
    try:
        dashboard_json = json.loads(dashboard_content)
        
        # Validate and clamp values
        if "pain_index" in dashboard_json and dashboard_json["pain_index"] is not None:
            try:
                dashboard_json["pain_index"] = max(0.0, min(10.0, round(float(dashboard_json["pain_index"]), 1)))
            except (ValueError, TypeError):
                dashboard_json["pain_index"] = 0.0
        
        if "header" in dashboard_json and "star_rating" in dashboard_json["header"] and dashboard_json["header"]["star_rating"] is not None:
            try:
                dashboard_json["header"]["star_rating"] = max(0.0, min(5.0, round(float(dashboard_json["header"]["star_rating"]), 2)))
            except (ValueError, TypeError):
                dashboard_json["header"]["star_rating"] = 0.0
        
        # Validate sentiment percentages
        if "sentiment" in dashboard_json:
            sent = dashboard_json["sentiment"]
            for key in ["negative", "neutral", "positive"]:
                if key in sent and sent[key] is not None:
                    try:
                        sent[key] = max(0, min(100, int(round(float(sent[key])))))
                    except (ValueError, TypeError):
                        sent[key] = 0
            # Ensure they sum to 100
            total = sent.get("negative", 0) + sent.get("neutral", 0) + sent.get("positive", 0)
            if total != 100 and total > 0:
                # Normalize to 100
                scale = 100 / total
                sent["negative"] = int(round(sent.get("negative", 0) * scale))
                sent["neutral"] = int(round(sent.get("neutral", 0) * scale))
                sent["positive"] = 100 - sent["negative"] - sent["neutral"]
        
        # Validate problem distribution percentages
        if "problem_distribution" in dashboard_json:
            for prob in dashboard_json["problem_distribution"]:
                if "percent" in prob and prob["percent"] is not None:
                    try:
                        prob["percent"] = max(0, min(100, int(round(float(prob["percent"])))))
                    except (ValueError, TypeError):
                        prob["percent"] = 0
        
        # Validate array lengths
        if "key_metrics" in dashboard_json and len(dashboard_json["key_metrics"]) > 5:
            dashboard_json["key_metrics"] = dashboard_json["key_metrics"][:5]
        if "active_outages" in dashboard_json and len(dashboard_json["active_outages"]) > 10:
            dashboard_json["active_outages"] = dashboard_json["active_outages"][:10]
        if "geographic_hotspots" in dashboard_json and len(dashboard_json["geographic_hotspots"]) > 5:
            dashboard_json["geographic_hotspots"] = dashboard_json["geographic_hotspots"][:5]
        if "recent_activity" in dashboard_json and len(dashboard_json["recent_activity"]) > 8:
            dashboard_json["recent_activity"] = dashboard_json["recent_activity"][:8]
        if "critical_insights" in dashboard_json and len(dashboard_json["critical_insights"]) > 4:
            dashboard_json["critical_insights"] = dashboard_json["critical_insights"][:4]
        if "recommendations" in dashboard_json and len(dashboard_json["recommendations"]) > 3:
            dashboard_json["recommendations"] = dashboard_json["recommendations"][:3]
        if "sentiment" in dashboard_json and "samples" in dashboard_json["sentiment"]:
            if len(dashboard_json["sentiment"]["samples"]) > 4:
                dashboard_json["sentiment"]["samples"] = dashboard_json["sentiment"]["samples"][:4]
        
        # Validate enum values
        if "header" in dashboard_json:
            if "status" in dashboard_json["header"]:
                if dashboard_json["header"]["status"] not in ["good", "moderate", "major issues"]:
                    dashboard_json["header"]["status"] = "moderate"
            if "status_color" in dashboard_json["header"]:
                if dashboard_json["header"]["status_color"] not in ["green", "yellow", "red"]:
                    dashboard_json["header"]["status_color"] = "yellow"
        
        # Validate counts are non-negative
        if "header" in dashboard_json and "total_reports_24h" in dashboard_json["header"] and dashboard_json["header"]["total_reports_24h"] is not None:
            try:
                dashboard_json["header"]["total_reports_24h"] = max(0, int(dashboard_json["header"]["total_reports_24h"]))
            except (ValueError, TypeError):
                dashboard_json["header"]["total_reports_24h"] = 0
        
        # Re-serialize to JSON
        dashboard_content = json.dumps(dashboard_json, indent=2, ensure_ascii=False)
        
    except json.JSONDecodeError as e:
        print(f"[WARNING] JSON parse error, saving raw content: {e}")
        # If JSON is invalid, save raw content for debugging
        dashboard_content = dashboard_content
    
    # Save final report
    reports_dir = Path("reports")
    reports_dir.mkdir(parents=True, exist_ok=True)
    report_filename = f"{service_provider.lower()}.json"
    report_path = reports_dir / report_filename
    report_path.write_text(dashboard_content)
    
    return result


async def main():
    service_provider = "att"
    result = await analyze_insights(service_provider)
    
    print("Dashboard:")
    print(result["choices"][0]["message"]["content"])


if __name__ == "__main__":
    asyncio.run(main())