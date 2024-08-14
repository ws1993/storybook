import { describe, expect, it } from 'vitest';

import { generateModernIframeScriptCodeFromPreviews } from './codegen-modern-iframe-script';

const projectRoot = 'projectRoot';

describe('generateModernIframeScriptCodeFromPreviews', () => {
  it('handle one annotation', async () => {
    const result = await generateModernIframeScriptCodeFromPreviews({
      previewAnnotations: ['/user/previewAnnotations'],
      projectRoot,
      frameworkName: 'frameworkName',
    });
    expect(result).toMatchSnapshot();
  });
  it('handle multiple annotations', async () => {
    const result = await generateModernIframeScriptCodeFromPreviews({
      previewAnnotations: ['/user/previewAnnotations1', '/user/previewAnnotations2'],
      projectRoot,
      frameworkName: 'frameworkName',
    });
    expect(result).toMatchSnapshot();
  });
});
