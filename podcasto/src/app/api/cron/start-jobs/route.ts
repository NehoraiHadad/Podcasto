import { NextRequest, NextResponse } from 'next/server';

/**
 * Starts all cron jobs in the application
 * This endpoint is called by an external cron scheduler (e.g., cron.job, GitHub Actions, Vercel Cron)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[CRON] start-jobs endpoint called');
    
    // 1. Verify this is a legitimate cron request
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    console.log('[CRON] Checking authorization. Auth header exists:', !!authHeader);
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[CRON] Authorization failed:', { 
        secretConfigured: !!cronSecret,
        headerProvided: !!authHeader
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[CRON] Authorization successful');
    
    // 2. Start individual cron jobs
    const jobResults = [];
    
    // Run episode-checker
    try {
      console.log('[CRON] Preparing to call episode-checker');
      
      // Log the URL we're about to call
      const episodeCheckerUrl = new URL('/api/cron/episode-checker', request.url);
      console.log('[CRON] Calling URL:', episodeCheckerUrl.toString());
      
      const episodeCheckerResponse = await fetch(
        episodeCheckerUrl, 
        {
          headers: {
            'Authorization': `Bearer ${cronSecret}`
          }
        }
      );
      
      console.log('[CRON] episode-checker response status:', episodeCheckerResponse.status);
      
      const episodeCheckerResult = await episodeCheckerResponse.json();
      console.log('[CRON] episode-checker result:', JSON.stringify(episodeCheckerResult, null, 2));
      
      jobResults.push({
        job: 'episode-checker',
        success: episodeCheckerResponse.ok,
        status: episodeCheckerResponse.status,
        result: episodeCheckerResult
      });
    } catch (error) {
      console.error('[CRON] Error running episode-checker:', error);
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
    console.log('[CRON] All jobs completed. Results:', JSON.stringify(jobResults, null, 2));
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: jobResults
    });
  } catch (error) {
    console.error('[CRON] Error starting cron jobs:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.toString() || 'Unknown error' 
    }, { status: 500 });
  }
} 