import { NextRequest, NextResponse } from 'next/server';
import { episodesApi } from '@/lib/db/api';

/**
 * API route to handle SNS notifications for podcast completion events
 * This route is used by AWS SNS to notify the application when a podcast has been processed
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const bodyText = await request.text();
    let body;

    try {
      body = JSON.parse(bodyText);
    } catch (error) {
      console.error('Error parsing SNS notification:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('Received SNS notification:', JSON.stringify(body, null, 2));

    // Handle SNS subscription confirmation
    if (body.Type === 'SubscriptionConfirmation') {
      console.log('SNS subscription confirmation request received');
      
      // Automatically confirm the subscription by making a GET request to the SubscribeURL
      try {
        const response = await fetch(body.SubscribeURL);
        if (response.ok) {
          console.log('SNS subscription confirmed successfully');
          return NextResponse.json({ message: 'Subscription confirmed' }, { status: 200 });
        } else {
          console.error('Failed to confirm SNS subscription:', await response.text());
          return NextResponse.json({ error: 'Failed to confirm subscription' }, { status: 500 });
        }
      } catch (error) {
        console.error('Error confirming SNS subscription:', error);
        return NextResponse.json({ error: 'Error confirming subscription' }, { status: 500 });
      }
    }

    // Process an actual notification
    if (body.Type === 'Notification') {
      try {
        // Parse the message from the notification
        const message = JSON.parse(body.Message);
        console.log('Processing SNS notification message:', JSON.stringify(message, null, 2));
        
        const { episode_id, status, s3_path } = message;
        
        if (!episode_id) {
          console.error('Missing episode_id in SNS notification');
          return NextResponse.json({ error: 'Missing episode_id' }, { status: 400 });
        }
        
        // Update the episode record in the database based on the status
        const episode = await episodesApi.getEpisodeById(episode_id);
        
        if (!episode) {
          console.error(`Episode not found for ID: ${episode_id}`);
          return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
        }
        
        // Update the episode status
        const updateData: {
          status: string;
          audio_url?: string;
          error_message?: string;
        } = {
          status: status === 'success' ? 'completed' : 'error'
        };
        
        // If success and s3_path is provided, update the audio_url
        if (status === 'success' && s3_path) {
          const s3BucketName = process.env.S3_BUCKET_NAME || 'podcasto-podcasts';
          
          // If s3_path already includes the full URL, use it directly
          if (s3_path.startsWith('http')) {
            updateData.audio_url = s3_path;
          } else {
            // Otherwise construct the URL
            // Format: https://<bucket>.s3.<region>.amazonaws.com/<key>
            const region = process.env.AWS_REGION || 'us-east-1';
            updateData.audio_url = `https://${s3BucketName}.s3.${region}.amazonaws.com/${s3_path}`;
          }
          
          console.log(`Setting audio_url for episode ${episode_id} to: ${updateData.audio_url}`);
        }
        
        // Include any error message if present
        if (status === 'error' && message.error) {
          updateData.error_message = message.error;
        }
        
        // Update the episode
        await episodesApi.updateEpisode(episode_id, updateData);
        
        console.log(`Successfully updated episode ${episode_id} with status: ${status}`);
        return NextResponse.json({ message: 'Notification processed successfully' }, { status: 200 });
      } catch (error) {
        console.error('Error processing SNS notification:', error);
        return NextResponse.json({ error: 'Failed to process notification' }, { status: 500 });
      }
    }
    
    // Unknown SNS message type
    console.warn('Unknown SNS message type:', body.Type);
    return NextResponse.json({ message: 'Ignored unknown message type' }, { status: 200 });
    
  } catch (error) {
    console.error('Error handling SNS webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 