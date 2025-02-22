import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

interface ComponentAnalysis {
  id: string;
  name: string;
  location: string;
  description: string;
  path: string[];
  steps: string[];
  elements: Record<string, string>;
}

function analyzeComponent(content: string, filePath: string): ComponentAnalysis | null {
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx']
  });

  const analysis: ComponentAnalysis = {
    id: path.basename(filePath, '.tsx').toLowerCase(),
    name: '',
    location: '',
    description: '',
    path: [],
    steps: [],
    elements: {}
  };

  traverse(ast, {
    // Find component name
    ExportDefaultFunction(path) {
      analysis.name = path.node.id?.name || '';
    },

    // Find UI elements
    JSXElement(path) {
      const element = path.node.openingElement;
      if (element.name.type === 'JSXIdentifier') {
        const name = element.name.name;
        if (['Button', 'TextInput', 'List.Item'].includes(name)) {
          const title = element.attributes.find(attr => 
            attr.type === 'JSXAttribute' && attr.name.name === 'title'
          );
          const onPress = element.attributes.find(attr => 
            attr.type === 'JSXAttribute' && attr.name.name === 'onPress'
          );
          if (title && onPress) {
            analysis.elements[title.value.value] = `Interactive ${name}`;
          }
        }
      }
    },

    // Find navigation
    CallExpression(path) {
      if (path.node.callee.type === 'MemberExpression' &&
          path.node.callee.object.name === 'router') {
        analysis.path.push(path.node.arguments[0].value);
      }
    }
  });

  return analysis;
}

function generateAppStructure() {
  const appDir = path.join(process.cwd(), 'app');
  const features: ComponentAnalysis[] = [];

  function scanDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const analysis = analyzeComponent(content, fullPath);
        if (analysis) features.push(analysis);
      }
    }
  }

  scanDirectory(appDir);

  // Generate appStructure.ts
  const output = `
// Auto-generated app structure - DO NOT EDIT MANUALLY
export interface AppFeature {
  id: string;
  name: string;
  location: string;
  description: string;
  path: string[];
  steps: string[];
  elements: Record<string, string>;
}

export const APP_FEATURES: AppFeature[] = ${JSON.stringify(features, null, 2)};

export function getFeatureInstructions(query: string): AppFeature | undefined {
  const normalizedQuery = query.toLowerCase();
  return APP_FEATURES.find(feature => 
    feature.name.toLowerCase().includes(normalizedQuery) ||
    feature.description.toLowerCase().includes(normalizedQuery)
  );
}

export function getFeaturesByLocation(location: string): AppFeature[] {
  return APP_FEATURES.filter(feature => 
    feature.location.toLowerCase().includes(location.toLowerCase())
  );
}
`;

  fs.writeFileSync(
    path.join(appDir, '(app)', 'api', 'appStructure.ts'),
    output
  );
}

generateAppStructure(); 