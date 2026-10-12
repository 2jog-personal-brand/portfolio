import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

test('production desired traffic is ready and pinned to the actual serving rollback revision', () => {
  const workflow = readFileSync(new URL('../workflows/promote.yml', import.meta.url), 'utf8');
  const guard = workflow.indexOf('jq -e --arg revision "${previous_revision}"');
  const mutation = workflow.indexOf('labels_touched=1');
  assert.ok(guard > 0 && guard < mutation);
  const preflight = workflow.slice(guard, mutation);
  assert.ok(preflight.includes('.status.observedGeneration'));
  assert.ok(preflight.includes('.type == "Ready" and .status == "True"'));
  assert.ok(preflight.includes('.[0].revisionName == $revision'));
  assert.ok(preflight.includes('.[0].latestRevision != true'));
  assert.ok(preflight.includes('.status.traffic | length == 1 and .[0].tag == null'));
  assert.match(workflow, /timeout-minutes: 70/);
});
test('production verifies an available exact rollback image before any mutation', () => {
  const workflow = readFileSync(new URL('../workflows/promote.yml', import.meta.url), 'utf8');
  const guard = workflow.indexOf('previous_digest="$(gcloud artifacts docker images describe');
  const mutation = workflow.indexOf('labels_touched=1');
  assert.ok(guard > 0 && guard < mutation);
  assert.ok(workflow.includes('previous_image}" != "${IMAGE_URI}@${previous_digest}'));
  assert.ok(workflow.includes('candidate_revision}" || "${revision}" == "${previous_revision}'));
});
test('real production GitHub activity passes on the zero-traffic candidate before shifting', () => {
  const workflow = readFileSync(new URL('../workflows/promote.yml', import.meta.url), 'utf8');
  const candidateGate = workflow.indexOf('candidate_activity="$(curl');
  const shift = workflow.indexOf('shifted=1');
  assert.ok(candidateGate > 0 && candidateGate < shift);
  const beforeShift = workflow.slice(candidateGate, shift);
  assert.ok(beforeShift.includes('${candidate_url}/api/public/github/activity'));
  assert.ok(beforeShift.includes('.contributionsCollection.contributionCalendar.weeks'));
  assert.ok(beforeShift.includes('length > 0'));
  assert.ok(workflow.includes('${PROD_E2E_BASE_URL}/api/public/github/activity?release=${COMMIT_SHA}'));
});
