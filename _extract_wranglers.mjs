import { parse } from '/home/p31/P31-local-workspace/node_modules/.pnpm/smol-toml@1.6.1/node_modules/smol-toml/dist/index.js';
import { readFileSync } from 'fs';
import { relative } from 'path';
import { execSync } from 'child_process';

const base = '/home/p31/P31-local-workspace';

const cmd = `find ${base} -name "wrangler.toml" -type f | sort`;
const files = execSync(cmd, { encoding: 'utf8', maxBuffer: 10*1024*1024 }).trim().split('\n').filter(f => f && !f.includes('{project}'));

const results = [];

for (const fp of files) {
   const rel = relative(base, fp);
   try {
      const raw = readFileSync(fp, 'utf8');
      const data = parse(raw);
      
      const entry = { path: rel };
      entry.name = data.name || '';
      entry.main = data.main || '';
      entry.compatibility_date = data.compatibility_date || '';
      entry.compatibility_flags = data.compatibility_flags || [];
      entry.observability = data.observability || {};
      
      const triggers = data.triggers || {};
      entry.crons = (triggers && triggers.crons) ? triggers.crons : [];
      
      entry.d1 = (data.d1_databases || []).map(d => ({
         binding: d.binding || '', db_name: d.database_name || '', db_id: d.database_id || ''
      }));
      
      entry.kv = (data.kv_namespaces || []).map(k => ({
         binding: k.binding || '', id: k.id || '', title: k.title || ''
      }));
      
      entry.r2 = (data.r2_buckets || []).map(r => ({
         binding: r.binding || '', bucket: r.bucket_name || '', jurisdiction: r.jurisdiction || ''
      }));
      
      const doBindings = (data.durable_objects && data.durable_objects.bindings) ? data.durable_objects.bindings : [];
      entry.durable_objects = doBindings.map(d => ({
         name: d.name || '', class_name: d.class_name || '', script_name: d.script_name || ''
      }));
      
      entry.services = (data.services || []).map(s => ({
         binding: s.binding || '', service: s.service || '', environment: s.environment || ''
      }));
      
      entry.queues = [];
      if (data.queues) {
         for (const p of (data.queues.producers || [])) {
            entry.queues.push({ type: 'producer', binding: p.binding || '', queue: p.queue || '' });
         }
         for (const c of (data.queues.consumers || [])) {
            entry.queues.push({ type: 'consumer', binding: c.binding || '', queue: c.queue || '' });
         }
      }
      
      entry.vectorize = (data.vectorize || []).filter(v => typeof v === 'object').map(v => ({
         binding: v.binding || '', index_name: v.index_name || ''
      }));

      entry.ai = data.ai || {};
      entry.env_vars = data.vars || {};
      
      entry.environments = {};
      const envData = data.env || data.environments || {};
      if (typeof envData === 'object' && !Array.isArray(envData)) {
         for (const [envName, envConf] of Object.entries(envData)) {
            entry.environments[envName] = {
               vars: envConf.vars || {},
               d1_databases: envConf.d1_databases || [],
               kv_namespaces: envConf.kv_namespaces || [],
               r2_buckets: envConf.r2_buckets || [],
               services: envConf.services || []
            };
         }
      }
      
      entry.send_email = data.send_email || [];
      
      results.push(entry);
   } catch(e) {
      results.push({ path: rel, error: e.message });
   }
}

console.log(JSON.stringify(results, null, 2));
