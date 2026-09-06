/**
 * Hashnode — GraphQL publishPost mutation
 * Auth: Authorization: <HASHNODE_TOKEN>  (NO "Bearer " prefix)
 * Docs: https://apidocs.hashnode.com/
 */

const GQL = 'https://gql.hashnode.com';

const MUTATION = `
mutation PublishPost($input: PublishPostInput!) {
  publishPost(input: $input) {
    post { id slug url title }
  }
}
`;

async function publish({ content, env }) {
  const token = env.HASHNODE_TOKEN;
  const publicationId = env.HASHNODE_PUBLICATION_ID;
  if (!token) throw new Error('HASHNODE_TOKEN not set');
  if (!publicationId) throw new Error('HASHNODE_PUBLICATION_ID not set');

  if (typeof content === 'string') {
    throw new Error('hashnode requires { title, body_markdown, ... } object');
  }

  const input = {
    publicationId,
    title: content.title,
    contentMarkdown: content.body_markdown || content.body || '',
    ...(content.tags ? { tags: content.tags.map(t => ({ slug: slugify(t), name: t })) } : {}),
    ...(content.canonical_url ? { originalArticleURL: content.canonical_url } : {}),
    ...(content.subtitle ? { subtitle: content.subtitle } : {})
  };

  const res = await fetch(GQL, {
    method: 'POST',
    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: MUTATION, variables: { input } })
  });
  const body = await res.json();
  if (body.errors) {
    throw new Error(`Hashnode GraphQL: ${JSON.stringify(body.errors)}`);
  }
  const post = body.data?.publishPost?.post;
  if (!post) throw new Error(`Hashnode: empty response — ${JSON.stringify(body)}`);
  return {
    success: true,
    platform: 'hashnode',
    id: post.id,
    slug: post.slug,
    url: post.url
  };
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

module.exports = { publish };
