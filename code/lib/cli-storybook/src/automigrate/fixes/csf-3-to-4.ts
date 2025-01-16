/* eslint-disable no-underscore-dangle */
import { types as t } from 'storybook/internal/babel';
import { isValidPreviewPath, loadCsf, printCsf } from 'storybook/internal/csf-tools';

import prompts from 'prompts';

import type { FileInfo } from '../codemod';
import { runCodemod } from '../codemod';
import type { CommandFix } from '../types';

export async function csf4Transform(info: FileInfo) {
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

  const sbConfigImportName = hasRootLevelConfig ? 'storybookConfig' : 'config';

  const sbConfigImportSpecifier = t.importSpecifier(
    t.identifier('config'),
    t.identifier(sbConfigImportName)
  );

  programNode.body.forEach((node) => {
    if (t.isImportDeclaration(node) && isValidPreviewPath(node.source.value)) {
      const hasConfigSpecifier = node.specifiers.some(
        (specifier) =>
          t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported, { name: 'config' })
      );

      if (!hasConfigSpecifier) {
        node.specifiers.push(sbConfigImportSpecifier);
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
      [sbConfigImportSpecifier],
      t.stringLiteral('#.storybook/preview')
    );
    programNode.body.unshift(configImport);
  }

  // Remove type imports – now inferred – from @storybook/* packages
  const disallowlist = [
    'Story',
    'StoryFn',
    'StoryObj',
    'Meta',
    'MetaObj',
    'ComponentStory',
    'ComponentMeta',
  ];

  programNode.body = programNode.body.filter((node) => {
    if (t.isImportDeclaration(node)) {
      const { source, specifiers } = node;

      if (source.value.startsWith('@storybook/')) {
        const allowedSpecifiers = specifiers.filter((specifier) => {
          if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported)) {
            return !disallowlist.includes(specifier.imported.name);
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
  });

  let output = printCsf(csf).code;

  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const prettier = await import('prettier');
    output = await prettier.format(output, {
      ...(await prettier.resolveConfig(info.path)),
      filepath: info.path,
    });
  } catch (e) {}
  return output;
}

const logger = console;

export const csf3to4: CommandFix = {
  id: 'csf-3-to-4',
  promptType: 'command',
  async run({ dryRun }) {
    logger.log('Please enter the glob for your stories to migrate');
    const { glob: globString } = await prompts({
      type: 'text',
      name: 'glob',
      message: 'glob',
      initial: '**/*.stories.*',
    });

    await runCodemod(globString, csf4Transform, { dryRun });
  },
};
