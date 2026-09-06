/**
 * P31 Zenodo Integration Worker
 * Handles DOI metadata publishing and research archive automation
 * 
 * Deploy: wrangler deploy p31_zenodo_worker.js
 * Environment: ZENODO_API_TOKEN, ZENODO_SANDBOX (optional)
 */

const ZENODO_API_TOKEN = ZENODO_API_TOKEN || '';
const ZENODO_SANDBOX = ZENODO_SANDBOX === 'true' || false;
const BASE_URL = ZENODO_SANDBOX 
  ? 'https://sandbox.zenodo.org/api' 
  : 'https://zenodo.org/api';

// Node milestones for research milestones
const RESEARCH_MILESTONES = {
  1: 'First publication deposited',
  5: 'Research collection initiated',
  10: 'Academic presence established',
  25: 'Citizen science milestone',
  50: 'Open science advocate'
};

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // GET endpoint for deposition status
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const action = url.searchParams.get('action');
      
      if (action === 'status') {
        return jsonResponse(await getDepositionStatus(env));
      }
      
      if (action === 'doi') {
        const doi = await getLatestDOI(env);
        return jsonResponse({ doi });
      }
      
      if (action === 'stats') {
        return jsonResponse(await getResearchStats(env));
      }

      return jsonResponse({
        service: 'p31-zenodo-worker',
        status: 'operational',
        endpoints: {
          'GET /?action=status': 'Check deposition status',
          'GET /?action=doi': 'Get latest DOI',
          'GET /?action=stats': 'Research statistics',
          'POST /': 'Create new deposition'
        }
      });
    }

    // POST - Create new deposition
    if (request.method === 'POST') {
      if (!ZENODO_API_TOKEN) {
        return jsonResponse({ error: 'ZENODO_API_TOKEN not configured' }, 401);
      }

      try {
        const payload = await request.json();
        const result = await createDeposition(payload, env);
        return jsonResponse(result);
      } catch (error) {
        return jsonResponse({ error: error.message }, 500);
      }
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
};

async function createDeposition(metadata, env) {
  // Step 1: Create empty deposition
  const createResponse = await fetch(`${BASE_URL}/depositions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ZENODO_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      metadata: {
        title: metadata.title || 'P31 Labs Research Deposit',
        description: metadata.description || 'Research deposit from P31 Labs ecosystem',
        upload_type: metadata.upload_type || 'software',
        publication_date: metadata.publication_date || new Date().toISOString().split('T')[0],
        creators: metadata.creators || [
          { name: 'Johnson, Will', orcid: '0009-0002-2492-9079' }
        ],
        keywords: metadata.keywords || ['p31', 'neurodiversity', 'assistive technology'],
        license: metadata.license || 'mit',
        access_right: 'open',
        version: metadata.version || '1.0.0'
      }
    })
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create deposition: ${error}`);
  }

  const deposition = await createResponse.json();
  
  // Step 2: Upload file if provided
  if (metadata.file_url) {
    const fileResponse = await fetch(`${BASE_URL}/depositions/${deposition.id}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZENODO_API_TOKEN}`,
        'Content-Type': 'application/octet-stream',
      },
      body: await fetch(metadata.file_url).then(r => r.arrayBuffer())
    });
    
    if (!fileResponse.ok) {
      console.error('File upload failed, continuing with metadata-only deposit');
    }
  }

  // Step 3: Publish deposition
  const publishResponse = await fetch(`${BASE_URL}/depositions/${deposition.id}/actions/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ZENODO_API_TOKEN}`,
    }
  });

  const published = await publishResponse.json();
  
  // Save DOI to KV
  if (published.doi) {
    await saveDOI(env, published.doi, deposition.id);
  }

  return {
    deposition_id: deposition.id,
    doi: published.doi || `10.5281/zenodo.${deposition.id}`,
    conceptrecid: published.conceptrecid,
    state: published.state,
    metadata_url: `${ZENODO_SANDBOX ? 'https://sandbox.zenodo.org' : 'https://zenodo.org'}/record/${deposition.id}`
  };
}

async function getDepositionStatus(env) {
  const count = await getDepositionCount(env);
  const latestDOI = await getLatestDOI(env);
  
  return {
    total_depositions: count,
    latest_doi: latestDOI,
    milestones: getMilestoneStatus(count)
  };
}

async function getDepositionCount(env) {
  if (!env.ZENODO_KV) {
    return global.depositionCount || 0;
  }
  
  const count = await env.ZENODO_KV.get('deposition_count');
  return parseInt(count) || 0;
}

async function getLatestDOI(env) {
  if (!env.ZENODO_KV) {
    return global.latestDOI || '10.5281/zenodo.19004485'; // Default from Cognitive Passport
  }
  
  return await env.ZENODO_KV.get('latest_doi') || '10.5281/zenodo.19004485';
}

async function saveDOI(env, doi, depositionId) {
  if (!env.ZENODO_KV) {
    global.latestDOI = doi;
    global.depositionCount = (global.depositionCount || 0) + 1;
    return;
  }
  
  await env.ZENODO_KV.put('latest_doi', doi);
  
  const count = await env.ZENODO_KV.get('deposition_count');
  await env.ZENODO_KV.put('deposition_count', ((parseInt(count) || 0) + 1).toString());
}

function getMilestoneStatus(count) {
  const milestones = [];
  
  for (const [threshold, meaning] of Object.entries(RESEARCH_MILESTONES)) {
    milestones.push({
      threshold: parseInt(threshold),
      reached: count >= parseInt(threshold),
      meaning
    });
  }
  
  return milestones;
}

async function getResearchStats(env) {
  const count = await getDepositionCount(env);
  const latestDOI = await getLatestDOI(env);
  
  return {
    publications: count,
    latest_doi: latestDOI,
    impact: {
      citations: 'Track via DOI resolution',
      downloads: 'Available via Zenodo API'
    },
    next_milestone: Object.keys(RESEARCH_MILESTONES)
      .find(t => parseInt(t) > count) || null
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
