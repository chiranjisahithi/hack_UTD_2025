prompt = """
Compare all telecom providers against T-Mobile baseline.

For each provider, extract from the data:
1. Star rating (numeric value from star_rating.current field)
2. Total reports (sum all "reports" values from last_15_days_status array)
3. Number of locations (count of items in last_15_days_status array)
4. Total blackout percentage (from most_reported_problems array, find "Total Blackout" label)
5. Internet issue percentage (from most_reported_problems array, find "Internet" label)
6. Phone issue percentage (from most_reported_problems array, find "Phone" label)

For each provider, compare to T-Mobile:
- List metrics where provider is BETTER than T-Mobile (higher star rating, lower reports, lower percentages)
- List metrics where provider is WORSE than T-Mobile (opposite)
- Provide brief reasoning explaining the comparison

Output JSON format:
{{
  "baseline": "T-Mobile",
  "tmobile": {{
    "star_rating": <extract from data>,
    "total_reports": <sum from data>,
    "locations": <count from data>,
    "total_blackout_pct": <extract from data>,
    "internet_pct": <extract from data>,
    "phone_pct": <extract from data>
  }},
  "providers": [
    {{
      "name": "<provider name>",
      "star_rating": <extract from data>,
      "total_reports": <calculate from data>,
      "locations": <count from data>,
      "total_blackout_pct": <extract from data>,
      "internet_pct": <extract from data>,
      "phone_pct": <extract from data>,
      "better_than_tmobile": ["<list of metric names where better>"],
      "worse_than_tmobile": ["<list of metric names where worse>"],
      "reasoning": "<brief explanation>"
    }}
  ]
}}

All providers data:
{all_data}

T-Mobile data:
{tmobile_data}

Extract all numbers from the actual data provided. Calculate sums properly. Output ONLY valid JSON.
"""

import json
import re
import asyncio
import os
import aiohttp
from pathlib import Path
from dotenv import load_dotenv
from run_multiple import services

load_dotenv()


async def compare_with_tmobile() -> dict:
    """
    Compare all service providers against T-Mobile baseline.
    
    Returns:
        dict: Comparative analysis JSON
    """
    # Load T-Mobile baseline data
    tmobile_path = Path("scraped-data/t-mobile.json")
    if not tmobile_path.exists():
        raise Exception("T-Mobile baseline data not found")
    
    with open(tmobile_path, 'r') as f:
        tmobile_data = json.load(f)
    
    # Load all other providers' data
    all_providers_data = {}
    for service in services:
        service_lower = service.lower()
        service_path = Path("scraped-data") / f"{service_lower}.json"
        
        if service_path.exists() and service_lower != "t-mobile":
            with open(service_path, 'r') as f:
                all_providers_data[service] = json.load(f)
    
    # Prepare data for prompt
    all_data_str = json.dumps(all_providers_data, indent=2)
    tmobile_data_str = json.dumps(tmobile_data, indent=2)
    
    # Make LLM call
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
                "content": prompt.format(all_data=all_data_str, tmobile_data=tmobile_data_str)
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
    
    comparison_content = result["choices"][0]["message"]["content"]
    
    # Remove markdown code block formatting if present
    comparison_content = re.sub(r'^```(?:json)?\n?', '', comparison_content)
    comparison_content = re.sub(r'\n?```$', '', comparison_content)
    comparison_content = comparison_content.strip()
    
    # Try to extract JSON if there's extra text
    json_match = re.search(r'\{.*\}', comparison_content, re.DOTALL)
    if json_match:
        comparison_content = json_match.group(0)
    
    # Parse JSON with better error handling
    try:
        comparison_json = json.loads(comparison_content)
    except json.JSONDecodeError as e:
        # Save the raw content for debugging
        debug_path = Path("reports/comparison_debug.txt")
        debug_path.write_text(comparison_content)
        raise Exception(f"Invalid JSON response. Saved to {debug_path}. Error: {str(e)}")
    
    # Save comparison result
    output_path = Path("reports/comparison_tmobile.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(comparison_json, indent=2))
    
    return comparison_json


async def main():
    result = await compare_with_tmobile()
    print("Comparison complete!")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    asyncio.run(main())

