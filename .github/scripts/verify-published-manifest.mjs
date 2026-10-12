import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import console from 'node:console';

export function verifyPublishedManifest(local, descriptor, image, verifiedId, source, publishedUri) {
  assert.match(source, /^[a-f0-9]{40}$/);
  assert.match(verifiedId, /^sha256:[a-f0-9]{64}$/);
  assert.equal(publishedUri, `us-east4-docker.pkg.dev/personal-brand-501801/portfolio/portfolio@${verifiedId}`);
  // Docker29's reviewed containerd image store identifies this single-platform
  // image by its manifest descriptor. A changed/legacy store fails closed.
  assert.equal(local.Id, verifiedId);
  assert.equal(local.Descriptor?.digest, verifiedId);
  assert.ok(['application/vnd.oci.image.manifest.v1+json', 'application/vnd.docker.distribution.manifest.v2+json'].includes(local.Descriptor.mediaType));
  assert.ok(Number.isSafeInteger(local.Descriptor.size) && local.Descriptor.size > 0 && local.Descriptor.size <= 1048576);
  for (const key of ['digest', 'mediaType', 'size']) assert.equal(descriptor[key], local.Descriptor[key]);
  assert.equal(local.Architecture, 'amd64'); assert.equal(local.Os, 'linux');
  assert.equal(image.architecture, 'amd64'); assert.equal(image.os, 'linux');
  for (const config of [local.Config, image.config]) {
    assert.equal(config?.Labels?.['org.opencontainers.image.revision'], source);
    assert.equal(config?.Labels?.['org.opencontainers.image.source'], 'https://github.com/2jog-personal-brand/portfolio');
    assert.ok(Array.isArray(config.Env) && config.Env.every(value => typeof value === 'string'));
    assert.deepEqual(config.Env.filter(value => value.startsWith('PORTFOLIO_RELEASE_SHA=')), [`PORTFOLIO_RELEASE_SHA=${source}`]);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    assert.equal(process.argv.length, 8);
    const values = process.argv.slice(2, 5).map(path => {
      assert.ok(statSync(path).isFile() && statSync(path).size <= 262144);
      return JSON.parse(readFileSync(path, 'utf8'));
    });
    verifyPublishedManifest(...values, ...process.argv.slice(5));
    console.log('Registry manifest and configuration match the exact scanned image.');
  } catch { console.error('Exact published manifest verification failed; configuration values suppressed.'); process.exitCode = 1; }
}
