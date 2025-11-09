# T-Mobile Outage Monitor

Real-time telecommunications outage monitoring dashboard with provider comparisons and sentiment analysis.

## System Workflow

![System Workflow](./images/workflow1.png)

## Tech Stack

**Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui  
**Backend:** Python + FastAPI + BeautifulSoup + Crawl4AI + OpenAI  
**Data:** Web scraping from istheservicedown.com

## Setup

### Frontend
```bash
cd Utdhackathon2025
npm install
npm run dev
```

### Backend
```bash
# Install dependencies (from Utdhackathon2025 directory)
pip install .

# Run FastAPI server
python fastapi_server.py

# Run scraper and analyzer
python main.py
```

## Features

- **Dashboard**: Real-time outage monitoring with interactive charts
- **T-Mobile Report**: Detailed metrics, geographic hotspots, sentiment analysis
- **Provider Comparison**: Compare T-Mobile against 8 major telecom providers
- **Analytics**: Pain index scoring, customer feedback insights

## Project Structure

```
├── Utdhackathon2025/       # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Route pages
│   │   └── data/            # JSON data files
├── webscrapper.py           # Web scraping logic
├── analyse_insights.py      # OpenAI-powered analysis
├── compare_tmob.py          # Provider comparison
├── fastapi_server.py        # API server
├── main.py                  # Main execution script
├── scraped-data/            # Raw scraped data
└── reports/                 # Generated analysis reports
```

## API Endpoints

- `GET /analyze?service=<name>` - Analyze service and generate AI insights
- `GET /compare_metrics` - Compare T-Mobile with other providers
- `GET /check_report?filename=<name>` - Check if report exists
- `GET /get_report?filename=<name>` - Retrieve specific report
- `GET /get_scraped_data?filename=<name>` - Get raw scraped data
- `GET /ensure_scraped_data?service=<name>` - Scrape fresh data for service
- `DELETE /delete_report?filename=<name>` - Delete a report file

## Requirements

- Python 3.12+
- Node.js 18+
- OpenAI API key (for analysis features)
