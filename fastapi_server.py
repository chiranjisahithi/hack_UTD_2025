from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
from pathlib import Path
from analyse_insights import analyze_insights
from compare_tmob import compare_with_tmobile
from webscrapper import scrape_and_save

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/analyze")
async def analyze_service(service: str):
    if not service:
        raise HTTPException(status_code=400, detail="Missing 'service' parameter")
    
    try:
        print(f"[1/3] Starting analysis for {service}...")
        await analyze_insights(service.lower())
        print(f"[2/3] Analysis complete, reading report...")
        
        report_path = Path("reports") / f"{service.lower()}.json"
        if not report_path.exists():
            raise HTTPException(status_code=500, detail="Report not generated")
        
        with open(report_path, 'r') as f:
            report_json = json.load(f)
        print(f"[3/3] Report loaded successfully for {service}")
        return report_json
        
    except Exception as e:
        print(f"[ERROR] Failed for {service}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/compare_metrics")
async def compare_metrics():
    try:
        print("[1/2] Starting comparison with T-Mobile...")
        result = await compare_with_tmobile()
        print("[2/2] Comparison complete")
        return result
        
    except Exception as e:
        print(f"[ERROR] Comparison failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/check_report")
async def check_report(filename: str):
    """Check if a report file exists"""
    report_path = Path("reports") / filename
    return {"exists": report_path.exists()}


@app.get("/get_report")
async def get_report(filename: str):
    """Get a report file if it exists"""
    report_path = Path("reports") / filename
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    
    with open(report_path, 'r') as f:
        return json.load(f)


@app.get("/get_scraped_data")
async def get_scraped_data(filename: str):
    """Get a scraped data file if it exists"""
    data_path = Path("scraped-data") / filename
    if not data_path.exists():
        raise HTTPException(status_code=404, detail="Scraped data not found")
    
    with open(data_path, 'r') as f:
        return json.load(f)


@app.delete("/delete_report")
async def delete_report(filename: str):
    """Delete a report file if it exists"""
    report_path = Path("reports") / filename
    if report_path.exists():
        report_path.unlink()
        return {"message": f"Report {filename} deleted successfully", "deleted": True}
    return {"message": f"Report {filename} does not exist", "deleted": False}


@app.get("/ensure_scraped_data")
async def ensure_scraped_data(service: str):
    """
    Scrape data for a service every time this endpoint is called.
    Returns the freshly scraped data.
    """
    service_lower = service.lower()
    
    try:
        print(f"[SCRAPE] Scraping fresh data for {service}...")
        data = await scrape_and_save(service_lower)
        print(f"[SCRAPE] Successfully scraped and saved data for {service}")
        return data
    except Exception as e:
        print(f"[ERROR] Failed to scrape {service}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to scrape data: {str(e)}")


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
