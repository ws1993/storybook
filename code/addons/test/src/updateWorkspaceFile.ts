import type { BabelFile } from 'storybook/internal/babel';

export const updateWorkspaceFile = (source: BabelFile['ast'], target: BabelFile['ast']) => {
  let updated = false;
  for (const sourceNode of source.program.body) {
    if (sourceNode.type === 'ImportDeclaration') {
      // Insert imports that don't already exist
      if (
        !target.program.body.some(
          (targetNode) =>
            targetNode.type === sourceNode.type &&
            targetNode.source.value === sourceNode.source.value &&
            targetNode.specifiers.some((s) => s.local.name === sourceNode.specifiers[0].local.name)
        )
      ) {
        const lastImport = target.program.body.findLastIndex((n) => n.type === 'ImportDeclaration');
        target.program.body.splice(lastImport + 1, 0, sourceNode);
      }
    } else if (sourceNode.type === 'VariableDeclaration') {
      // Copy over variable declarations, making sure they're inserted after any imports
      if (
        !target.program.body.some(
          (targetNode) =>
            targetNode.type === sourceNode.type &&
            targetNode.declarations.some(
              (d) =>
                'name' in d.id &&
                'name' in sourceNode.declarations[0].id &&
                d.id.name === sourceNode.declarations[0].id.name
            )
        )
      ) {
        const lastImport = target.program.body.findLastIndex((n) => n.type === 'ImportDeclaration');
        target.program.body.splice(lastImport + 1, 0, sourceNode);
      }
    } else if (sourceNode.type === 'ExportDefaultDeclaration') {
      // Merge workspace array, which is the default export on both sides but may or may not be
      // wrapped in a defineWorkspace call
      const exportDefault = target.program.body.find((n) => n.type === 'ExportDefaultDeclaration');
      if (
        exportDefault &&
        sourceNode.declaration.type === 'CallExpression' &&
        sourceNode.declaration.arguments.length > 0 &&
        sourceNode.declaration.arguments[0].type === 'ArrayExpression' &&
        sourceNode.declaration.arguments[0].elements.length > 0
      ) {
        const { elements } = sourceNode.declaration.arguments[0];
        if (exportDefault.declaration.type === 'ArrayExpression') {
          exportDefault.declaration.elements.push(...elements);
          updated = true;
        } else if (
          exportDefault.declaration.type === 'CallExpression' &&
          exportDefault.declaration.callee.type === 'Identifier' &&
          exportDefault.declaration.callee.name === 'defineWorkspace' &&
          exportDefault.declaration.arguments[0]?.type === 'ArrayExpression'
        ) {
          exportDefault.declaration.arguments[0].elements.push(...elements);
          updated = true;
        }
      }
    }
  }
  return updated;
};
