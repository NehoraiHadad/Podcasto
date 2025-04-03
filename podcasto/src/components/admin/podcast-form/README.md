# Podcast Form Components

This directory contains components for creating and editing podcasts in the admin interface.

## Component Structure

### Main Components
- **podcast-form-base.tsx**: The main form container that manages form state and renders all sub-components.
- **podcast-form-tabs.tsx**: Manages the tabbed interface for organizing different form sections.

### Form Field Groups
- **basic-info-fields.tsx**: Form fields for basic podcast information (title, description, cover image).
- **content-source-fields.tsx**: Form fields for configuring content sources (Telegram, URLs).
- **basic-settings-fields.tsx**: Form fields for basic podcast settings.
- **advanced-settings-fields.tsx**: Form fields for advanced podcast generation settings.
- **style-roles-fields.tsx**: Form fields for podcast style, roles, and tone configuration.

### Utility Components
- **form-action-buttons.tsx**: Action buttons for submitting and canceling forms.
- **form-handlers.ts**: Logic for form submission and API interaction.
- **types.ts**: Type definitions and Zod schemas for form validation.

### Debug Components
- **debug/form-debug-info.tsx**: Displays form state for debugging.
- **debug/form-validation-errors.tsx**: Displays form validation errors.
- **debug/debug-mode-toggle.tsx**: Toggle button for showing/hiding debug information.

## Usage

The form components are used in:
- `podcast-creation-form-new.tsx`: For creating new podcasts
- `podcast-edit-form.tsx`: For editing existing podcasts

Both of these entry point components use `PodcastFormBase` with different modes. 