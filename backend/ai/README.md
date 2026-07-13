# Major Recommendation Feature — MVP Draft

## Status

This is the first working draft of the major-recommendation feature for Hey! PNU.

It demonstrates the full recommendation flow using a small pilot dataset and rule-based matching. The current version is intentionally simple, transparent, and easy to expand. More department data, verified PNU information, external AI models, and API keys will be added later by the team.

## Purpose

The feature helps prospective international students explore PNU majors that may fit their interests, strengths, career goals, learning preferences, and Korean-language level.

It returns:

* A ranked list of recommended majors
* An overall match score
* Scores by questionnaire category
* A short explanation of the match
* A Korean-language requirement reminder

The result is intended as guidance only. It is not an admission decision or an official PNU eligibility check.

## Current MVP Coverage

The first version includes four pilot departments:

1. Artificial Intelligence
2. Computer Engineering
3. Design Technology
4. Business Administration

More departments will be added after the team collects and verifies additional information such as:

* Official admission requirements
* Curriculum and required courses
* Graduation requirements
* Scholarship information
* Career and internship paths
* Department-specific language requirements

## Course Recommendation v1

This is a first MVP draft.

`courseRecommendationEngine.js` recommends courses using the student's major, interests, course type, and completed-course list.

It returns ranked courses with:

* `score`
* `matchHint`

The local test can be run with:

```powershell
node ai/testCourseRecommendation.js
```

The current test uses sample course data. Later versions will connect this feature to verified PNU curriculum data and the team's database.

## How It Works

1. A student completes the major-recommendation questionnaire.
2. The selected answers are compared with each department profile.
3. Each department receives category scores.
4. A weighted final score is calculated.
5. The top matching majors are returned in ranked order.

The current ranking is rule-based. This makes the result predictable and allows the feature to work without an external AI API.

## Questionnaire Categories

| Category        | Purpose                              | Weight |
| --------------- | ------------------------------------ | -----: |
| Academic areas  | Subjects and academic interests      |    35% |
| Activities      | Preferred activities and experiences |    20% |
| Strengths       | Personal strengths and skills        |    20% |
| Career areas    | Career interests and goals           |    15% |
| Learning styles | Preferred ways of learning           |    10% |

The department-tag weights in this MVP are internal prototype assumptions. They are not official PNU admissions criteria.

## Project Files

### Recommendation logic

* `ai/departmentProfiles.js`
  Contains the current department profiles, questionnaire tags, and Korean-language requirement reminders.

* `ai/recommendationEngine.js`
  Calculates category scores, final scores, explanations, eligibility notes, and the ranked recommendation list.

* `ai/testRecommendation.js`
  Runs the recommendation engine directly without starting the full backend.

### Backend connection

* `controllers/aiController.js`
  Receives questionnaire data from the API and returns recommendation results.

* `routes/aiRoutes.js`
  Defines the major-recommendation API route.

* `services/claudeMajorRecommendationService.js`
  Contains an optional future connection point for a Claude-based explanation and gap-analysis feature.

The files outside the `ai` folder only connect this feature to the existing Node.js backend. They do not replace or modify student login, scholarship, checklist, or database functionality.

## Local Test

From the backend project root, run:

```powershell
node ai\testRecommendation.js
```

This test works without:

* Supabase credentials
* A running Express server
* An Anthropic API key
* Any external AI model

The expected result is a ranked JSON list of recommended departments.

## API Endpoint

Once the existing backend environment is configured, the feature is available through:

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
  "topikLevel": 5,
  "topN": 3
}
```

Example response structure:

```json
{
  "success": true,
  "recommendationMethod": "rule-based",
  "recommendations": [
    {
      "rank": 1,
      "id": "artificial-intelligence",
      "name": "Artificial Intelligence",
      "nameKo": "정보컴퓨터공학부(인공지능전공)",
      "score": 95.4,
      "reason": "Strong match based on academic interests, preferred activities, strengths, learning style.",
      "eligibilityNote": "Korean requirement appears met: TOPIK 4 or above.",
      "claudeReason": null
    }
  ],
  "aiAnalysis": null,
  "warning": "Claude is not configured yet. Rule-based recommendations are being used."
}
```

## Future External AI Integration

This first version does not use an external AI model or API key.

A basic service structure has been prepared so that the team can later connect selected AI models, such as Claude or Gemini, after deciding:

* Which model to use
* Which API account will be used
* Cost limits and usage rules
* Prompt design
* Security and API-key management
* Which features should use external AI

Possible future uses include:

* Personalized recommendation explanations
* Goal-oriented gap analysis
* Multilingual summaries
* Course recommendations
* Notice translation and summarization
* Chatbot support for admissions, campus life, and visa-related questions

When external AI services are added, credentials must be stored in environment variables and never committed to GitHub.

Example future environment variables:

```text
ANTHROPIC_API_KEY=your_api_key
CLAUDE_MODEL=your_selected_model
GEMINI_API_KEY=your_api_key
```

The current implementation safely continues with rule-based recommendations when no model or API key is configured.

## Adding a New Department

To add a department in a later version:

1. Open `ai/departmentProfiles.js`.
2. Add a new department profile object.
3. Include the English name, Korean name, language reminder, and questionnaire tag weights.
4. Keep the tag format consistent with the existing profiles.
5. Run the local test again:

```powershell
node ai\testRecommendation.js
```

6. Check whether the new department appears reasonably for different test profiles.

## Current Limitations

* Only four departments are included.
* Tag weights are prototype assumptions and require review.
* Korean-language requirements are reminders only and must be checked against the latest official PNU guide.
* No external AI model is connected yet.
* The full backend currently requires Supabase environment variables for existing student-related features.
* The recommendation engine itself can still be tested independently.

## Next Development Priorities

1. Add more verified PNU department profiles.
2. Align frontend questionnaire options with the tag IDs used by the recommendation engine.
3. Add official curriculum, scholarship, and admissions data.
4. Connect selected external AI models after the team decides API accounts and security rules.
5. Add user feedback and recommendation-quality evaluation.
6. Build the separate course-recommendation feature for current students.
