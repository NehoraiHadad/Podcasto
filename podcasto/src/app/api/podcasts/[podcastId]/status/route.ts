import { NextRequest, NextResponse } from 'next/server';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { episodesApi } from '@/lib/db/api';

/**
 * API route to check podcast generation status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ podcastId: string }> }
) {
  try {
    const { podcastId } = await params;
    
    if (!podcastId) {
      return NextResponse.json({ error: 'Podcast ID is required' }, { status: 400 });
    }
    
    // Get the timestamp from query params
    const searchParams = request.nextUrl.searchParams;
    const timestamp = searchParams.get('timestamp');
    
    if (!timestamp) {
      return NextResponse.json({ error: 'Timestamp is required' }, { status: 400 });
    }
    
    // Get all episodes for this podcast
    const podcastEpisodes = await episodesApi.getEpisodesByPodcastId(podcastId);
    
    // Find the episode with matching timestamp in metadata
    let targetEpisode = null;
    for (const episode of podcastEpisodes) {
      if (episode.metadata) {
        try {
          const metadata = JSON.parse(episode.metadata);
          if (metadata.generation_timestamp === timestamp) {
            targetEpisode = episode;
            break;
          }
        } catch (error) {
          // Skip episodes with invalid metadata
          continue;
        }
      }
    }
    
    if (!targetEpisode) {
      return NextResponse.json(
        { error: 'Episode not found for the given timestamp', status: 'unknown' },
        { status: 404 }
      );
    }
    
    let status = targetEpisode.status || 'pending';
    let message = 'Podcast generation is in progress.';
    
    // If the status is still pending, check if the file exists in S3
    if (status === 'pending') {
      try {
        // Check if the podcast file exists in S3
        // Use us-west-1 region as that's where our bucket is located
        const s3Client = new S3Client({ 
          region: 'us-west-1', // Hardcoded to match the bucket's actual region
          forcePathStyle: false, // Use virtual-hosted style URLs
          followRegionRedirects: true, // Follow region redirects automatically
          useAccelerateEndpoint: false // Don't use accelerated endpoints
        });
        
        const bucketName = process.env.S3_BUCKET_NAME;
        
        if (bucketName) {
          // Use episode_id as the folder name if available in metadata
          // Otherwise, fallback to timestamp for backward compatibility
          let episodeId = timestamp;
          if (targetEpisode.metadata) {
            try {
              const metadata = JSON.parse(targetEpisode.metadata);
              if (metadata.episode_id) {
                episodeId = metadata.episode_id;
              }
            } catch (error) {
              console.warn('Failed to parse episode metadata for episode_id:', error);
            }
          }
          
          // Try to find the podcast file by listing objects in the folder
          try {
            // First, try with the episode_id
            const listCommand = new ListObjectsV2Command({
              Bucket: bucketName,
              Prefix: `podcasts/${podcastId}/${episodeId}/`,
              MaxKeys: 10
            });
            
            // Use try/catch specifically for this request
            try {
              const listResult = await s3Client.send(listCommand);
              
              // Check if there's a podcast.mp3 file
              const podcastFile = listResult.Contents?.find(item => 
                item.Key?.endsWith('podcast.mp3')
              );
              
              if (podcastFile && podcastFile.Key) {
                // Found the podcast file
                status = 'completed';
                message = 'Podcast generation complete.';
                
                // Update the episode status - use the correct regional endpoint in the URL
                await episodesApi.updateEpisode(targetEpisode.id, {
                  status: 'completed',
                  audio_url: `https://${bucketName}.s3-us-west-1.amazonaws.com/${podcastFile.Key}`
                });
              } else if (episodeId !== timestamp) {
                // If not found and episodeId is different from timestamp,
                // try again with the timestamp as fallback
                const fallbackListCommand = new ListObjectsV2Command({
                  Bucket: bucketName,
                  Prefix: `podcasts/${podcastId}/${timestamp}/`,
                  MaxKeys: 10
                });
                
                const fallbackResult = await s3Client.send(fallbackListCommand);
                
                const fallbackFile = fallbackResult.Contents?.find(item => 
                  item.Key?.endsWith('podcast.mp3')
                );
                
                if (fallbackFile && fallbackFile.Key) {
                  // Found the podcast file in the fallback location
                  status = 'completed';
                  message = 'Podcast generation complete.';
                  
                  // Update the episode status - use the correct regional endpoint in the URL
                  await episodesApi.updateEpisode(targetEpisode.id, {
                    status: 'completed',
                    audio_url: `https://${bucketName}.s3-us-west-1.amazonaws.com/${fallbackFile.Key}`
                  });
                }
              }
            } catch (redirectError: any) {
              if (redirectError.Code === 'PermanentRedirect' && redirectError.Endpoint) {
                // Extract the correct endpoint from the error
                const correctEndpoint = redirectError.Endpoint;
                console.log(`Correct S3 endpoint detected: ${correctEndpoint}`);
                
                // Set the status to pending as we couldn't check properly
                status = 'pending';
                message = 'Podcast generation in progress. S3 redirect encountered.';
              } else {
                throw redirectError; // Re-throw if not a redirect error
              }
            }
          } catch (listError: any) {
            console.error('Error listing objects in S3:', listError);
            
            // If we got a PermanentRedirect error, extract the correct endpoint info
            if (listError.Code === 'PermanentRedirect' && listError.Endpoint) {
              console.log(`Bucket endpoint: ${listError.Endpoint}`);
            }
          }
        }
      } catch (checkError) {
        console.error('Error during S3 check:', checkError);
      }
    }
    
    // Get SQS queue information
    let queueInfo = {};
    try {
      // Get the SQS queue URL from environment variables
      const sqsQueueUrl = process.env.SQS_QUEUE_URL;
      
      if (sqsQueueUrl) {
        // Initialize SQS client
        const sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
        
        // Check the SQS queue status
        const queueAttributesCommand = new GetQueueAttributesCommand({
          QueueUrl: sqsQueueUrl,
          AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
        });
        
        const queueAttributes = await sqsClient.send(queueAttributesCommand);
        
        queueInfo = {
          messagesInQueue: queueAttributes.Attributes?.ApproximateNumberOfMessages || 0,
          messagesInProcess: queueAttributes.Attributes?.ApproximateNumberOfMessagesNotVisible || 0,
        };
      }
    } catch (sqsError) {
      console.error('Error checking SQS queue:', sqsError);
    }
    
    return NextResponse.json({ 
      podcastId, 
      timestamp, 
      status, 
      message,
      queueInfo,
      lastChecked: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error checking podcast status:', error);
    return NextResponse.json(
      { error: 'Failed to check podcast status', status: 'unknown' },
      { status: 500 }
    );
  }
} 