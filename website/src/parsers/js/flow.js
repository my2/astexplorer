import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from 'flow-parser/package.json';

const ID = 'flow';
export const defaultOptions = {
  esproposal_class_instance_fields: true,
  esproposal_class_static_fields: true,
  esproposal_decorators: true,
  esproposal_export_star_as: true,
  esproposal_optional_chaining: true,
  esproposal_nullish_coalescing: true,
  types: true,
};
export const parserSettingsConfiguration = {
  fields: [
    'esproposal_class_instance_fields',
    'esproposal_class_static_fields',
    'esproposal_decorators',
    'esproposal_export_star_as',
    'esproposal_optional_chaining',
    'esproposal_nullish_coalescing',
    'types',
  ],
};

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://flowtype.org/',
  locationProps: new Set(['range', 'loc']),

  loadParser(callback) {
    require(['flow-parser'], callback);
  },

  parse(flowParser, code, options) {
    return flowParser.parse(code, options);
  },

  getDefaultOptions() {
    return defaultOptions;
  },

  _getSettingsConfiguration() {
    return parserSettingsConfiguration;
  },
};
