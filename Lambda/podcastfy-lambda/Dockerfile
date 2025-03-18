FROM public.ecr.aws/lambda/python:3.12

WORKDIR /var/task

# Install ffmpeg
RUN mkdir -p /var/task/ffmpeg && \
    cd /var/task/ffmpeg && \
    curl -O https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz && \
    python -c "import tarfile; tarfile.open('ffmpeg-release-amd64-static.tar.xz').extractall()" && \
    mv ffmpeg-*-amd64-static/* . && \
    rm -rf ffmpeg-*-amd64-static && \
    rm ffmpeg-release-amd64-static.tar.xz

# Add ffmpeg to PATH and set permissions
ENV PATH="/var/task/ffmpeg:${PATH}"
RUN chmod -R +x /var/task/ffmpeg

# Create necessary directories for Lambda
RUN mkdir -p /tmp/podcastify-demo/tmp /tmp/podcastify-demo/transcripts /tmp/podcastify-demo/audio && \
    chmod -R 777 /tmp/podcastify-demo

# Copy application files
COPY requirements.txt ./
COPY src/ ./src/

# Install dependencies - use the requirements.txt file
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt -t .

# Command can be overwritten by providing a different command in the template directly
CMD ["src/lambda_handler.lambda_handler"] 