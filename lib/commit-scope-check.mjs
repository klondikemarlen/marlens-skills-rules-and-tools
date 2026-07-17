const CATEGORY_ORDER = [
  'application code',
  'tests',
  'documentation',
  'migrations',
  'developer tooling',
  'configuration',
];

const CATEGORY_LABELS = {
  'application code': 'Application code',
  tests: 'Tests',
  documentation: 'Documentation',
  migrations: 'Migrations',
  'developer tooling': 'Developer tooling',
  configuration: 'Configuration',
};

function normalizedPath(filePath) {
  return filePath.replaceAll('\\', '/').replace(/^\.\//, '');
}

function basename(filePath) {
  return normalizedPath(filePath).split('/').at(-1).toLowerCase();
}

function hasSegment(filePath, segment) {
  return normalizedPath(filePath).split('/').includes(segment);
}

function isDocumentation(filePath) {
  const name = basename(filePath);

  return normalizedPath(filePath).startsWith('docs/')
    || /\.(md|mdx|rst|adoc)$/u.test(name)
    || /^(readme|changelog|contributing|license)(\..+)?$/u.test(name);
}

function isMigration(filePath) {
  return normalizedPath(filePath).split('/').some((segment) => /^(migrations?|migrate)$/u.test(segment));
}

function isTest(filePath) {
  const path = normalizedPath(filePath);
  const name = basename(filePath);

  return path.startsWith('scripts/verify-')
    || hasSegment(filePath, 'test')
    || hasSegment(filePath, 'tests')
    || hasSegment(filePath, '__tests__')
    || /\.(test|spec)\.[^.]+$/u.test(name);
}

function isDeveloperTooling(filePath) {
  const path = normalizedPath(filePath);
  const name = basename(filePath);

  return /^(bin|scripts|tools|dev|\.github)\//u.test(path)
    || ['.tool-versions', 'gemfile', 'gemfile.lock', 'makefile', 'rakefile'].includes(name);
}

function isConfiguration(filePath) {
  const name = basename(filePath);

  return /^\.env(?:\..+)?$/u.test(name)
    || /(^|\.)config\.[^.]+$/u.test(name)
    || /^(package|tsconfig|jsconfig|vite|vitest|eslint|prettier|babel|webpack|jest)\.json$/u.test(name)
    || ['bun.lock', 'bun.lockb', 'cargo.lock', 'pdm.lock', 'poetry.lock', 'uv.lock', 'yarn.lock'].includes(name)
    || /\.(json|ya?ml|toml|ini|env)$/u.test(name);
}

export function classifyCommitPath(filePath) {
  if (isDocumentation(filePath)) return 'documentation';
  if (isMigration(filePath)) return 'migrations';
  if (isTest(filePath)) return 'tests';
  if (isDeveloperTooling(filePath)) return 'developer tooling';
  if (isConfiguration(filePath)) return 'configuration';

  return 'application code';
}

function pathsByCategory(paths) {
  const categories = new Map(CATEGORY_ORDER.map((category) => [category, []]));

  for (const filePath of paths) {
    categories.get(classifyCommitPath(filePath)).push(filePath);
  }

  return categories;
}

function boundary(categories, firstCategory, secondCategory) {
  const firstPaths = categories.get(firstCategory);
  const secondPaths = categories.get(secondCategory);

  if (firstPaths.length === 0 || secondPaths.length === 0) return null;

  return {
    categories: [firstCategory, secondCategory],
    paths: {
      [firstCategory]: firstPaths,
      [secondCategory]: secondPaths,
    },
  };
}

export function checkCommitScope(paths) {
  const categories = pathsByCategory(paths);
  const boundaries = [
    boundary(categories, 'application code', 'documentation'),
    boundary(categories, 'application code', 'migrations'),
    boundary(categories, 'application code', 'developer tooling'),
  ].filter(Boolean);

  const configurationPaths = categories.get('configuration');
  const nonConfigurationPaths = CATEGORY_ORDER
    .filter((category) => category !== 'configuration')
    .flatMap((category) => categories.get(category));

  if (configurationPaths.length > 0 && nonConfigurationPaths.length > 0) {
    boundaries.push({
      categories: ['configuration', 'non-configuration changes'],
      paths: {
        configuration: configurationPaths,
        'non-configuration changes': nonConfigurationPaths,
      },
    });
  }

  return { categories, boundaries };
}

export function formatCommitScopeFailures(boundaries) {
  const details = boundaries.flatMap(({ categories, paths }) => [
    `- ${categories.map((category) => CATEGORY_LABELS[category] ?? category).join(' and ')} must be separate:`,
    ...categories.flatMap((category) => paths[category].map((filePath) => `  - ${category}: ${filePath}`)),
  ]);

  return [
    'Mixed staged file categories detected.',
    ...details,
    'Split the listed paths into separate commits. Use --allow-mixed only with explicit user approval when the categories are genuinely inseparable.',
  ].join('\n');
}
