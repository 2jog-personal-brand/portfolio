import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

test('direct federation publication stays private, bounded and exact-image verified', () => {
  const workflow = readFileSync(new URL('../workflows/ci.yml', import.meta.url), 'utf8');
  const publish = workflow.split('  publish:\n')[1].split('  stage:\n')[0];
  for (const required of [
    'umask 077', 'portfolio-publish-docker-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}',
    'portfolio-publish-gcloud-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}',
    'timeout 180s docker push', 'timeout 240s docker push',
    'timeout 60s docker buildx imagetools inspect "${PUBLISHED_DIGEST_URI}"',
    'docker tag "${VERIFIED_IMAGE_ID}"',
    '[[ "${resolved_digest}" == "${digest}" ]]',
    'node .github/scripts/verify-published-manifest.mjs',
    'authentication failed|unauthorized|token.*expired',
  ]) assert.ok(publish.includes(required), required);
  assert.doesNotMatch(publish, /service_account:|continue-on-error:|actions\/(upload|download)-artifact@/);
  assert.doesNotMatch(publish, /docker pull/);
  assert.ok(publish.indexOf('Refresh direct federation immediately before publication') < publish.indexOf('Publish the verified SHA image'));
  assert.ok(publish.indexOf('Refresh direct federation for independent read-back') < publish.indexOf('Verify exact published digest'));
  assert.ok(publish.includes('gcloud artifacts docker images describe "${remote_image}"'));
});
