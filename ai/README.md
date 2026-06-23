# Major Recommendation AI Module

## Purpose

This module provides a rule-based major recommendation MVP for Hey! PNU.

It compares a student's questionnaire answers with department profiles and returns the top recommended majors with:

* Overall matching score
* Category-level scores
* Short explanation of the match
* Korean-language eligibility note

## Current MVP Coverage

The current pilot includes these departments:

1. Artificial Intelligence
2. Computer Engineering
3. Design Technology
4. Business Administration

More departments can be added later by adding new profile objects to `departmentProfiles.js`.

## Files

* `departmentProfiles.js`
  Contains department names, TOPIK requirements, and questionnaire tag weights.

* `recommendationEngine.js`
  Calculates matching scores and ranks the recommended majors.

* `testRecommendation.js`
  Runs a local test without requiring the full backend or database connection.

## Scoring Weights

| Questionnaire category | Weight |
| ---------------------- | -----: |
| Academic areas         |    35% |
| Activities             |    20% |
| Strengths              |    20% |
| Career areas           |    15% |
| Learning styles        |    10% |

The department-tag weights are currently MVP assumptions based on expected fit. They are not official PNU admissions criteria.

## Test the AI Module

From the backend project root:

```powershell
node ai\testRecommendation.js
```

## API Integration

When the main backend has valid environment variables, the recommendation endpoint is:

```text
POST /api/ai/recommend-major
```

Example request body:

```json
{
  "academicAreas": ["AA13"],
  "activities": ["ACT01", "ACT02", "ACT03", "ACT05"],
  "strengths": ["ST01", "ST02", "ST03", "ST04", "ST15"],
  "careerAreas": ["CA02", "CA04"],
  "learningStyles": ["LS02", "LS03", "LS04"],
  "topikLevel": 5
}
```

## Current Limitation

The full Express backend requires Supabase environment variables for existing student-related features. The AI recommendation module can be tested independently without Supabase.
