import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
const ci = readFileSync(new URL('../workflows/ci.yml', import.meta.url), 'utf8');
const promote = readFileSync(new URL('../workflows/promote.yml', import.meta.url), 'utf8');
test('Mac runner owns build and promotion without paid hosted jobs or image artifacts', () => {
  assert.doesNotMatch(ci + promote, /runs-on: ubuntu-|actions\/(upload|download)-artifact@|actions\/cache@|docker\/setup-qemu-action@/);
  assert.match(ci, /DOCKER_BUILD_RECORD_UPLOAD: "false"/);
  assert.match(ci, /Require Apple Rosetta translation/); assert.match(ci, /Disable BuildKit's bundled QEMU fallback/);
  assert.match(ci, /needs\.verify\.outputs\.verified_image_id/);
  assert.match(ci, /docker tag "\$\{VERIFIED_IMAGE_ID\}"/);
  assert.match(ci, /PORTFOLIO_RELEASE_SHA/); assert.match(ci, /org\.opencontainers\.image\.revision/);
  assert.doesNotMatch(ci, /gh api --method DELETE/);
});
