import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPublishedManifest } from './verify-published-manifest.mjs';
const source = 'a'.repeat(40); const id = `sha256:${'b'.repeat(64)}`;
const clone = value => JSON.parse(JSON.stringify(value));
function fixture() {
  const descriptor = {digest: id, mediaType: 'application/vnd.oci.image.manifest.v1+json', size: 5992};
  const config = {Labels: {'org.opencontainers.image.revision': source, 'org.opencontainers.image.source': 'https://github.com/2jog-personal-brand/portfolio'}, Env: [`PORTFOLIO_RELEASE_SHA=${source}`]};
  return [{Id: id, Descriptor: clone(descriptor), Architecture: 'amd64', Os: 'linux', Config: clone(config)}, descriptor, {architecture: 'amd64', os: 'linux', config}, id, source, `us-east4-docker.pkg.dev/personal-brand-501801/portfolio/portfolio@${id}`];
}
test('exact scanned manifest and independently fetched registry config pass', () => assert.doesNotThrow(() => verifyPublishedManifest(...fixture())));
for (const [name, change] of [
  ['different scanned image', values => {values[0].Id = `sha256:${'c'.repeat(64)}`;}],
  ['legacy missing manifest descriptor', values => {delete values[0].Descriptor;}],
  ['changed remote manifest digest', values => {values[1].digest = `sha256:${'c'.repeat(64)}`;}],
  ['changed descriptor size', values => {values[1].size++;}],
  ['changed media type', values => {values[1].mediaType = 'application/vnd.oci.image.index.v1+json';}],
  ['wrong remote architecture', values => {values[2].architecture = 'arm64';}],
  ['wrong OCI source', values => {values[2].config.Labels['org.opencontainers.image.revision'] = 'c'.repeat(40);}],
  ['wrong repository', values => {values[2].config.Labels['org.opencontainers.image.source'] = 'https://example.test/peer';}],
  ['wrong runtime source', values => {values[2].config.Env = [`PORTFOLIO_RELEASE_SHA=${'c'.repeat(40)}`];}],
  ['duplicate runtime source', values => {values[2].config.Env.push(`PORTFOLIO_RELEASE_SHA=${source}`);}],
  ['peer registry image', values => {values[5] = `us-east4-docker.pkg.dev/personal-brand-501801/peer/peer@${id}`;}],
]) test(`${name} rejects`, () => {const values = fixture(); change(values); assert.throws(() => verifyPublishedManifest(...values));});
