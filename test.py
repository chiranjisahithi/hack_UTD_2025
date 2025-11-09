import os
import asyncio
from dotenv import load_dotenv
from crawl4ai import (
    AsyncWebCrawler,
    BrowserConfig,
    CrawlerRunConfig,
    CacheMode,
    LLMConfig,
    LLMExtractionStrategy,
)
from pydantic import BaseModel, Field

# Load environment variables (like OPENROUTER_API_KEY)
load_dotenv()

# -------------------------------------------
# Define schema for structured data extraction
# -------------------------------------------
from pydantic import BaseModel, Field
from typing import List, Optional


class SocialReport(BaseModel):
    username: str = Field(..., description="The name of the person or account reporting the issue.")
    handle: Optional[str] = Field(None, description="The handle or identifier of the account (e.g., Twitter or platform username).")
    report_time: str = Field(..., description="How long ago the report was made (e.g., '5 minutes ago').")
    message: str = Field(..., description="The content of the report or complaint.")
    mentioned_entities: Optional[List[str]] = Field(None, description="Any companies, brands, or users mentioned in the report.")


class UserComment(BaseModel):
    name: str = Field(..., description="Name of the commenter.")
    time_ago: str = Field(..., description="Relative time when the comment was posted (e.g., '2 days ago').")
    comment: str = Field(..., description="The text of the user comment.")
    upvotes: Optional[int] = Field(None, description="Number of upvotes or likes, if available.")
    replies: Optional[int] = Field(None, description="Number of replies, if available.")


class AffectedLocation(BaseModel):
    city: str = Field(..., description="City or region name where the issue was reported.")
    state_or_country: Optional[str] = Field(None, description="State, province, or country name if applicable.")
    report_count: Optional[int] = Field(None, description="Number of reports from this location, if shown.")


class LiveOutage(BaseModel):
    city: str = Field(..., description="City or region where a recent outage was reported.")
    issue_type: str = Field(..., description="Type of issue, such as 'Internet', 'Wi-Fi', 'Phone', or 'Total Blackout'.")
    reported_time: str = Field(..., description="When the outage was reported (e.g., '3 hours ago').")


class ProblemType(BaseModel):
    category: str = Field(..., description="Type of problem reported, such as 'Internet', 'Phone', 'Wi-Fi', 'Email', or 'TV'.")
    percentage: float = Field(..., description="Percentage of total reports associated with this problem type.")


class OutageTrendPoint(BaseModel):
    time_of_day: str = Field(..., description="Time of day (e.g., '14:00').")
    report_count: int = Field(..., description="Number of reports logged during that time.")


class ServiceOutageReport(BaseModel):
    service_name: str = Field(..., description="The name of the company or service provider (e.g., AT&T, Comcast, Verizon).")
    social_reports: Optional[List[SocialReport]] = Field(None, description="Recent issue reports from social media or external feeds.")
    user_comments: Optional[List[UserComment]] = Field(None, description="User comments or feedback from the outage discussion section.")
    affected_locations: Optional[List[AffectedLocation]] = Field(None, description="List of most affected cities or regions with report counts.")
    live_outages: Optional[List[LiveOutage]] = Field(None, description="Recently reported outages by type and time.")
    problem_breakdown: Optional[List[ProblemType]] = Field(None, description="Breakdown of problem categories by percentage of total reports.")
    outage_trend_24h: Optional[List[OutageTrendPoint]] = Field(None, description="Time-series data showing number of reports over the past 24 hours.")
    map_summary: Optional[str] = Field(None, description="Textual summary of the outage heatmap and its geographical distribution.")
    summary_comment: Optional[str] = Field(None, description="A concise summary of the current outage situation for this service.")


# -------------------------------------------
# Main asynchronous function
# -------------------------------------------
async def main():
    # Browser configuration for the crawler
    browser_config = BrowserConfig(
        verbose=True,
        headless=True,
        text_mode=False,
    )

    # Crawler run configuration
    run_config = CrawlerRunConfig(
        extraction_strategy=LLMExtractionStrategy(
            # LLM configuration (OpenRouter)
            llm_config=LLMConfig(
                provider="openrouter/nvidia/nemotron-nano-9b-v2:free",
                base_url="https://openrouter.ai/api/v1",
                api_token=os.getenv("OPENROUTER_API_KEY"),
            ),
            verbose=True,
            schema=ServiceOutageReport.model_json_schema(),
            extraction_type="schema",
            instruction="""
            From the crawled webpage, extract structured information about outage or service disruption reports. 
        The page may include sections such as recent social media posts, user comments, outage maps, affected 
        locations, live outages, problem-type breakdowns, and 24-hour report trends.

        Follow these guidelines:

        1. Identify the company or service name (e.g., AT&T, Verizon, Spectrum, Xfinity).
        2. Collect all recent social media issue reports: include username, handle, time of post, and message.
        3. Collect all user comments from the discussion section: include commenter name, time, and message text.
        4. Capture the list of affected locations and number of reports per location.
        5. Capture live outage information (city, issue type, time reported).
        6. Record the breakdown of reported problems by type and percentage.
        7. Capture the 24-hour report trend if a graph or chart is available (time vs. number of reports).
        8. Summarize the outage map geographically (which regions or states are most affected).
        9. End with a brief text summary describing the overall situation.

        Return all extracted data as a structured JSON object following the ServiceOutageReport schema.
        Ensure all numbers and times are consistent with the web content and avoid invented data.

""",
        ),
        cache_mode=CacheMode.BYPASS,
    )

    # -------------------------------------------
    # Run the async crawler and extract results
    # -------------------------------------------
    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(
            url="https://istheservicedown.com/problems/att",
            config=run_config,
        )

        # Print structured extracted content
        print(result.extracted_content)


# -------------------------------------------
# Entry point
# -------------------------------------------
if __name__ == "__main__":
    asyncio.run(main())
