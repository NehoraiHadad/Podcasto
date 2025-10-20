# Podcasto Scripts

Utility scripts for Podcasto administration and maintenance.

## Available Scripts

### find-duplicate-podcasts.ts

Analyzes podcasts in the database to identify potential duplicates that could be merged into multilingual podcast groups.

**Features:**
- Fuzzy title matching to find similar podcast names
- Language detection from `podcast_configs.language` field
- Groups podcasts by title similarity
- Outputs JSON file with suggested groups

**Usage:**

```bash
# Run with default output file (suggested-podcast-groups.json)
npx tsx scripts/find-duplicate-podcasts.ts

# Specify custom output file
npx tsx scripts/find-duplicate-podcasts.ts --output my-groups.json
```

**Output Format:**

```json
[
  {
    "suggested_base_title": "Abuali Express",
    "similarity_score": 0.95,
    "podcasts": [
      {
        "id": "uuid-1",
        "title": "Abuali Express Hebrew",
        "language": "hebrew",
        "description": "..."
      },
      {
        "id": "uuid-2",
        "title": "Abuali Express English",
        "language": "english",
        "description": "..."
      }
    ]
  }
]
```

**Next Steps:**

After running the script, review the suggested groups and use the migration tool in the admin panel (`/admin/podcasts/migrate`) to merge podcasts into multilingual groups.

## Requirements

- Node.js 18+
- tsx (for running TypeScript scripts)
- Database connection configured in `.env`
