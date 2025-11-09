import json
import asyncio
import os
import aiohttp
from dotenv import load_dotenv

load_dotenv()

async def analyze_chart_image(image_url: str) -> dict:
    """
    Analyzes a chart image using Nemotron vision model.
    
    Args:
        image_url: URL of the image to analyze
    
    Returns:
        dict: API response containing the analysis
    """
    # Convert SVG URL to JPG using weserv.nl service
    convert_url = f"https://images.weserv.nl/?url={image_url}&output=jpg"
    
    # Wait 2 seconds for chart to get loaded to JPG format
    await asyncio.sleep(2)
    
    # Send to OpenRouter API
    api_url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://yourwebsite.com",
        "X-Title": "MyApp"
    }
    
    payload = {
        "model": "nvidia/nemotron-nano-12b-v2-vl:free",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "The image is a chart of a service outage in last 24 hours. Please analyze the chart and provide a summary of the outage. It should give the key insights of the outage."},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": convert_url
                        }
                    }
                ]
            }
        ]
    }
    
    connector = aiohttp.TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        async with session.post(api_url, headers=headers, json=payload) as response:
            return await response.json()


async def main():
    image_url = "https://itsdcdn.com/us/charts/chartsvg/1110/470/134071269000000000/14580771-1F35-4CE9-8DF7-998BE5605886.svg"
    result = await analyze_chart_image(image_url)
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
