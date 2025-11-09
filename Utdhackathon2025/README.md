# T-Mobile Outage Monitor - UTD Hackathon 2025

## Project Overview

A comprehensive real-time T-Mobile outage monitoring dashboard built for UTD Hackathon 2025. This application provides detailed service status tracking, provider comparisons, and analytics.

## Features

- **Dashboard**: Real-time outage monitoring with interactive visualizations
- **T-Mobile Report**: Detailed analytics including:
  - Key metrics (Internet Issues, Phone Outages, Blackouts, Wi-Fi Problems)
  - Geographic hotspots
  - Sentiment analysis with customer feedback
  - Critical insights and recommendations
  - Pain index scoring
- **Provider Comparison**: Side-by-side comparison of T-Mobile against 8 major telecommunications providers

## Technologies Used

- **React** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn-ui** component library
- **Lucide Icons**
- **React Router** for navigation

## Getting Started

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

- `/src/pages/` - Main application pages (Index, TMobileReport, ComparisonPage)
- `/src/components/` - Reusable UI components
- `/src/data/` - JSON data files for outage reports and comparisons
- `/public/` - Static assets including T-Mobile logo
