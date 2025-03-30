import { NextRequest, NextResponse } from 'next/server';

/**
 * Starts all cron jobs in the application
 * This endpoint is called by an external cron scheduler (e.g., cron.job, GitHub Actions, Vercel Cron)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify this is a legitimate cron request
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Start individual cron jobs
    const jobResults = [];
    
    // Run episode-checker
    try {
      const episodeCheckerResponse = await fetch(
        new URL('/api/cron/episode-checker', request.url), 
        {
          headers: {
            'Authorization': `Bearer ${cronSecret}`
          }
        }
      );
      
      const episodeCheckerResult = await episodeCheckerResponse.json();
      jobResults.push({
        job: 'episode-checker',
        success: episodeCheckerResponse.ok,
        status: episodeCheckerResponse.status,
        result: episodeCheckerResult
      });
    } catch (error) {
      console.error('Error running episode-checker:', error);
      jobResults.push({
        job: 'episode-checker',
        success: false,
        error: error?.toString() || 'Unknown error'
      });
    }
    
    // Add more cron jobs here as needed
    // For example:
    // - User notification sender
    // - Analytics processor
    // - Database cleanup tasks
    
    // 3. Return results
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: jobResults
    });
  } catch (error) {
    console.error('Error starting cron jobs:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.toString() || 'Unknown error' 
    }, { status: 500 });
  }
} 