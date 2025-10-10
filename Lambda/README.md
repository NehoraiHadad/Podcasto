# Podcasto Lambda Functions

Multi-Lambda architecture for AI-powered podcast generation with shared code layer.

## Quick Start

```bash
# 1. Deploy shared layer first
cd Lambda/shared-layer
sam build && sam deploy --parameter-overrides Environment=dev

# 2. Deploy script preprocessor
cd ../script-preprocessor-lambda
sam build && sam deploy --parameter-overrides Environment=dev

# 3. Deploy audio generation
cd ../audio-generation-lambda
sam build && sam deploy --parameter-overrides Environment=dev
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Shared Lambda Layer                   │
│  • Supabase, S3, Telegram clients              │
│  • Voice config & TTS services                  │
│  • Audio processing utilities                   │
└─────────────────────────────────────────────────┘
            ↑                    ↑
            │                    │
┌───────────┴────────┐  ┌───────┴─────────────┐
│ Script Preprocessor │  │ Audio Generation    │
│ • Content analysis  │  │ • TTS generation    │
│ • Script generation │  │ • Audio processing  │
│ • Voice selection   │  │ • S3 upload         │
└─────────────────────┘  └─────────────────────┘
```

## Key Features

### Shared Layer Benefits
- ✅ **~55% code reduction** - 11 duplicate files eliminated
- ✅ **Single source of truth** for common services
- ✅ **Consistent voice selection** across lambdas
- ✅ **Unified S3 client** with multiple URL formats
- ✅ **Easy maintenance** - update once, deploy everywhere

### Script Preprocessor
- Analyzes Telegram content
- Generates podcast scripts with Gemini
- **Selects voices once** (Speaker1 fixed, Speaker2 per episode)
- Passes configuration to audio generation via SQS

### Audio Generation
- Receives pre-selected voices from preprocessor
- Generates multi-speaker audio with Google TTS
- Parallel chunk processing for long scripts
- Silence detection and validation
- Hebrew niqqud support via Dicta API

## Deployment Order

**ALWAYS deploy in this order:**
1. Shared Layer → 2. Script Preprocessor → 3. Audio Generation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## File Organization

```
Lambda/
├── shared-layer/              # Common code (Layer version 1)
│   ├── python/shared/
│   │   ├── clients/          # supabase, s3, telegram
│   │   ├── services/         # voice_config, tts, audio_chunk_manager, etc.
│   │   └── utils/            # logging, rate_limiter, wav_utils
│   └── template.yaml
│
├── script-preprocessor-lambda/
│   ├── src/
│   │   ├── handlers/         # script_preprocessor_handler.py
│   │   └── services/         # content_analyzer, script_generator (unique)
│   └── template.yaml         # References shared-layer:1
│
└── audio-generation-lambda/
    ├── src/
    │   └── handlers/         # audio_generation_handler.py
    └── template.yaml         # References shared-layer:1
```

## Voice Selection Flow

```
┌─────────────────────────┐
│ Script Preprocessor     │
│ Selects voices ONCE:    │
│ • Speaker1: fixed       │
│ • Speaker2: random/hash │
└───────┬─────────────────┘
        │ dynamic_config
        ↓
┌─────────────────────────┐
│ Audio Generation        │
│ Uses pre-selected voices│
│ Ensures consistency     │
└─────────────────────────┘
```

## Environment Variables

Set in AWS Secrets Manager (`podcasto-secrets-{env}`):

```json
{
  "SUPABASE_URL": "https://xxx.supabase.co",
  "SUPABASE_SERVICE_KEY": "eyJ...",
  "GEMINI_API_KEY": "AIza..."
}
```

## Monitoring

```bash
# Watch logs
aws logs tail /aws/lambda/podcasto-script-preprocessor-dev --follow
aws logs tail /aws/lambda/podcasto-audio-generation-dev --follow

# Check layer attachment
aws lambda get-function-configuration \
  --function-name podcasto-audio-generation-dev \
  --query 'Layers[*].Arn'
```

## Development

### Making Changes to Shared Code

1. Edit files in `shared-layer/python/shared/`
2. Deploy layer: `cd shared-layer && sam build && sam deploy`
3. Note new version number
4. Update version in both Lambda `template.yaml` files:
   ```yaml
   Layers:
     - !Sub '...layer:podcasto-shared-layer-${Environment}:NEW_VERSION'
   ```
5. Redeploy both Lambdas

### Adding Lambda-Specific Code

- **Script Preprocessor**: Add to `script-preprocessor-lambda/src/services/`
- **Audio Generation**: Keep minimal - most logic in shared layer

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `No module named 'shared'` | Verify layer deployed and version matches template.yaml |
| Old code running | Update function config to force new execution context |
| Import errors | Check `shared-layer/python/requirements.txt` has all deps |

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment instructions
- [../CLAUDE.md](../CLAUDE.md) - Project overview and conventions

## Recent Refactoring (2025-10-10)

Completed major refactoring to eliminate code duplication:
- Created shared Lambda layer with 11 common files
- Removed duplicate code from both Lambda functions
- Centralized voice selection in script-preprocessor
- Updated all import paths to use `shared.*` namespace
- Simplified audio-generation requirements.txt (all from layer)

**Result**: Cleaner codebase, easier maintenance, consistent voice selection.
