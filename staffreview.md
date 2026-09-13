# Staff Pre-Submission Review

## Review Details

- Review date: 2026-09-13
- Repository state: `fa4d0d9` on `noTicket/InitialCommit`
- Remote comparison: `HEAD` matches `origin/noTicket/InitialCommit`
- Working tree: clean when the review began
- Scope: full tracked repository and commit history, including application code, unit tests, infrastructure, dependencies, documentation, all accepted ADRs, and all active tickets
- Uncommitted changes included: none

## Findings

### High (Resolved): Valid timestamps did not always sort chronologically in DynamoDB

**Original references:** `src/telemetry.js:10`, `src/persistence.js:10-13`, `serverless.yml:125-138`, `README.md:42`, `README.md:76-77`

At the time of review, the event contract accepted ISO 8601 timestamps with any numeric timezone offset and preserved the supplied string. Both DynamoDB indexes then used that string as their sort key. DynamoDB sorts strings lexicographically rather than by the instant they represent.

For example, `2026-09-13T12:00:00+10:00` occurs before `2026-09-13T03:00:00Z`, but the first string sorts after the second. Variable fractional-second precision can produce similar ordering problems.

As a result, `drone-history` can return events in the wrong chronological order, and both indexes can produce incorrect time-window results. This breaks a core storage requirement described by ADR 0007 and the README.

**Recommendation:** Require timestamps in canonical UTC format or normalize them to a fixed UTC representation such as `Date#toISOString()` before indexing. Preserve the producer's original timestamp separately only if it is needed. Add tests covering positive and negative offsets, date boundaries, and fractional-second precision.

**Resolution:** T-008 implements the user-approved normalization approach. ADR 0013 records the decision. Validation now converts accepted timestamps to canonical UTC with fixed millisecond precision before returning the storage-ready event. Unit tests cover offsets, a UTC date boundary, fractional-second precision, chronological string ordering, and unchanged input.

**Disposition:** Resolved and accepted by the user on 2026-09-13.

### Medium: A validated drone ID can exceed DynamoDB limits

**References:** `src/telemetry.js:5`, `src/telemetry.js:9`, `src/handler.js:128-150`, `serverless.yml:115-130`

`droneId` has no maximum size even though it becomes a DynamoDB index partition key. DynamoDB limits a partition key to 2,048 bytes.

Messages exceeding that limit pass application validation and then fail every DynamoDB write with a permanent validation error. The handler treats every persistence error as retryable, so these messages consume all retry attempts and reach the DLQ instead of being classified as invalid telemetry and sent to quarantine.

**Recommendation:** Add an explicit UTF-8 byte limit for `droneId` during telemetry validation. Add boundary tests showing that oversized values are quarantined instead of retried.

**Disposition:** Fix before submission so permanent data-quality failures follow the documented quarantine policy.

### Medium: T-007 does not show that every README command was tested from a clean checkout

**References:** `docs/tickets/T-007-documentation-and-final-review.md:28`, `docs/tickets/T-007-documentation-and-final-review.md:64`, `docs/tickets/T-007-documentation-and-final-review.md:69-72`, `README.md:146-159`

T-007 requires every command in the README to be run. Its completion notes record dependency installation, tests, LocalStack startup, deployment, publishing, and shutdown. They say the clone URL was confirmed, but do not record executing the complete `git clone`, `cd`, `nvm use`, and environment-loading sequence from a clean checkout.

The main workflow has good evidence, but it does not fully support the ticket's claim that every documented command was exercised as a new reviewer would use it.

**Recommendation:** Run the README sequence in a temporary clean checkout using Node.js `v20.20.2`, then record the result in T-007. If those exact steps were already run, make that evidence explicit.

**Disposition:** Resolve before the user accepts T-007.

### Low: The integration setup instructions are incomplete and can race LocalStack startup

**References:** `test/integration/README.md:5-10`, `README.md:153-172`

The abbreviated integration setup does not load `.env.example` and uses `docker compose up -d` rather than the confirmed `docker compose up -d --wait` command. A reader following only this file may deploy before LocalStack is healthy or may lack the local AWS settings.

**Recommendation:** Link directly to the root setup instructions or repeat the complete environment and health-waiting steps.

**Disposition:** Small documentation fix recommended before submission.

### Low: The README overstates source-queue durability

**References:** `README.md:32`, `README.md:112`, `serverless.yml:101`

The README says SQS keeps incoming events until they can be processed. The source queue actually retains a message for four days. An outage longer than that can cause unprocessed data to expire.

**Recommendation:** State that SQS buffers incoming events for up to four days while the processor is unavailable.

**Disposition:** Small accuracy fix recommended before submission.

### Low: The bootstrap test does not verify the exact pinned Node.js version

**References:** `test/unit/bootstrap.test.js:3-6`, `.nvmrc:1`, `package.json:7-10`

The test says it checks the pinned Node.js major version and accepts any Node 20 release. It does not verify the repository's exact `v20.20.2` pin. This provides less assurance than the surrounding documentation suggests.

**Recommendation:** Either compare with the exact version declared by the project or rename the test to say it only verifies the supported major version.

**Disposition:** Test-quality improvement; it does not block the application logic.

### Low: Lambda packaging includes files unrelated to runtime execution

**References:** `serverless.yml:1-43`

There is no Serverless package allowlist. The generated deployment archive includes tests, ADRs, tickets, challenge documentation, OpenCode configuration and dependencies, and other development files that the Lambda does not need.

The current archive remains under Lambda's package limits, but broad packaging increases artifact size and distributes internal development material unnecessarily. It also makes it easier for future local files to enter a deployment artifact accidentally.

**Recommendation:** Add narrow package patterns for the handler source and production dependencies, then inspect the generated archive in verification.

**Disposition:** Worth addressing before a production deployment; it is not a challenge-blocking defect.

## Questions And Assumptions

- The producer is assumed to generate stable event UUIDs and not reuse one ID for different event data, as documented.
- Messages are assumed to remain comfortably below the SQS message-size limit. This does not remove the need to validate DynamoDB key limits because those limits are much smaller.
- No uncommitted work was present or included in this review.
- Real AWS behavior was not tested. LocalStack verification cannot prove AWS polling, acknowledgement timing, throttling, or automatic DLQ redrive.

## Architecture And Scaling

The implementation is appropriately small for the challenge. SQS and Lambda decouple producers from processing availability, DynamoDB conditional writes correctly handle duplicate delivery, partial batch failures isolate retryable records, and quarantine is correctly separated from the processing DLQ.

The following are production considerations rather than current challenge defects:

- Node.js 20 is end-of-life and the Serverless v3 development toolchain has known dependency audit findings. This limitation is explicitly accepted in ADR 0010 and disclosed in the README.
- The DynamoDB table has no point-in-time recovery, deletion protection, or retained-resource policies. These should be stage-specific before storing non-disposable data.
- Lambda and its SQS event-source mapping have no concurrency ceiling. Production limits should be based on expected throughput, backlog recovery targets, downstream capacity, and account-level concurrency needs.
- The fixed `ERROR` index partition can become hot at high error volume. ADR 0007 already records time-bucketing as a future consideration.
- CloudWatch log retention is not configured. A production deployment should set a retention period based on support and privacy requirements.
- Explicit IAM role and managed-policy names omit the region, which prevents deploying the same stage to multiple regions in one account. CloudFormation-generated names would avoid that collision.
- Operational alarms and replay procedures are intentionally absent. Production should cover queue age, DLQ and quarantine depth, Lambda errors and throttles, DynamoDB throttling, and controlled replay.

## T-007 Acceptance Coverage

| Criterion | Result | Notes |
| --- | --- | --- |
| Run every README command | Partial | The main workflow is recorded, but the complete clean-checkout sequence is not evidenced. |
| Complete local installation, run, and test steps | Met | Installation, LocalStack, deployment, publishing, testing, and shutdown are documented. |
| Valid examples include `eventId` | Met | The example matches the implemented schema. |
| Explain DynamoDB searches and duplicates | Met | Duplicate handling is accurate and canonical UTC timestamps support chronological and time-window queries. |
| Explain quarantine, duplicate delivery, retries, partial batches, and DLQ | Met | The outcomes and delivery guarantees are clearly distinguished. |
| Explain JavaScript choice and TypeScript trade-off | Met | The rationale and loss of compile-time checking are documented. |
| Document permissions and proposed integration tests | Met | Least-privilege intent and the absence and limitations of automated integration tests are clear. |
| Describe future production improvements | Met | The README identifies appropriate production work without implementing it. |
| Explain AI ownership and ticket approval | Met | The user is identified as the decision owner. |
| Update `AGENTS.md` | Met | The final structure, commands, and architectural gotchas are present. |
| Remove placeholders and unsupported claims | Not met | No template placeholders remain, but the indefinite buffering claim is unsupported. |

The high-severity timestamp issue is resolved. T-007 should remain in `Review` until its remaining acceptance-evidence gaps are resolved. Only the user should mark it `Done`.

## Verification

Read-only review checks established:

- `git status --short --branch`: clean at the start of review
- `git rev-list --left-right --count HEAD...origin/noTicket/InitialCommit`: `0 0`
- `git diff --check`: passed
- Commit history and the resulting repository state were inspected
- Source, unit tests, infrastructure, active tickets, all accepted ADRs, and documentation were compared manually
- The existing generated Serverless artifact was inspected for package contents
- An independent review run executed `docker compose config --quiet`, Serverless configuration printing for `dev` and `local`, dependency-tree validation, and dependency audits successfully apart from the reported audit findings
- The independent test run used Node.js `v24.20.0`: 40 tests passed and the bootstrap version test failed as expected because the repository requires Node.js 20
- T-007 records that all 41 unit tests pass on the pinned Node.js `v20.20.2`, along with successful LocalStack deployment and example-message processing; those historical results were not independently repeated during this review
- T-008 verification ran `npm test -- telemetry` and `npm test` on Node.js `v20.20.2`; all 5 suites and 45 tests passed

## Overall Assessment

The repository demonstrates a clear, well-reasoned event-driven design and covers the challenge's main reliability behaviors without unnecessary abstraction. T-008 resolves the high-severity timestamp-ordering defect. The remaining medium and low findings, including the unbounded `droneId` key and final documentation evidence, remain unchanged unless explicitly approved for separate work.
