/* eslint-disable no-underscore-dangle */
import { isValidPreviewPath, loadCsf } from '@storybook/core/csf-tools';

import type { BabelFile } from '@babel/core';
import * as babel from '@babel/core';
import {
  isIdentifier,
  isImportDeclaration,
  isImportSpecifier,
  isObjectExpression,
  isTSAsExpression,
  isTSSatisfiesExpression,
  isVariableDeclaration,
} from '@babel/types';
import type { FileInfo } from 'jscodeshift';

export default async function transform(info: FileInfo) {
  const csf = loadCsf(info.source, { makeTitle: (title) => title });
  const fileNode = csf._ast;
  // @ts-expect-error File is not yet exposed, see https://github.com/babel/babel/issues/11350#issuecomment-644118606
  const file: BabelFile = new babel.File(
    { filename: info.path },
    { code: info.source, ast: fileNode }
  );

  const metaVariableName = 'meta';

  /**
   * Add the preview import if it doesn't exist yet:
   *
   * `import { config } from '#.storybook/preview'`;
   */
  const programNode = fileNode.program;
  let foundConfigImport = false;

  programNode.body.forEach((node) => {
    if (isImportDeclaration(node) && isValidPreviewPath(node.source.value)) {
      const hasConfigSpecifier = node.specifiers.some(
        (specifier) =>
          isImportSpecifier(specifier) && isIdentifier(specifier.imported, { name: 'config' })
      );

      if (!hasConfigSpecifier) {
        node.specifiers.push(
          babel.types.importSpecifier(
            babel.types.identifier('config'),
            babel.types.identifier('config')
          )
        );
      }

      foundConfigImport = true;
    }
  });

  if (!foundConfigImport) {
    const configImport = babel.types.importDeclaration(
      [
        babel.types.importSpecifier(
          babel.types.identifier('config'),
          babel.types.identifier('config')
        ),
      ],
      babel.types.stringLiteral('#.storybook/preview')
    );
    programNode.body.unshift(configImport);
  }

  file.path.traverse({
    // Meta export
    ExportDefaultDeclaration: (path) => {
      const declaration = path.node.declaration;

      /**
       * Transform inline default export: `export default { title: 'A' };`
       *
       * Into a meta call: `const meta = config.meta({ title: 'A' });`
       */
      if (isObjectExpression(declaration)) {
        const metaVariable = babel.types.variableDeclaration('const', [
          babel.types.variableDeclarator(
            babel.types.identifier(metaVariableName),
            babel.types.callExpression(
              babel.types.memberExpression(
                babel.types.identifier('config'),
                babel.types.identifier('meta')
              ),
              [declaration]
            )
          ),
        ]);

        path.replaceWith(metaVariable);
      } else if (isIdentifier(declaration)) {
        /**
         * Transform const declared metas:
         *
         * `const meta = {}; export default meta;`
         *
         * Into a meta call:
         *
         * `const meta = config.meta({ title: 'A' });`
         */
        const binding = path.scope.getBinding(declaration.name);
        if (binding && binding.path.isVariableDeclarator()) {
          const originalName = declaration.name;

          // Always rename the meta variable to 'meta'
          binding.path.node.id = babel.types.identifier(metaVariableName);

          let init = binding.path.node.init;
          if (isTSSatisfiesExpression(init) || isTSAsExpression(init)) {
            init = init.expression;
          }
          if (isObjectExpression(init)) {
            binding.path.node.init = babel.types.callExpression(
              babel.types.memberExpression(
                babel.types.identifier('config'),
                babel.types.identifier('meta')
              ),
              [init]
            );
          }

          // Update all references to the original name
          path.scope.rename(originalName, metaVariableName);
        }

        // Remove the default export, it's not needed anymore
        path.remove();
      }
    },
    // Story export
    ExportNamedDeclaration: (path) => {
      const declaration = path.node.declaration;

      if (!declaration || !isVariableDeclaration(declaration)) {
        return;
      }

      declaration.declarations.forEach((decl) => {
        const id = decl.id;
        let init = decl.init;

        if (isIdentifier(id) && init) {
          if (isTSSatisfiesExpression(init) || isTSAsExpression(init)) {
            init = init.expression;
          }

          if (isObjectExpression(init)) {
            const typeAnnotation = id.typeAnnotation;
            // Remove type annotation as it's now inferred
            if (typeAnnotation) {
              id.typeAnnotation = null;
            }

            // Wrap the object in `meta.story()`
            decl.init = babel.types.callExpression(
              babel.types.memberExpression(
                babel.types.identifier(metaVariableName),
                babel.types.identifier('story')
              ),
              [init]
            );
          }
        }
      });
    },
  });

  // Generate the transformed code
  const { code } = babel.transformFromAstSync(fileNode, info.source, {
    parserOpts: { sourceType: 'module' },
  });
  return code;
}
