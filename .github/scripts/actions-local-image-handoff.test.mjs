import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
const ci = readFileSync(new URL('../workflows/ci.yml', import.meta.url), 'utf8');
const promote = readFileSync(new URL('../workflows/promote.yml', import.meta.url), 'utf8');
test('trusted Mac build and promotion avoid image artifacts while forks retain hosted isolation', () => {
  assert.doesNotMatch(ci + promote, /runs-on: ubuntu-|actions\/(upload|download)-artifact@|actions\/cache@|docker\/setup-qemu-action@/);
  assert.match(ci, /DOCKER_BUILD_RECORD_UPLOAD: "false"/);
  assert.match(ci, /Require Apple Rosetta translation/); assert.match(ci, /Disable BuildKit's bundled QEMU fallback/);
  assert.match(ci, /needs\.verify\.outputs\.verified_image_id/);
  assert.match(ci, /docker tag "\$\{VERIFIED_IMAGE_ID\}"/);
  assert.match(ci, /PORTFOLIO_RELEASE_SHA/); assert.match(ci, /org\.opencontainers\.image\.revision/);
  assert.doesNotMatch(ci, /gh api --method DELETE/);
  assert.match(ci, /github\.actor_id == '81255678' && \(github\.event_name != 'pull_request' \|\| github\.event\.pull_request\.head\.repo\.full_name == github\.repository\)/);
  assert.match(ci, /\|\| 'ubuntu-24\.04'/);
  assert.match(ci, /if: runner\.name == 'pb-mac-m1-bootstrap'/);
});
