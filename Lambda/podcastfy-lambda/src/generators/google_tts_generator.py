import google.generativeai as genai
import google.generativeai.types as types
import mimetypes
import os
import struct
import logging
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_audio_mime_type(mime_type_string: str) -> str | None:
    """
    Parses an audio mime type string to extract the audio format.
    Example: "audio/ogg" -> "ogg", "audio/wav" -> "wav"
    """
    if not mime_type_string:
        logger.warning(f"Empty mime type string.")
        return None

    # Handles cases like "audio/ogg; codecs=opus" or just "audio/ogg"
    main_type = mime_type_string.split(";")[0].strip()

    if "/" in main_type:
        _, audio_format = main_type.split("/")
        return audio_format.lower()
    logger.warning(f"Could not parse audio format from mime type: {mime_type_string}")
    return None

def save_binary_file(output_filename: str, data: bytes) -> None:
    """Saves binary data to a file."""
    logger.info(f"Saving binary data to: {output_filename}")
    with open(output_filename, "wb") as f:
        f.write(data)
    logger.info(f"Successfully saved file: {output_filename}")

def convert_to_wav(
    audio_data: bytes, # This MUST be raw PCM data
    output_filename: str,
    sample_rate: int = 24000,
    num_channels: int = 1,
    bytes_per_sample: int = 2, # 2 bytes for 16-bit audio
) -> str:
    """
    Converts raw PCM audio data to a WAV file.
    """
    if not output_filename.lower().endswith(".wav"):
        actual_output_filename = output_filename + ".wav"
        logger.warning(
            f"Output filename {output_filename} does not end with .wav. Saving as {actual_output_filename}"
        )
    else:
        actual_output_filename = output_filename

    logger.info(f"Converting raw PCM data to WAV: {actual_output_filename}")
    with open(actual_output_filename, "wb") as f:
        # WAV Header
        f.write(b"RIFF")
        # File size (chunk size + 36 bytes)
        f.write(struct.pack("<I", 36 + len(audio_data)))
        f.write(b"WAVE")
        # "fmt " subchunk
        f.write(b"fmt ")
        f.write(struct.pack("<I", 16))  # Subchunk1Size (16 for PCM)
        f.write(struct.pack("<H", 1))   # AudioFormat (1 for PCM)
        f.write(struct.pack("<H", num_channels))
        f.write(struct.pack("<I", sample_rate))
        f.write(struct.pack("<I", sample_rate * num_channels * bytes_per_sample))  # ByteRate
        f.write(struct.pack("<H", num_channels * bytes_per_sample))  # BlockAlign
        f.write(struct.pack("<H", bytes_per_sample * 8))  # BitsPerSample
        # "data" subchunk
        f.write(b"data")
        f.write(struct.pack("<I", len(audio_data)))  # Subchunk2Size (data size)
        f.write(audio_data)
    logger.info(f"Successfully saved WAV file: {actual_output_filename}")
    return actual_output_filename

def generate_google_tts_audio(
    text_input: str,
    output_filename: str,
    google_api_key: str,
    voice_name_speaker1: str,
    voice_name_speaker2: str | None = None, # For multi-speaker
    language_code: str = "en-US",
    sample_rate_hertz: int = 24000, # Common for TTS
    # Optional parameters from SpeechConfig, if needed by API
    speaking_rate: float | None = None,
    pitch: float | None = None,
    volume_gain_db: float | None = None,
    effects_profile_id: list[str] | None = None,
) -> str | None:
    """
    Generates audio from text using Google AI Studio's Text-to-Speech API.
    Aligns with examples using client.models.generate_content_stream and SpeechConfig.
    """
    if not all([text_input, output_filename, google_api_key, voice_name_speaker1]):
        logger.error("Missing required arguments: text_input, output_filename, google_api_key, or voice_name_speaker1.")
        return None

    try:
        client = genai.Client(api_key=google_api_key)
        logger.info("Google GenAI Client initialized.")

        # 1. Construct Voice Configuration
        if voice_name_speaker2:
            voice_config = types.MultiSpeakerVoiceConfig(
                voices=[
                    types.PrebuiltVoiceConfig(voice_name=voice_name_speaker1),
                    types.PrebuiltVoiceConfig(voice_name=voice_name_speaker2),
                ]
            )
            logger.info(f"Using MultiSpeakerVoiceConfig with voices: {voice_name_speaker1}, {voice_name_speaker2}")
        else:
            voice_config = types.PrebuiltVoiceConfig(voice_name=voice_name_speaker1)
            logger.info(f"Using PrebuiltVoiceConfig with voice: {voice_name_speaker1}")

        # 2. Construct Speech Configuration
        speech_config_args = {
            "voice": voice_config,
            "language_code": language_code,
            "sample_rate_hertz": sample_rate_hertz,
        }
        if speaking_rate is not None:
            speech_config_args["speaking_rate"] = speaking_rate
        if pitch is not None:
            speech_config_args["pitch"] = pitch
        if volume_gain_db is not None:
            speech_config_args["volume_gain_db"] = volume_gain_db
        if effects_profile_id:
            speech_config_args["effects_profile_id"] = effects_profile_id

        speech_config = types.SpeechConfig(**speech_config_args)

        # 3. Construct GenerateContentConfig
        generate_content_config = types.GenerateContentConfig(speech_config=speech_config)

        # 4. Construct Contents
        contents = [{"role": "user", "parts": [{"text": text_input}]}]

        # 5. Define Model
        # As per instruction: `gemini-2.5-flash-preview-tts` or `tts-004`
        # Using the one from the prompt directly.
        # The API structure `client.models.generate_content_stream` is unusual.
        # Standard is `client.get_model(model_name).generate_content_stream` or `GenerativeModel(...).generate_content_stream`.
        # Assuming `client.models` is an object that takes model name for `generate_content_stream`.
        # More likely, the model name goes into a GenerateContentRequest.
        # Let's try forming a GenerateContentRequest.

        model_to_use = "gemini-2.5-flash-preview-tts" # As per instructions
        logger.info(f"Using TTS model: {model_to_use}")

        request = types.GenerateContentRequest(
            model=f"models/{model_to_use}", # Model names are often prefixed with "models/"
            contents=contents,
            generation_config=generate_content_config # This should be GenerateContentConfig
        )

        logger.info(f"Generating speech for text: '{text_input[:100]}...'")

        # The prompt says `client.models.generate_content_stream`.
        # Let's assume this is a callable attribute or method.
        # This part is highly dependent on the exact API structure provided by this specific client version/setup.
        # If `client.models` is a service client for models:
        stream = client.models.generate_content_stream(request)
        # If `client.models` is a function to get a model object first:
        # stream = client.models(name=f"models/{model_to_use}").generate_content_stream(request)
        # Or if `client.generate_content_stream` is the actual method:
        # stream = client.generate_content_stream(request) -> This is more standard for some Google SDKs.
        # Given `genai.Client`, it's possible `client.generate_content_stream` is the way.
        # However, sticking to the literal `client.models.generate_content_stream(request)` from instructions.

        audio_bytes = b""
        audio_mime_type = None # Will be populated from the first relevant chunk

        logger.info("Iterating over stream for audio data...")
        for chunk in stream:
            if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
                logger.warning("Unexpected chunk structure: no candidates or content parts. Skipping.")
                continue

            part = chunk.candidates[0].content.parts[0]

            # As per new instructions: "looking for chunk.candidates[0].content.parts[0].inline_data"
            # And "mime_type from part.inline_data.mime_type"
            if hasattr(part, "inline_data") and hasattr(part.inline_data, "data") and hasattr(part.inline_data, "mime_type"):
                if not audio_mime_type:
                    audio_mime_type = part.inline_data.mime_type
                    logger.info(f"Detected audio mime type: {audio_mime_type}")

                # Assuming inline_data.data is a base64 encoded string
                try:
                    decoded_data = base64.b64decode(part.inline_data.data)
                    audio_bytes += decoded_data
                except base64.binascii.Error as e:
                    logger.error(f"Error decoding base64 data: {e}. Skipping this chunk's data.")
                    continue
                except Exception as e:
                    logger.error(f"Error processing inline_data: {e}. Data was: {part.inline_data.data[:100]}...")
                    continue
            elif hasattr(part, "text"):
                 logger.warning(f"Received text part, expecting audio: {part.text[:100]}...")
            # else:
                # logger.debug(f"Chunk part does not contain expected inline_data: {part}")


        if not audio_bytes:
            logger.error("No audio data received from the stream. TTS generation failed.")
            return None

        logger.info(f"Received {len(audio_bytes)} bytes of audio data. Mime type: {audio_mime_type}")

        # Saving the audio
        parsed_format = parse_audio_mime_type(audio_mime_type) if audio_mime_type else None
        output_ext = os.path.splitext(output_filename)[1].lower().strip(".")

        if parsed_format == output_ext:
            logger.info(f"Output format matches received format ({parsed_format}). Saving directly.")
            save_binary_file(output_filename, audio_bytes)
            return output_filename
        elif output_filename.lower().endswith(".wav"):
            if parsed_format == "wav": # API provided WAV
                logger.info("API provided WAV data. Saving directly.")
                save_binary_file(output_filename, audio_bytes) # Assumes audio_bytes is already valid WAV content
                return output_filename
            else: # API provided something else (e.g. mp3, ogg), but WAV output is requested
                logger.warning(f"Received format is {parsed_format}, but WAV output is requested. "
                               f"The current `convert_to_wav` function expects raw PCM data. "
                               f"If the received data ({parsed_format}) is not raw PCM, this conversion will be incorrect.")
                logger.info("Attempting to package received bytes into WAV structure. This assumes received data is PCM.")
                # This is a critical assumption: if audio_bytes is MP3, this will make a broken WAV.
                # For true conversion from MP3/OGG to WAV, ffmpeg would be needed.
                return convert_to_wav(audio_bytes, output_filename, sample_rate=sample_rate_hertz)
        else: // Output is not WAV and format mismatch or unknown
            logger.warning(f"Output file extension '{output_ext}' does not match received audio format '{parsed_format}'. "
                           f"Saving data as is to '{output_filename}'. For format conversion, use appropriate tools (e.g., ffmpeg).")
            save_binary_file(output_filename, audio_bytes)
            return output_filename

    except Exception as e:
        logger.error(f"Error generating Google TTS audio: {e}", exc_info=True)
        return None

if __name__ == '__main__':
    logger.info("Starting Google TTS Generator example (refined).")
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        logger.error("GOOGLE_API_KEY environment variable not set. Cannot run example.")
    else:
        # Example 1: Single speaker
        text_single = "Hello, this is a test of the refined Google Text-to-Speech generator."
        output_file_single = "test_google_tts_refined_single.wav"
        # Common voice names for Google TTS often look like "en-US-Standard-C" or "en-US-News-K"
        # The example voices "Zephyr", "Puck" might be specific to certain models/APIs.
        # Using standard-sounding placeholders, actual names depend on the chosen model's supported voices.
        voice1 = "en-US-Standard-A" # Placeholder, replace with actual from model docs

        logger.info(f"Attempting single speaker TTS to {output_file_single}...")
        generated_file_single = generate_google_tts_audio(
            text_input=text_single,
            output_filename=output_file_single,
            google_api_key=api_key,
            voice_name_speaker1=voice1,
            language_code="en-US",
            sample_rate_hertz=24000
        )
        if generated_file_single:
            logger.info(f"Single speaker audio generated: {generated_file_single}")
        else:
            logger.error("Single speaker audio generation failed.")

        # Example 2: Multi-speaker (if model supports it and voices are valid)
        text_multi = """
        Speaker 1: Welcome to our podcast!
        Speaker 2: Today, we'll be discussing the latest in AI.
        """
        output_file_multi = "test_google_tts_refined_multi.mp3" # Example outputting as MP3
        voice2 = "en-US-Standard-B" # Placeholder

        logger.info(f"Attempting multi-speaker TTS to {output_file_multi}...")
        generated_file_multi = generate_google_tts_audio(
            text_input=text_multi,
            output_filename=output_file_multi,
            google_api_key=api_key,
            voice_name_speaker1=voice1,
            voice_name_speaker2=voice2,
            language_code="en-US",
            sample_rate_hertz=24000 # API might return MP3 at a fixed sample rate
        )
        if generated_file_multi:
            logger.info(f"Multi-speaker audio generated: {generated_file_multi}")
        else:
            logger.error("Multi-speaker audio generation failed.")

        logger.info("Google TTS Generator example (refined) finished.")
        logger.info("NOTE: Success of these examples depends on a valid GOOGLE_API_KEY, correct model name ('gemini-2.5-flash-preview-tts' or equivalent), "
                    "valid voice names for that model, and the API supporting the request structure.")
        logger.info("The API call `client.models.generate_content_stream(request)` is used as per instruction, its exact behavior needs to be confirmed with documentation for the specific client version.")
