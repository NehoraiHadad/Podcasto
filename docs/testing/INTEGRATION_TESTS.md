# Integration Test Recommendations - Single-Speaker Feature

**Purpose**: Guidelines for implementing automated integration tests
**Version**: 1.0
**Date**: 2025-10-28
**Target Frameworks**: Vitest, React Testing Library, Playwright, Pytest

---

## Table of Contents

1. [Frontend Integration Tests](#frontend-integration-tests)
2. [Backend Integration Tests](#backend-integration-tests)
3. [Lambda Function Tests](#lambda-function-tests)
4. [End-to-End Tests](#end-to-end-tests)
5. [Test Data Setup](#test-data-setup)
6. [CI/CD Integration](#cicd-integration)

---

## Frontend Integration Tests

### Testing Framework Setup

**Recommended Stack**:
- **Unit/Integration**: Vitest + React Testing Library
- **E2E**: Playwright
- **Component Testing**: Vitest + jsdom

**Setup File** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/tests/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

### Test Suite 1: Format Selector Component

**File**: `src/components/admin/podcast-form/format-selector.test.tsx`

```typescript
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormatSelector } from './format-selector';

describe('FormatSelector', () => {
  test('renders both format options', () => {
    const onChange = vi.fn();
    render(<FormatSelector value="multi-speaker" onChange={onChange} />);

    expect(screen.getByText(/Single-Speaker/i)).toBeInTheDocument();
    expect(screen.getByText(/Multi-Speaker/i)).toBeInTheDocument();
  });

  test('calls onChange when format is selected', () => {
    const onChange = vi.fn();
    render(<FormatSelector value="multi-speaker" onChange={onChange} />);

    const singleSpeakerOption = screen.getByLabelText(/Single-Speaker/i);
    fireEvent.click(singleSpeakerOption);

    expect(onChange).toHaveBeenCalledWith('single-speaker');
  });

  test('shows correct format as selected', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <FormatSelector value="single-speaker" onChange={onChange} />
    );

    const singleOption = screen.getByRole('radio', { name: /single-speaker/i });
    expect(singleOption).toBeChecked();

    rerender(<FormatSelector value="multi-speaker" onChange={onChange} />);

    const multiOption = screen.getByRole('radio', { name: /multi-speaker/i });
    expect(multiOption).toBeChecked();
  });

  test('displays warning message about format immutability', () => {
    const onChange = vi.fn();
    render(<FormatSelector value="multi-speaker" onChange={onChange} />);

    expect(
      screen.getByText(/cannot be changed after creating episodes/i)
    ).toBeInTheDocument();
  });
});
```

---

### Test Suite 2: Style & Roles Fields

**File**: `src/components/admin/podcast-form/style-roles-fields.test.tsx`

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { StyleRolesFields } from './style-roles-fields';

// Test wrapper with form context
function TestWrapper({ children, defaultValues = {} }) {
  const methods = useForm({
    defaultValues: {
      podcastFormat: 'multi-speaker',
      speaker1Role: '',
      speaker2Role: '',
      conversationStyle: '',
      mixingTechniques: [],
      ...defaultValues,
    },
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('StyleRolesFields', () => {
  test('shows speaker2 field for multi-speaker format', () => {
    render(
      <TestWrapper defaultValues={{ podcastFormat: 'multi-speaker' }}>
        <StyleRolesFields />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/Speaker 1 Role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Speaker 2 Role/i)).toBeInTheDocument();
  });

  test('hides speaker2 field for single-speaker format', () => {
    render(
      <TestWrapper defaultValues={{ podcastFormat: 'single-speaker' }}>
        <StyleRolesFields />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/Speaker Role/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Speaker 2 Role/i)).not.toBeInTheDocument();
  });

  test('clears speaker2Role when switching to single-speaker', async () => {
    const { rerender } = render(
      <TestWrapper
        defaultValues={{
          podcastFormat: 'multi-speaker',
          speaker2Role: 'expert',
        }}
      >
        <StyleRolesFields />
      </TestWrapper>
    );

    // Initially has speaker2Role
    expect(screen.getByLabelText(/Speaker 2 Role/i)).toBeInTheDocument();

    // Change format to single-speaker
    rerender(
      <TestWrapper
        defaultValues={{
          podcastFormat: 'single-speaker',
          speaker2Role: 'expert', // Should be cleared
        }}
      >
        <StyleRolesFields />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByLabelText(/Speaker 2 Role/i)).not.toBeInTheDocument();
    });
  });

  test('shows all required form fields', () => {
    render(
      <TestWrapper>
        <StyleRolesFields />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/Conversation Style/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Speaker 1 Role/i)).toBeInTheDocument();
    expect(screen.getByText(/Mixing Techniques/i)).toBeInTheDocument();
  });
});
```

---

### Test Suite 3: Podcast Creation Form Integration

**File**: `src/components/admin/unified-podcast-creation-form/index.test.tsx`

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedPodcastCreationForm } from './index';

// Mock server actions
vi.mock('@/lib/actions/podcast-group-actions', () => ({
  createPodcastWithConfig: vi.fn(),
}));

describe('UnifiedPodcastCreationForm - Format Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('allows creating single-speaker podcast', async () => {
    const { createPodcastWithConfig } = await import(
      '@/lib/actions/podcast-group-actions'
    );

    createPodcastWithConfig.mockResolvedValue({
      success: true,
      data: { id: 'test-podcast-id' },
    });

    render(<UnifiedPodcastCreationForm />);

    // Fill base fields
    fireEvent.change(screen.getByLabelText(/Base Title/i), {
      target: { value: 'Test Podcast' },
    });

    // Navigate to Style & Roles tab
    fireEvent.click(screen.getByRole('tab', { name: /Style & Roles/i }));

    // Select single-speaker format
    fireEvent.click(screen.getByLabelText(/Single-Speaker/i));

    // Fill speaker role (not speaker2)
    const speaker1Select = screen.getByLabelText(/Speaker Role/i);
    fireEvent.change(speaker1Select, { target: { value: 'host' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Create Podcast/i }));

    await waitFor(() => {
      expect(createPodcastWithConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          languages: expect.arrayContaining([
            expect.objectContaining({
              podcastFormat: 'single-speaker',
              speaker1Role: 'host',
              speaker2Role: undefined,
            }),
          ]),
        })
      );
    });
  });

  test('validates speaker2 required for multi-speaker', async () => {
    render(<UnifiedPodcastCreationForm />);

    // Fill base fields
    fireEvent.change(screen.getByLabelText(/Base Title/i), {
      target: { value: 'Test Podcast' },
    });

    // Navigate to Style & Roles tab
    fireEvent.click(screen.getByRole('tab', { name: /Style & Roles/i }));

    // Select multi-speaker format
    fireEvent.click(screen.getByLabelText(/Multi-Speaker/i));

    // Fill only speaker1, leave speaker2 empty
    const speaker1Select = screen.getByLabelText(/Speaker 1 Role/i);
    fireEvent.change(speaker1Select, { target: { value: 'host' } });

    // Try to submit
    fireEvent.click(screen.getByRole('button', { name: /Create Podcast/i }));

    // Should show validation error
    await waitFor(() => {
      expect(
        screen.getByText(/Speaker 2 role is required/i)
      ).toBeInTheDocument();
    });
  });

  test('persists format selection when switching tabs', async () => {
    render(<UnifiedPodcastCreationForm />);

    // Navigate to Style & Roles tab
    fireEvent.click(screen.getByRole('tab', { name: /Style & Roles/i }));

    // Select single-speaker
    fireEvent.click(screen.getByLabelText(/Single-Speaker/i));

    // Switch to Basic Info tab
    fireEvent.click(screen.getByRole('tab', { name: /Basic Info/i }));

    // Switch back to Style & Roles
    fireEvent.click(screen.getByRole('tab', { name: /Style & Roles/i }));

    // Verify single-speaker is still selected
    const singleSpeakerRadio = screen.getByRole('radio', {
      name: /single-speaker/i,
    });
    expect(singleSpeakerRadio).toBeChecked();
  });
});
```

---

## Backend Integration Tests

### Testing Framework Setup

**Recommended Stack**:
- **Unit/Integration**: Vitest
- **Database**: In-memory SQLite or Supabase test instance
- **Mocking**: vi.mock for external services

**Setup File** (`src/tests/backend-setup.ts`):
```typescript
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@/lib/db';

beforeAll(async () => {
  // Setup test database connection
  // Or use transaction-based testing
});

afterAll(async () => {
  // Cleanup database connection
});

beforeEach(async () => {
  // Clear test data before each test
  // Or use transaction rollback
});
```

---

### Test Suite 4: Podcast Config Validation

**File**: `src/lib/actions/podcast-actions.test.ts`

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import { createPodcastWithConfig, updatePodcastConfig } from './podcast-actions';
import { db } from '@/lib/db';
import { podcastConfigs } from '@/lib/db/schema';

describe('Podcast Actions - Format Validation', () => {
  beforeEach(async () => {
    // Clear test data
    await db.delete(podcastConfigs);
  });

  test('creates single-speaker podcast successfully', async () => {
    const result = await createPodcastWithConfig({
      base_title: 'Test Podcast',
      base_description: 'Test Description',
      languages: [
        {
          language_code: 'en',
          is_primary: true,
          podcastFormat: 'single-speaker',
          speaker1Role: 'narrator',
          speaker2Role: undefined,
          contentSource: 'telegram',
          telegramChannel: 'test_channel',
          // ... other required fields
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();

    // Verify database state
    const config = await db.query.podcastConfigs.findFirst({
      where: (configs, { eq }) => eq(configs.id, result.data.config_id),
    });

    expect(config.podcast_format).toBe('single-speaker');
    expect(config.speaker1_role).toBe('narrator');
    expect(config.speaker2_role).toBeNull();
  });

  test('rejects multi-speaker without speaker2', async () => {
    const result = await createPodcastWithConfig({
      base_title: 'Test Podcast',
      base_description: 'Test Description',
      languages: [
        {
          language_code: 'en',
          is_primary: true,
          podcastFormat: 'multi-speaker',
          speaker1Role: 'host',
          speaker2Role: undefined, // Missing!
          contentSource: 'telegram',
          telegramChannel: 'test_channel',
          // ... other required fields
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Speaker 2 role is required');
  });

  test('updates format from multi to single successfully', async () => {
    // Create multi-speaker podcast first
    const createResult = await createPodcastWithConfig({
      base_title: 'Test Podcast',
      languages: [
        {
          language_code: 'en',
          is_primary: true,
          podcastFormat: 'multi-speaker',
          speaker1Role: 'host',
          speaker2Role: 'expert',
          // ... other fields
        },
      ],
    });

    expect(createResult.success).toBe(true);

    // Update to single-speaker
    const updateResult = await updatePodcastConfig(
      createResult.data.config_id,
      {
        podcastFormat: 'single-speaker',
        speaker2Role: undefined,
      }
    );

    expect(updateResult.success).toBe(true);

    // Verify database
    const config = await db.query.podcastConfigs.findFirst({
      where: (configs, { eq }) =>
        eq(configs.id, createResult.data.config_id),
    });

    expect(config.podcast_format).toBe('single-speaker');
    expect(config.speaker2_role).toBeNull();
  });

  test('validates format enum values', async () => {
    const result = await createPodcastWithConfig({
      base_title: 'Test Podcast',
      languages: [
        {
          language_code: 'en',
          is_primary: true,
          podcastFormat: 'triple-speaker' as any, // Invalid!
          speaker1Role: 'host',
          // ... other fields
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid enum value');
  });
});
```

---

### Test Suite 5: Episode Generation Trigger

**File**: `src/lib/actions/episode-actions.test.ts`

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { triggerEpisodeGeneration } from './episode-actions';
import * as lambdaClient from '@/lib/aws/lambda-client';

vi.mock('@/lib/aws/lambda-client');

describe('Episode Generation - Format Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('includes podcast_format in SQS message for single-speaker', async () => {
    const mockInvokeLambda = vi.spyOn(lambdaClient, 'invokeLambda');
    mockInvokeLambda.mockResolvedValue({ success: true });

    const podcastConfig = {
      id: 'config-123',
      podcast_id: 'podcast-123',
      podcast_format: 'single-speaker',
      speaker1_role: 'narrator',
      speaker2_role: null,
      telegram_channel: 'test_channel',
      language: 'en',
    };

    await triggerEpisodeGeneration({
      podcastId: 'podcast-123',
      podcastConfig,
    });

    expect(mockInvokeLambda).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        dynamic_config: expect.objectContaining({
          podcast_format: 'single-speaker',
          speaker1_role: 'narrator',
          speaker2_role: null,
        }),
      })
    );
  });

  test('defaults to multi-speaker if format missing', async () => {
    const mockInvokeLambda = vi.spyOn(lambdaClient, 'invokeLambda');
    mockInvokeLambda.mockResolvedValue({ success: true });

    const podcastConfig = {
      id: 'config-123',
      podcast_id: 'podcast-123',
      // podcast_format missing
      speaker1_role: 'host',
      speaker2_role: 'expert',
      telegram_channel: 'test_channel',
    };

    await triggerEpisodeGeneration({
      podcastId: 'podcast-123',
      podcastConfig,
    });

    expect(mockInvokeLambda).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        dynamic_config: expect.objectContaining({
          podcast_format: 'multi-speaker', // Default
        }),
      })
    );
  });
});
```

---

## Lambda Function Tests

### Testing Framework Setup (Python)

**Recommended Stack**:
- **Unit/Integration**: pytest
- **Mocking**: unittest.mock or pytest-mock
- **AWS Services**: moto for mocking AWS services

**Setup File** (`Lambda/tests/conftest.py`):
```python
import pytest
import os
from unittest.mock import Mock, patch

@pytest.fixture
def mock_s3():
    """Mock S3 client"""
    with patch('boto3.client') as mock_client:
        s3_mock = Mock()
        mock_client.return_value = s3_mock
        yield s3_mock

@pytest.fixture
def mock_gemini():
    """Mock Gemini API"""
    with patch('google.genai.Client') as mock_client:
        gemini_mock = Mock()
        mock_client.return_value = gemini_mock
        yield gemini_mock

@pytest.fixture
def single_speaker_config():
    """Sample single-speaker config"""
    return {
        'podcast_format': 'single-speaker',
        'speaker1_role': 'narrator',
        'speaker1_gender': 'male',
        'speaker2_role': None,
        'speaker2_gender': None,
        'language': 'en',
        'conversation_style': 'engaging',
    }

@pytest.fixture
def multi_speaker_config():
    """Sample multi-speaker config"""
    return {
        'podcast_format': 'multi-speaker',
        'speaker1_role': 'host',
        'speaker1_gender': 'male',
        'speaker2_role': 'expert',
        'speaker2_gender': 'female',
        'language': 'en',
        'conversation_style': 'conversational',
    }
```

---

### Test Suite 6: Script Generator Lambda

**File**: `Lambda/script-preprocessor-lambda/tests/test_script_generator.py`

```python
import pytest
from unittest.mock import Mock, patch
from src.services.gemini_script_generator import GeminiScriptGenerator

class TestSingleSpeakerScriptGeneration:
    """Test single-speaker script generation"""

    @pytest.fixture
    def script_generator(self, mock_gemini):
        """Create script generator instance"""
        return GeminiScriptGenerator()

    @pytest.fixture
    def clean_content(self):
        """Sample clean content"""
        return {
            'messages': [
                {
                    'text': 'Breaking news in tech today',
                    'channel': 'TechNews',
                    'timestamp': '2025-10-28T10:00:00Z',
                }
            ],
            'summary': {
                'date_range': '2025-10-28',
                'total_messages': 1,
            },
        }

    def test_generates_single_speaker_script(
        self, script_generator, clean_content, single_speaker_config, mock_gemini
    ):
        """Test that single-speaker format generates monologue"""
        # Mock Gemini response
        mock_gemini.models.generate_content.return_value = Mock(
            text="Hello everyone, welcome to today's episode. [pause] Let's dive into the tech news..."
        )

        script, metrics = script_generator.generate_script(
            clean_content,
            single_speaker_config,
            episode_id='test-episode-123',
            podcast_format='single-speaker',
        )

        # Verify script is monologue format
        assert 'Speaker1:' not in script
        assert 'Speaker2:' not in script
        assert '[pause]' in script  # TTS markup present

        # Verify correct prompt template used
        call_args = mock_gemini.models.generate_content.call_args
        prompt = call_args[0][0]
        assert 'monologue' in prompt.lower()
        assert 'single voice' in prompt.lower()

    def test_generates_multi_speaker_script(
        self, script_generator, clean_content, multi_speaker_config, mock_gemini
    ):
        """Test that multi-speaker format generates dialogue"""
        mock_gemini.models.generate_content.return_value = Mock(
            text="Speaker1: Welcome to the show!\nSpeaker2: Thanks for having me!"
        )

        script, metrics = script_generator.generate_script(
            clean_content,
            multi_speaker_config,
            episode_id='test-episode-123',
            podcast_format='multi-speaker',
        )

        # Verify script is dialogue format
        assert 'Speaker1:' in script
        assert 'Speaker2:' in script

        # Verify correct prompt template used
        call_args = mock_gemini.models.generate_content.call_args
        prompt = call_args[0][0]
        assert 'dialogue' in prompt.lower() or 'conversation' in prompt.lower()

    def test_defaults_to_multi_speaker_when_format_missing(
        self, script_generator, clean_content, mock_gemini
    ):
        """Test fallback to multi-speaker if format not provided"""
        mock_gemini.models.generate_content.return_value = Mock(
            text="Speaker1: Test\nSpeaker2: Test"
        )

        config_without_format = {
            'speaker1_role': 'host',
            'speaker2_role': 'expert',
            'language': 'en',
        }

        script, metrics = script_generator.generate_script(
            clean_content,
            config_without_format,
            episode_id='test-episode-123',
            # podcast_format not provided
        )

        # Should default to multi-speaker
        call_args = mock_gemini.models.generate_content.call_args
        prompt = call_args[0][0]
        assert 'dialogue' in prompt.lower() or 'Speaker1' in script

    def test_logs_podcast_format(
        self, script_generator, clean_content, single_speaker_config, mock_gemini, caplog
    ):
        """Test that podcast format is logged"""
        mock_gemini.models.generate_content.return_value = Mock(
            text="Test script content"
        )

        with caplog.at_level('INFO'):
            script_generator.generate_script(
                clean_content,
                single_speaker_config,
                episode_id='test-episode-123',
                podcast_format='single-speaker',
            )

        # Verify logging
        assert any('single-speaker' in record.message.lower() for record in caplog.records)
        assert any('Format: single-speaker' in record.message for record in caplog.records)
```

---

### Test Suite 7: Audio Generator Lambda

**File**: `Lambda/audio-generation-lambda/tests/test_audio_generator.py`

```python
import pytest
from unittest.mock import Mock, patch, MagicMock
from src.handlers.audio_generation_handler import AudioGenerationHandler

class TestSingleSpeakerAudioGeneration:
    """Test single-speaker audio generation"""

    @pytest.fixture
    def audio_handler(self, mock_s3, mock_gemini):
        """Create audio handler instance"""
        return AudioGenerationHandler()

    @pytest.fixture
    def single_speaker_script(self):
        """Sample single-speaker script"""
        return """
        Hello everyone, welcome to today's episode. [pause]
        Today we're discussing the latest in technology. [excited]
        Let's get started! [emphasis on "started"]
        """

    @pytest.fixture
    def multi_speaker_script(self):
        """Sample multi-speaker script"""
        return """
        Speaker1: Welcome to the show!
        Speaker2: Thanks for having me!
        Speaker1: Let's discuss today's topics.
        """

    def test_uses_single_voice_for_single_speaker(
        self, audio_handler, single_speaker_script, single_speaker_config, mock_gemini
    ):
        """Test that only one voice is used for single-speaker"""
        # Mock voice selection
        with patch.object(audio_handler, '_select_voices') as mock_select:
            mock_select.return_value = ['voice-male-1']  # Single voice

            # Mock audio generation
            mock_gemini.models.generate_content.return_value = Mock(
                audio=b'fake_audio_data'
            )

            result = audio_handler.generate_audio(
                single_speaker_script,
                single_speaker_config,
                episode_id='test-episode-123',
            )

            # Verify single voice selected
            mock_select.assert_called_once()
            voices = mock_select.return_value
            assert len(voices) == 1
            assert result['voice_count'] == 1

    def test_uses_two_voices_for_multi_speaker(
        self, audio_handler, multi_speaker_script, multi_speaker_config, mock_gemini
    ):
        """Test that two voices are used for multi-speaker"""
        with patch.object(audio_handler, '_select_voices') as mock_select:
            mock_select.return_value = ['voice-male-1', 'voice-female-1']

            mock_gemini.models.generate_content.return_value = Mock(
                audio=b'fake_audio_data'
            )

            result = audio_handler.generate_audio(
                multi_speaker_script,
                multi_speaker_config,
                episode_id='test-episode-123',
            )

            # Verify two voices selected
            voices = mock_select.return_value
            assert len(voices) == 2
            assert result['voice_count'] == 2

    def test_voice_selection_based_on_gender(
        self, audio_handler, single_speaker_config
    ):
        """Test voice selection respects gender configuration"""
        voices = audio_handler._select_voices(
            single_speaker_config, episode_id='test-123'
        )

        assert len(voices) == 1
        # Verify voice is male (based on config)
        # This depends on your voice selection logic
        assert 'male' in voices[0].lower() or voices[0].startswith('M')

    def test_logs_format_and_voice_info(
        self, audio_handler, single_speaker_script, single_speaker_config, caplog
    ):
        """Test that format and voice info is logged"""
        with caplog.at_level('INFO'):
            with patch.object(audio_handler, '_select_voices') as mock_select:
                mock_select.return_value = ['voice-male-1']

                audio_handler.generate_audio(
                    single_speaker_script,
                    single_speaker_config,
                    episode_id='test-episode-123',
                )

        # Verify logging
        assert any('single-speaker' in record.message.lower() for record in caplog.records)
        assert any('voice' in record.message.lower() for record in caplog.records)

    def test_handles_missing_format_gracefully(
        self, audio_handler, multi_speaker_script, mock_gemini
    ):
        """Test graceful fallback when format is missing"""
        config_without_format = {
            'speaker1_role': 'host',
            'speaker2_role': 'expert',
            'speaker1_gender': 'male',
            'speaker2_gender': 'female',
            # podcast_format missing
        }

        with patch.object(audio_handler, '_select_voices') as mock_select:
            mock_select.return_value = ['voice-male-1', 'voice-female-1']

            mock_gemini.models.generate_content.return_value = Mock(
                audio=b'fake_audio_data'
            )

            # Should not raise exception
            result = audio_handler.generate_audio(
                multi_speaker_script,
                config_without_format,
                episode_id='test-episode-123',
            )

            # Should default to multi-speaker (two voices)
            assert result is not None
```

---

## End-to-End Tests

### Test Suite 8: Full Pipeline E2E (Playwright)

**File**: `e2e/podcast-creation-single-speaker.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Single-Speaker Podcast Creation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'test-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('creates and generates single-speaker episode', async ({ page }) => {
    // Navigate to create podcast
    await page.goto('/admin/podcasts/create');

    // Fill base information
    await page.fill('[name="base_title"]', 'E2E Test Single Speaker');
    await page.fill('[name="base_description"]', 'Test Description');

    // Add language variant
    await page.click('button:has-text("Add Language")');
    await page.selectOption('[name="language"]', 'en');

    // Fill content source
    await page.fill('[name="telegramChannel"]', process.env.TEST_TELEGRAM_CHANNEL);
    await page.fill('[name="telegramHours"]', '24');

    // Navigate to Style & Roles tab
    await page.click('button:has-text("Style & Roles")');

    // Select single-speaker format
    await page.click('label:has-text("Single-Speaker")');

    // Verify speaker 2 field is hidden
    await expect(page.locator('label:has-text("Speaker 2 Role")')).not.toBeVisible();

    // Fill speaker 1 role
    await page.selectOption('[name="speaker1Role"]', 'host');

    // Fill other required fields
    await page.selectOption('[name="conversationStyle"]', 'engaging');
    await page.click('input[name="mixingTechniques"][value="casual_banter"]');

    // Submit form
    await page.click('button:has-text("Create Podcast")');

    // Wait for success message
    await expect(page.locator('text=Podcast created successfully')).toBeVisible({
      timeout: 10000,
    });

    // Navigate to podcast detail page
    await page.waitForURL(/\/admin\/podcasts\/[a-f0-9-]+/);

    // Verify format is displayed correctly
    await expect(page.locator('text=Single-Speaker')).toBeVisible();

    // Trigger episode generation
    await page.click('button:has-text("Generate Episode")');

    // Wait for episode to start processing
    await expect(page.locator('text=processing')).toBeVisible({
      timeout: 30000,
    });

    // Wait for episode completion (this may take several minutes)
    await expect(page.locator('text=completed')).toBeVisible({
      timeout: 600000, // 10 minutes
    });

    // Verify audio player is available
    await expect(page.locator('audio')).toBeVisible();

    // Play audio and verify it loads
    const audioElement = await page.locator('audio').first();
    await audioElement.evaluate((audio: HTMLAudioElement) => audio.play());

    // Wait for audio to start playing
    await page.waitForTimeout(3000);

    // Verify audio is playing
    const isPlaying = await audioElement.evaluate(
      (audio: HTMLAudioElement) => !audio.paused
    );
    expect(isPlaying).toBe(true);
  });

  test('validates multi-speaker requires speaker 2', async ({ page }) => {
    await page.goto('/admin/podcasts/create');

    // Fill base information
    await page.fill('[name="base_title"]', 'E2E Test Multi Speaker Validation');

    // Add language variant
    await page.click('button:has-text("Add Language")');

    // Navigate to Style & Roles tab
    await page.click('button:has-text("Style & Roles")');

    // Select multi-speaker format
    await page.click('label:has-text("Multi-Speaker")');

    // Fill only speaker 1
    await page.selectOption('[name="speaker1Role"]', 'host');

    // Try to submit without speaker 2
    await page.click('button:has-text("Create Podcast")');

    // Verify error message appears
    await expect(
      page.locator('text=Speaker 2 role is required for multi-speaker podcasts')
    ).toBeVisible();
  });
});
```

---

## Test Data Setup

### Database Seed Script

**File**: `scripts/seed-test-data.ts`

```typescript
import { db } from '@/lib/db';
import { podcasts, podcastConfigs, users } from '@/lib/db/schema';

export async function seedTestData() {
  // Create test user
  const testUser = await db
    .insert(users)
    .values({
      id: 'test-user-id',
      email: 'test@podcasto.com',
      full_name: 'Test User',
    })
    .returning();

  // Create single-speaker test podcast
  const singleSpeakerPodcast = await db
    .insert(podcasts)
    .values({
      title: 'Test Single-Speaker Podcast',
      description: 'For testing single-speaker functionality',
      user_id: testUser[0].id,
    })
    .returning();

  await db.insert(podcastConfigs).values({
    podcast_id: singleSpeakerPodcast[0].id,
    podcast_format: 'single-speaker',
    content_source: 'telegram',
    telegram_channel: 'test_channel',
    telegram_hours: 24,
    creator: 'Test',
    podcast_name: 'Test Single-Speaker',
    language: 'english',
    creativity_level: 0.5,
    conversation_style: 'engaging',
    speaker1_role: 'narrator',
    speaker2_role: null,
    mixing_techniques: ['casual_banter'],
  });

  // Create multi-speaker test podcast
  const multiSpeakerPodcast = await db
    .insert(podcasts)
    .values({
      title: 'Test Multi-Speaker Podcast',
      description: 'For testing multi-speaker functionality',
      user_id: testUser[0].id,
    })
    .returning();

  await db.insert(podcastConfigs).values({
    podcast_id: multiSpeakerPodcast[0].id,
    podcast_format: 'multi-speaker',
    content_source: 'telegram',
    telegram_channel: 'test_channel',
    telegram_hours: 24,
    creator: 'Test',
    podcast_name: 'Test Multi-Speaker',
    language: 'english',
    creativity_level: 0.5,
    conversation_style: 'conversational',
    speaker1_role: 'host',
    speaker2_role: 'expert',
    mixing_techniques: ['casual_banter'],
  });

  console.log('Test data seeded successfully');
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test-single-speaker.yml`

```yaml
name: Single-Speaker Feature Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run frontend unit tests
        run: npm run test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run backend tests
        run: npm run test:backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  lambda-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd Lambda/script-preprocessor-lambda
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-mock

      - name: Run script generator tests
        run: |
          cd Lambda/script-preprocessor-lambda
          pytest tests/ --cov=src --cov-report=xml

      - name: Run audio generator tests
        run: |
          cd Lambda/audio-generation-lambda
          pytest tests/ --cov=src --cov-report=xml

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_TELEGRAM_CHANNEL: ${{ secrets.TEST_TELEGRAM_CHANNEL }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Coverage Goals

### Target Coverage Metrics

**Frontend**:
- **Line Coverage**: ≥ 80%
- **Branch Coverage**: ≥ 75%
- **Function Coverage**: ≥ 80%

**Backend**:
- **Line Coverage**: ≥ 85%
- **Branch Coverage**: ≥ 80%
- **Function Coverage**: ≥ 85%

**Lambda Functions**:
- **Line Coverage**: ≥ 80%
- **Branch Coverage**: ≥ 75%
- **Function Coverage**: ≥ 80%

### Critical Paths (Must be 100%)

- Format validation logic
- Speaker role validation
- Format-specific script generation
- Voice selection based on format
- SQS message structure with format field

---

## Running Tests Locally

### Frontend Tests
```bash
cd podcasto
npm run test                    # Run all tests
npm run test -- --watch         # Watch mode
npm run test -- --coverage      # With coverage
```

### Backend Tests
```bash
cd podcasto
npm run test:backend
```

### Lambda Tests
```bash
# Script Generator
cd Lambda/script-preprocessor-lambda
pytest tests/ -v

# Audio Generator
cd Lambda/audio-generation-lambda
pytest tests/ -v
```

### E2E Tests
```bash
cd podcasto
npx playwright test
npx playwright test --debug     # Debug mode
npx playwright test --ui        # UI mode
```

---

## Recommended Test Execution Order

1. **Unit Tests** (fastest)
   - Frontend component tests
   - Backend action tests
   - Lambda function unit tests

2. **Integration Tests**
   - Database integration
   - API integration
   - AWS service integration (with mocks)

3. **E2E Tests** (slowest)
   - Full user flows
   - End-to-end episode generation

---

**End of Integration Test Recommendations**
