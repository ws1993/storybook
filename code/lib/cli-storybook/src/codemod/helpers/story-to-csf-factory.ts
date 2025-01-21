/* eslint-disable no-underscore-dangle */
import { types as t } from 'storybook/internal/babel';
import { isValidPreviewPath, loadCsf, printCsf } from 'storybook/internal/csf-tools';

import type { FileInfo } from '../../automigrate/codemod';
import { logger } from '../csf-factories';
import { cleanupTypeImports } from './csf-factories-utils';

export async function storyToCsfFactory(info: FileInfo) {
  const csf = loadCsf(info.source, { makeTitle: () => 'FIXME' });
  try {
    csf.parse();
  } catch (err) {
    logger.log(`Error when parsing ${info.path}, skipping:\n${err}`);
    return info.source;
  }

  const metaVariableName = 'meta';

  /**
   * Add the preview import if it doesn't exist yet:
   *
   * `import { config } from '#.storybook/preview'`;
   */
  const programNode = csf._ast.program;
  let foundConfigImport = false;

  // Check if a root-level constant named 'config' exists
  const hasRootLevelConfig = programNode.body.some(
    (n) =>
      t.isVariableDeclaration(n) &&
      n.declarations.some((declaration) => t.isIdentifier(declaration.id, { name: 'config' }))
  );

  let sbConfigImportName = hasRootLevelConfig ? 'storybookConfig' : 'config';

  const sbConfigImportSpecifier = t.importDefaultSpecifier(t.identifier(sbConfigImportName));

  programNode.body.forEach((node) => {
    if (t.isImportDeclaration(node) && isValidPreviewPath(node.source.value)) {
      const defaultImportSpecifier = node.specifiers.find((specifier) =>
        t.isImportDefaultSpecifier(specifier)
      );

      if (!defaultImportSpecifier) {
        node.specifiers.push(sbConfigImportSpecifier);
      } else if (defaultImportSpecifier.local.name !== sbConfigImportName) {
        sbConfigImportName = defaultImportSpecifier.local.name;
      }

      foundConfigImport = true;
    }
  });

  const hasMeta = !!csf._meta;

  Object.entries(csf._storyExports).forEach(([key, decl]) => {
    const id = decl.id;
    const declarator = decl as t.VariableDeclarator;
    let init = t.isVariableDeclarator(declarator) ? declarator.init : undefined;

    if (t.isIdentifier(id) && init) {
      if (t.isTSSatisfiesExpression(init) || t.isTSAsExpression(init)) {
        init = init.expression;
      }

      if (t.isObjectExpression(init)) {
        const typeAnnotation = id.typeAnnotation;
        // Remove type annotation as it's now inferred
        if (typeAnnotation) {
          id.typeAnnotation = null;
        }

        // Wrap the object in `meta.story()`
        declarator.init = t.callExpression(
          t.memberExpression(t.identifier(metaVariableName), t.identifier('story')),
          [init]
        );
      } else if (t.isArrowFunctionExpression(init)) {
        // Transform CSF1 to meta.story({ render: <originalFn> })
        const renderProperty = t.objectProperty(t.identifier('render'), init);

        const objectExpression = t.objectExpression([renderProperty]);

        declarator.init = t.callExpression(
          t.memberExpression(t.identifier(metaVariableName), t.identifier('story')),
          [objectExpression]
        );
      }
    }
  });

  // modify meta
  if (csf._metaPath) {
    let declaration = csf._metaPath.node.declaration;
    if (t.isTSSatisfiesExpression(declaration) || t.isTSAsExpression(declaration)) {
      declaration = declaration.expression;
    }

    if (t.isObjectExpression(declaration)) {
      const metaVariable = t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier(metaVariableName),
          t.callExpression(
            t.memberExpression(t.identifier(sbConfigImportName), t.identifier('meta')),
            [declaration]
          )
        ),
      ]);
      csf._metaPath.replaceWith(metaVariable);
    } else if (t.isIdentifier(declaration)) {
      /**
       * Transform const declared metas:
       *
       * `const meta = {}; export default meta;`
       *
       * Into a meta call:
       *
       * `const meta = config.meta({ title: 'A' });`
       */
      const binding = csf._metaPath.scope.getBinding(declaration.name);
      if (binding && binding.path.isVariableDeclarator()) {
        const originalName = declaration.name;

        // Always rename the meta variable to 'meta'
        binding.path.node.id = t.identifier(metaVariableName);

        let init = binding.path.node.init;
        if (t.isTSSatisfiesExpression(init) || t.isTSAsExpression(init)) {
          init = init.expression;
        }
        if (t.isObjectExpression(init)) {
          binding.path.node.init = t.callExpression(
            t.memberExpression(t.identifier(sbConfigImportName), t.identifier('meta')),
            [init]
          );
        }

        // Update all references to the original name
        csf._metaPath.scope.rename(originalName, metaVariableName);
      }

      // Remove the default export, it's not needed anymore
      csf._metaPath.remove();
    }
  }

  if (hasMeta && !foundConfigImport) {
    const configImport = t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier(sbConfigImportName))],
      t.stringLiteral('#.storybook/preview')
    );
    programNode.body.unshift(configImport);
  }

  // Remove type imports – now inferred – from @storybook/* packages
  const disallowList = [
    'Story',
    'StoryFn',
    'StoryObj',
    'Meta',
    'MetaObj',
    'ComponentStory',
    'ComponentMeta',
  ];
  programNode.body = cleanupTypeImports(programNode, disallowList);

  // Remove unused type aliases e.g. `type Story = StoryObj<typeof meta>;`
  programNode.body.forEach((node, index) => {
    if (t.isTSTypeAliasDeclaration(node)) {
      const isUsed = programNode.body.some((otherNode) => {
        if (t.isVariableDeclaration(otherNode)) {
          return otherNode.declarations.some(
            (declaration) =>
              t.isIdentifier(declaration.init) && declaration.init.name === node.id.name
          );
        }
        return false;
      });

      if (!isUsed) {
        programNode.body.splice(index, 1);
      }
    }
  });

  return printCsf(csf).code;
}
