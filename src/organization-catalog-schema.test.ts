import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const schema = JSON.parse(
  readFileSync(join(process.cwd(), 'schemas', 'organization-catalog.schema.json'), 'utf8'),
);
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

function catalogWithRecognitions(recognitions: unknown) {
  return {
    $schema: 'https://fides.community/schemas/organization-catalog/v1',
    organization: {
      id: 'org:example',
      name: 'Example',
      sectors: ['digital'],
      recognitions,
    },
  };
}

describe('organization recognition schema', () => {
  it('accepts customer stories and awards with optional links', () => {
    const valid = validate(
      catalogWithRecognitions({
        customerStories: [{ title: 'National pilot', url: 'https://example.com/story' }],
        awardsAndRecognitions: [{ title: 'Global Digital Trust Award 2026' }],
      }),
    );
    assert.equal(valid, true, JSON.stringify(validate.errors));
  });

  it('rejects free-form certifications in organization recognitions', () => {
    const valid = validate(
      catalogWithRecognitions({
        certifications: [{ title: 'Free-form certificate' }],
      }),
    );
    assert.equal(valid, false);
  });

  it('requires at least one supported recognition item', () => {
    assert.equal(validate(catalogWithRecognitions({})), false);
    assert.equal(validate(catalogWithRecognitions({ customerStories: [] })), false);
  });
});
