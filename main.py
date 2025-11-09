import asyncio
from analyse_insights import analyze_insights
from run_multiple import services

# Limit concurrent requests to avoid rate limiting
SEMAPHORE = asyncio.Semaphore(8)

async def process_service(service_provider: str):
    """
    Process a single service provider.
    
    Args:
        service_provider: Name of the service provider
    """
    async with SEMAPHORE:
        try:
            print(f"Processing {service_provider}...")
            await analyze_insights(service_provider)
            print(f"✓ Completed {service_provider}")
        except Exception as e:
            print(f"✗ Error processing {service_provider}: {e}")


async def main():
    """
    Process all service providers concurrently with limited concurrency.
    """
    print(f"Starting async processing for {len(services)} services...")
    
    tasks = [process_service(service.lower()) for service in services]
    await asyncio.gather(*tasks)
    
    print(f"\nCompleted processing all services. Reports saved to reports/ folder.")


if __name__ == "__main__":
    asyncio.run(main())
