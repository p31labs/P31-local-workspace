import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';

const ajv = new Ajv();

let dtcgSchema;
try {
  const schemaPath = path.resolve(
    import.meta.dirname,
    '../node_modules/@tokens-studio/sd-dtcg-schema/schema.json',
  );
  dtcgSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
} catch {
  try {
    dtcgSchema = JSON.parse(
      fs.readFileSync(
        path.resolve(
          import.meta.dirname,
          '../../node_modules/@tokens-studio/sd-dtcg-schema/schema.json',
        ),
        'utf-8',
      ),
    );
  } catch {
    console.error('DTCG schema not found. Install @tokens-studio/sd-dtcg-schema');
    process.exit(1);
  }
}

const validate = ajv.compile(dtcgSchema);
const tokensPath = path.resolve(import.meta.dirname, '../tokens/tokens.json');
const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));

const valid = validate(tokens);

if (!valid) {
  console.error('DTCG schema violations:', JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}

const tokenCount = Object.keys(tokens).length;
console.log(`✓ tokens.json passes DTCG v2025.10 schema (${tokenCount} top-level groups)`);
