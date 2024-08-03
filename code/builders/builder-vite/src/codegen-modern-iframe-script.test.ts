import { describe, it, expect } from 'vitest';
import { generateModernIframeScriptCodeFromPreviews } from './codegen-modern-iframe-script';

const projectRoot = 'projectRoot';

describe('generateModernIframeScriptCodeFromPreviews', () => {
  it('handle one annotation', async () => {
    const result = await generateModernIframeScriptCodeFromPreviews({
      previewAnnotations: ['previewAnnotations'],
      projectRoot,
      frameworkName: 'frameworkName',
    });
    expect(result).toMatchSnapshot();
  });
  it('handle multiple annotations', async () => {
    const result = await generateModernIframeScriptCodeFromPreviews({
      previewAnnotations: ['previewAnnotations1', 'previewAnnotations2'],
      projectRoot,
      frameworkName: 'frameworkName',
    });
    expect(result).toMatchSnapshot();
  });
});
