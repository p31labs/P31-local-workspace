/**
 * Zenodo — deposition API
 * Auth: Authorization: Bearer <ZENODO_TOKEN>
 * Docs: https://developers.zenodo.org/#depositions
 *
 * Three-step flow:
 *   1. POST /api/deposit/depositions           -> deposition id + bucket_url
 *   2. PUT  <bucket_url>/<filename>            -> upload file(s)
 *   3. POST /api/deposit/depositions/:id/actions/publish  -> publish (assigns DOI)
 *
 * Inputs:
 *   content: {
 *     title, description, creators: [{name, orcid?, affiliation?}],
 *     keywords?, publication_type?, upload_type?, access_right?,
 *     license?, related_identifiers?, version?,
 *     files: [{ name, data }]   // data = Buffer|ArrayBuffer|Uint8Array
 *   }
 *   opts.publish: bool (default false — leave as draft so you can review)
 *   opts.sandbox: bool (use sandbox.zenodo.org for testing)
 */

async function publish({ content, env, publish: doPublish = false, sandbox = false }) {
  const token = env.ZENODO_TOKEN;
  if (!token) throw new Error('ZENODO_TOKEN not set');
  const base = sandbox ? 'https://sandbox.zenodo.org' : 'https://zenodo.org';

  // 1. Create deposition
  const metadata = {
    title: content.title,
    description: content.description,
    creators: content.creators || [{ name: 'Johnson, William R.', orcid: '0009-0002-2492-9079' }],
    keywords: content.keywords || [],
    upload_type: content.upload_type || 'publication',
    publication_type: content.publication_type || 'preprint',
    access_right: content.access_right || 'open',
    license: content.license || 'cc-by-4.0',
    ...(content.version ? { version: content.version } : {}),
    ...(content.related_identifiers ? { related_identifiers: content.related_identifiers } : {})
  };

  const createRes = await fetch(`${base}/api/deposit/depositions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata })
  });
  const dep = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`Zenodo create ${createRes.status}: ${JSON.stringify(dep)}`);
  }

  const bucketUrl = dep.links?.bucket;
  if (!bucketUrl) throw new Error('Zenodo: no bucket_url in deposition response');

  // 2. Upload files
  for (const f of content.files || []) {
    if (!f.name || !f.data) throw new Error('file entry requires { name, data }');
    const putRes = await fetch(`${bucketUrl}/${encodeURIComponent(f.name)}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: f.data
    });
    if (!putRes.ok) {
      const errBody = await putRes.text();
      throw new Error(`Zenodo upload ${f.name}: ${putRes.status} ${errBody}`);
    }
  }

  // 3. Optionally publish (assigns permanent DOI)
  let published = null;
  if (doPublish) {
    const pubRes = await fetch(
      `${base}/api/deposit/depositions/${dep.id}/actions/publish`,
      { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }
    );
    published = await pubRes.json();
    if (!pubRes.ok) {
      throw new Error(`Zenodo publish ${pubRes.status}: ${JSON.stringify(published)}`);
    }
  }

  return {
    success: true,
    platform: 'zenodo',
    id: dep.id,
    doi: published?.doi || dep.metadata?.prereserve_doi?.doi || null,
    draft: !doPublish,
    url: published?.links?.html || dep.links?.html,
    sandbox
  };
}

module.exports = { publish };
