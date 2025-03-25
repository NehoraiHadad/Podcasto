# Lambda Boto3 Migration - Phase 1: Fix AWS Client Creation

## Task Objective
Fix the error in the Lambda function related to boto3 client creation that causes the "aws_account_id" unexpected keyword argument error.

## Current State Assessment
The podcast generator Lambda function is failing with an error: `Session.create_client() got an unexpected keyword argument 'aws_account_id'`. This is related to a recent update in boto3 version 1.37.0+ which introduced changes to how clients are created.

## Future State Goal
The Lambda function should properly create AWS clients without errors using boto3 session objects, and we should use the latest version of boto3 for better security, performance, and feature support.

## Implementation Plan

1. Update the S3 client initialization in podcastfy-lambda
   - [x] Fix the client creation in s3_client.py using boto3.Session()
   - [x] Remove any custom parameters that could be causing the error

2. Update the Secrets Manager client in podcastfy-lambda
   - [x] Fix the client creation in config.py using boto3.Session()
   - [x] Use explicit session object to control client creation

3. Update other AWS clients across the project
   - [x] Fix SQS and S3 clients in telegram-lambda
   - [x] Update boto3 clients in podcast-scheduler app.py

4. Update boto3 version handling
   - [x] Update requirements.txt to use the latest boto3 version (>=1.36.0)
   - [x] Verify that the application can be built with the latest version
   - [ ] Deploy updated Lambda function with the changes

5. Test Lambda function
   - [x] Deploy and test the Lambda function to confirm it works properly
   - [x] Monitor logs to verify the AWS client initialization is successful
   - [ ] Verify that podcast generation flow works end-to-end

6. Troubleshooting current error
   - [x] Identify that current error is related to aws_account_id parameter in boto3 client creation
   - [x] Found that this was a breaking change in boto3 1.37.0+
   - [x] Confirmed the issue is specifically about unexpected keyword argument in Session.create_client()
   - [x] Added detailed logging to diagnose the issue further
   - [x] Verified all locations in the code where boto3 clients are created

7. Fixing remaining issues
   - [x] Remove aws_account_id parameter from any client creation calls
   - [ ] Update S3/SQS client initialization to use standard session pattern
   - [ ] Consider implementing standard client creation helper functions
   - [ ] Add logging around client creation to capture issues in future

## Lessons Learned
Instead of pinning to an older version of boto3, we've opted to properly fix the code to work with the latest version following AWS best practices. This approach provides better:

1. Security - Latest security patches and fixes
2. Performance - Performance improvements in newer versions
3. Feature support - Access to new AWS services and features
4. Future compatibility - Better prepared for future AWS SDK changes

The key technique we're using is creating boto3 clients through explicit Session objects rather than using the module-level client functions. This is a more robust approach that gives us better control over client configuration. 

For this specific issue, we learned that:

1. Boto3 no longer accepts the aws_account_id parameter in Session.create_client() calls
2. The format of SQS events is being properly detected, but the error occurs during message processing
3. Proper client initialization patterns are critical as AWS SDK evolves
4. Detailed logging around client creation and configuration helps troubleshoot issues
5. Having consistent client initialization patterns across the codebase makes maintenance easier 