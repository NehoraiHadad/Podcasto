# FFmpeg Lambda Layer Setup for MP3 Conversion

## Overview

The audio generation Lambda now converts WAV files to MP3 format using `pydub`, which requires FFmpeg to be available in the Lambda environment. This document explains how to create and deploy the FFmpeg Lambda Layer.

## Option 1: Use Existing Public Lambda Layer (Recommended)

AWS community maintains public Lambda layers with FFmpeg pre-compiled for Amazon Linux 2:

### ARNs by Region

**US East (N. Virginia) - us-east-1:**
```
arn:aws:lambda:us-east-1:145266761615:layer:ffmpeg:4
```

**To use in template.yaml:**
```yaml
AudioGenerationFunction:
  Type: AWS::Serverless::Function
  Properties:
    Layers:
      - arn:aws:lambda:us-east-1:145266761615:layer:ffmpeg:4
      - !Sub 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:layer:podcasto-shared-layer-${Environment}:16'
```

**Other regions:** Search for "ffmpeg lambda layer" on [https://serverlessrepo.aws.amazon.com/](https://serverlessrepo.aws.amazon.com/)

## Option 2: Create Your Own FFmpeg Layer

If you need a custom FFmpeg build or the public layer is unavailable, follow these steps:

### Prerequisites
- AWS CLI configured
- Docker installed (for building on Amazon Linux 2)

### Step 1: Download Static FFmpeg Binary

```bash
# Create temporary directory
mkdir -p /tmp/ffmpeg-layer
cd /tmp/ffmpeg-layer

# Download static FFmpeg binary (compiled for Amazon Linux 2)
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz

# Extract
tar xf ffmpeg-release-amd64-static.tar.xz

# Create layer structure
mkdir -p ffmpeg-layer/bin
cp ffmpeg-*-amd64-static/ffmpeg ffmpeg-layer/bin/
cp ffmpeg-*-amd64-static/ffprobe ffmpeg-layer/bin/

# Verify binary
./ffmpeg-layer/bin/ffmpeg -version
```

### Step 2: Create ZIP Package

```bash
cd ffmpeg-layer
zip -r ../ffmpeg-layer.zip .
cd ..
```

### Step 3: Upload to AWS Lambda

```bash
aws lambda publish-layer-version \
  --layer-name ffmpeg-layer \
  --description "FFmpeg static binary for audio processing" \
  --zip-file fileb://ffmpeg-layer.zip \
  --compatible-runtimes python3.11 python3.12 \
  --compatible-architectures x86_64 \
  --region us-east-1
```

**Note the Layer ARN in the output:**
```
{
  "LayerArn": "arn:aws:lambda:us-east-1:638520701769:layer:ffmpeg-layer",
  "LayerVersionArn": "arn:aws:lambda:us-east-1:638520701769:layer:ffmpeg-layer:1",
  ...
}
```

### Step 4: Update template.yaml

Replace the placeholder with your custom layer ARN:

```yaml
AudioGenerationFunction:
  Type: AWS::Serverless::Function
  Properties:
    Layers:
      - arn:aws:lambda:us-east-1:638520701769:layer:ffmpeg-layer:1
      - !Sub 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:layer:podcasto-shared-layer-${Environment}:16'
```

## Verification

After deployment, test that FFmpeg is available:

1. **Trigger a test episode generation**
2. **Check CloudWatch logs** for:
   ```
   [AUDIO_CONVERTER] Converting to MP3 with bitrate 128k...
   [AUDIO_CONVERTER] MP3 conversion successful: size=5.23MB (87.2% reduction)
   ```
3. **Verify S3** contains `.mp3` file instead of `.wav`

## Troubleshooting

### Error: "ffmpeg: command not found"

**Cause:** FFmpeg layer not attached or incorrect PATH

**Solution:**
- Verify layer is attached in Lambda configuration
- Check layer ARN is correct in template.yaml
- Ensure layer contains `bin/ffmpeg` at the root

### Error: "MP3 conversion failed: [Errno 2] No such file or directory: 'ffmpeg'"

**Cause:** pydub cannot find FFmpeg binary

**Solution:**
Add this to Lambda handler initialization:
```python
import os
os.environ['PATH'] += ':/opt/bin'
```

### Error: "Permission denied when executing ffmpeg"

**Cause:** FFmpeg binary is not executable

**Solution:** Ensure binary has execute permissions before zipping:
```bash
chmod +x ffmpeg-layer/bin/ffmpeg
```

## Cost Impact

**Layer Storage:** ~50 MB (one-time)
**Lambda Memory Impact:** No significant increase (pydub uses minimal memory)
**Execution Time Impact:** +5-10 seconds per episode (MP3 encoding)

**Savings:**
- Storage: 80-90% reduction per episode
- Bandwidth: 80-90% reduction per listen
- CloudFront: 80-90% reduction in data transfer

## Rollback Plan

If MP3 conversion causes issues, you can temporarily disable it by setting an environment variable:

```bash
# In AWS Lambda Console or template.yaml
AUDIO_FORMAT=wav  # Forces WAV output, bypasses MP3 conversion
```

Then redeploy the Lambda without FFmpeg layer.
