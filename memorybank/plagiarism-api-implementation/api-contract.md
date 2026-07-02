## Plagiarism API Contract (Draft)

**Endpoint:** `POST https://api-qa.shothik.ai/check/plagiarism/analyze`  
**Environment:** QA  
**Last Updated:** 2025-11-09

---

### 1. Authentication

- **Header:** `Authorization: Bearer <token>`
- Token acquisition/refresh flow: _TBD_ (needs clarification from backend/auth team).

---

### 2. Request Schema

```json
{
  "text": "The user-supplied content to analyze for plagiarism."
}
```

- `text` is required.
- No additional fields currently supported.
- Max length, encoding constraints: _TBD_.

---

### 3. Response Schema (Observed)

```json
{
  "overallSimilarity": 0.81,
  "paraphrasedSections": [
    {
      "text": "string",
      "similarity": 0.82,
      "sources": [
        {
          "url": "string",
          "title": "string",
          "snippet": "string",
          "reason": "string",
          "matchType": "paraphrased",
          "confidence": "high",
          "isPlagiarism": true,
          "similarity": 0.82
        }
      ],
      "startChar": 0,
      "endChar": 337
    }
  ],
  "exactMatches": [],
  "summary": {
    "totalChunks": 4,
    "paraphrasedCount": 3,
    "exactMatchCount": 0,
    "riskLevel": "MEDIUM"
  },
  "timestamp": "2025-11-09T06:37:48.035Z",
  "paraphrasedPercentage": 75,
  "exactPlagiarismPercentage": 0,
  "hasPlagiarism": true,
  "needsReview": true,
  "sources": [
    {
      "url": "string",
      "title": "string",
      "snippet": "string",
      "reason": "string",
      "matchType": "paraphrased",
      "confidence": "high",
      "isPlagiarism": true,
      "similarity": 0.82
    }
  ],
  "citations": [
    {
      "url": "string",
      "apa": "string",
      "mla": "string",
      "chicago": "string"
    }
  ],
  "analysisId": "string"
}
```

> Based on sample payload (`plagiarismResponse.json`). Fields may expand; design service layer to allow graceful addition of new keys.

---

### 4. Error Handling

- Specific error codes/messages for quota, validation, or backend failures: _Pending clarification_.
- Known behaviors:
  - Missing/invalid token returns `401 Unauthorized` (assumed).
  - Other scenarios unknown; build generic fallback handling.

---

### 5. Open Questions

1. Token issuance/refresh workflow and expiry period.
2. Maximum text length and accepted character set.
3. Localization support or required request headers (e.g., language code).
4. Canonical error schema (fields, codes, retry instructions).

Update this document as answers arrive.
