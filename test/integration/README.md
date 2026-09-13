# Integration Tests

Automated LocalStack integration tests are not implemented as part of this challenge. The root README documents the proposed scenarios, test lifecycle, and limitations.

The LocalStack resources used by that future suite can be created with:

```bash
docker compose up -d
npx serverless deploy --stage local
```

There is intentionally no integration-test command until an automated suite exists.
