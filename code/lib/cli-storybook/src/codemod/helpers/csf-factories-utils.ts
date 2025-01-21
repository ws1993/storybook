import { types as t } from 'storybook/internal/babel';

export function cleanupTypeImports(programNode: t.Program, disallowList: string[]) {
  return programNode.body.filter((node) => {
    if (t.isImportDeclaration(node)) {
      const { source, specifiers } = node;

      if (source.value.startsWith('@storybook/')) {
        const allowedSpecifiers = specifiers.filter((specifier) => {
          if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported)) {
            return !disallowList.includes(specifier.imported.name);
          }
          // Retain non-specifier imports (e.g., namespace imports)
          return true;
        });

        // Remove the entire import if no specifiers are left
        if (allowedSpecifiers.length > 0) {
          node.specifiers = allowedSpecifiers;
          return true;
        }

        // Remove the import if no specifiers remain
        return false;
      }
    }

    // Retain all other nodes
    return true;
    // @TODO adding any for now, unsure how to fix the following error:
    // error TS4058: Return type of exported function has or is using name 'BlockStatement' from external module "/code/core/dist/babel/index" but cannot be named
  }) as any;
}
