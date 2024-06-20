import {
  JsonInput,
  Registries,
  Property,
  Enums,
  Transactions,
  Concepts,
  QueriesSchema,
} from './type';

export class JsonToGql {
  constructor(private json: JsonInput) {}

  parse() {
    const content = [
      this.generateCustomScalar(),
      this.generateEnums(this.json.enums),
      this.generateRegistries(this.json.registries),
      this.generateQueries(this.json.queries, this.json.registries),
      this.generateMutations(this.json.transactions, this.json.registries),
      this.generateConcepts(this.json.concepts),
    ];
    return content.filter(Boolean).join('\n');
  }

  get queriesMeta() {
    const customQueriesMeta = Object.entries(this.json.queries).map(([key, content]) => {
      return { name: key, function: key, registry: content.registry };
    });
    const registryQueriesMeta = Object.keys(this.json.registries).map(key => {
      return { name: `readAsset_${key}`, function: 'readAsset', registry: key };
    });

    return [...registryQueriesMeta, ...customQueriesMeta];
  }

  get mutationsMeta() {
    const customMutationsMeta = Object.entries(this.json.transactions).map(([key, content]) => {
      return { name: key, function: key, registry: content.registry };
    });
    const registryMutationsMeta = Object.keys(this.json.registries).reduce(
      (acc, key) => {
        return [
          ...acc,
          { name: `createAsset_${key}`, function: 'createAsset', registry: key },
          { name: `updateAsset_${key}`, function: 'updateAsset', registry: key },
          { name: `deleteAsset_${key}`, function: 'deleteAsset', registry: key }
        ];
      },
      []
    );

    return [...registryMutationsMeta, ...customMutationsMeta];
  }

  generateRegistries(registries: Registries) {
    const types = Object.entries(registries).map(([key, registry]) =>
      this.generateType(key, registry.schema),
    );
    return types.join('\n');
  }

  generateEnums(enums: Enums) {
    const enumsStrings = Object.keys(enums).map((enumKey: string) => {
      let enumAsString = `enum ${enumKey} {\n`;
      const enumValues = enums[enumKey];

      enumValues.forEach((enumValue: string) => {
        enumAsString += `\t${enumValue}\n`;
      });

      enumAsString += '}';
      return enumAsString;
    });
    return enumsStrings.join('\n');
  }

  generateQueries(queries: QueriesSchema, registries: Registries): string {
    const queryType = 'type QueryOutput {\n\trecords: [JSON]\n\tfetched_records_count: Float\n\tbookmark: String\n}';
    const queriesStart = 'type Query {';

    const registryQueriesStrings = Object.keys(registries).map((registry: string) => {
      const keyProperties: Property[] = registries[registry].key || [];
      const paramsAsStr = [
        `id: String!`,
        ...keyProperties.map(keyItem => `${keyItem.name}: ${this.transformPrimitive(keyItem)}!`)
      ].join(', ');
      return `\treadAsset_${registry}(${paramsAsStr}): ${registry}`
    })

    const customQueriesStrings = Object.keys(queries).map((queryName: string) => {
      const queryPayload = queries[queryName].input.properties;
      const queryParams = Object.keys(queryPayload).map((propertyKey) => {
        return this.generateTypeStr(propertyKey, queryPayload[propertyKey]);
      });
      const paramsAsStr = queryParams.join(', ');
      // TODO create union of output types
      const outputAsStr = 'QueryOutput';
      return `\t${queryName}(${paramsAsStr}): ${outputAsStr}`;
    });

    const queriesEnd = '}';
    return [
      queryType,
      queriesStart,
      ...registryQueriesStrings,
      ...customQueriesStrings,
      queriesEnd
    ].join('\n');
  }

  generateMutations(mutations: Transactions, registries: Registries) {
    const mutationStart = 'type Mutation {';

    const registryMutationsStrings = Object.keys(registries).reduce(
      (acc, registry) => {
        const assetProperties = Object.keys(registries[registry].schema.properties).map(
          (propertyKey) => {
            const typeStr = this.generateTypeStr(
              propertyKey,
              registries[registry].schema.properties[propertyKey],
            );
            return typeStr;
          },
        );
        const key: Property[] = registries[registry].key || []
        const keyProperties = [
          `id: String!`,
          ...key.map((keyItem: Property) => `${keyItem.name}: ${this.transformPrimitive(keyItem)}!`)
        ];
        const propertiesAsStr = Array.from(new Set([...assetProperties, ...keyProperties])).join(', ');
        return [
          ...acc,
          `\tcreateAsset_${registry}(${propertiesAsStr}): ${registry}`,
          `\tupdateAsset_${registry}(${propertiesAsStr}): ${registry}`,
          `\tdeleteAsset_${registry}(${keyProperties.join(', ')}): ${registry}`,
        ];
      },
      []
    );

    const customMutationsStrings = Object.keys(mutations).map(
      (mutationName: string) => {
        const mutationSchema = mutations[mutationName];
        const mutationParams = Object.keys(mutationSchema.input.properties).map(
          (propertyKey) => {
            return this.generateTypeStr(
              propertyKey,
              mutationSchema.input.properties[propertyKey],
            );
          },
        );
        const paramsAsStr = mutationParams.join(', ');
        // TODO create union of output types
        const outputAsStr = '[JSON]';
        return `\t${mutationName}(${paramsAsStr}): ${outputAsStr}`;
      },
    );

    const mutationEnd = '}';

    return [mutationStart, ...registryMutationsStrings, ...customMutationsStrings, mutationEnd].join('\n');
  }

  generateConcepts(concepts: Concepts) {
    const conceptTypes = Object.entries(concepts).map(([key, concept]) =>
      this.generateType(key, concept),
    );
    return conceptTypes.join('\n');
  }

  private generateType(typeName: string, input: Property, resolveRef = true) {
    let typeAsString = `type ${typeName} {\n`;
    // generate all properties
    const propertiesStrings = Object.keys(input.properties).map(
      (propertyName) => {
        const property = input.properties[propertyName];
        return `\t${this.generateTypeStr(propertyName, property, resolveRef)}`;
      },
    );
    typeAsString += propertiesStrings.join('\n');
    typeAsString += '\n}';

    return typeAsString;
  }

  private generateTypeStr(
    propertyName: string,
    property: Property,
    resolveReferences = false,
  ): string {
    // let typeAsString = '';

    if (this.isPrimitive(property)) {
      const graphqlTypeName = this.transformPrimitive(property);
      const propertyLine = `${propertyName}: ${graphqlTypeName}${this.optionStr(
        property,
      )}`;
      if (resolveReferences) {
        const referencePropertyLine = this.generateReferenceProperty(
          propertyName,
          property,
        );
        return propertyLine + referencePropertyLine;
      }
      return propertyLine
    }

    if (this.isArrayProperty(property)) {
      const arrayType = this.isPrimitive(property.item)
        ? this.transformPrimitive(property.item)
        : this.generateNestedType(property.item);
      return `${propertyName}: [${arrayType}${this.optionStr(property)}]`;
    }

    const graphqlTypeName = this.generateNestedType(property);
    const propertyLine = `${propertyName}: ${graphqlTypeName}${this.optionStr(property)}`;
    return propertyLine;
  }

  // generateNestedType(property: Property): { graphqlTypeName: string; additionalNestedType: any; } {
  generateNestedType(property: Property): string {
    if(this.isPrimitive(property)) {
      return this.transformPrimitive(property);
    }
    return 'JSON';
  }

  generateReferenceProperty(propertyName: string, property: Property) {
    const addLinkedField =
      property?.subtype && property.subtype === 'ref' && property?.resource;
    if (addLinkedField) {
      const linkedPropertyName = `${propertyName}_resolved`;
      const linkedPropertyType = property.resource;

      const linkedPropertyLine = `${linkedPropertyName}: ${linkedPropertyType}${this.optionStr(
        property,
      )}`;
      return `\n\t${linkedPropertyLine}`;
    }
    return '';
  }

  optionStr(property: Property) {
    return property?.optional ? '' : '!';
  }

  private transformPrimitive(propertyField: Property) {
    if (propertyField?.subtype && propertyField.subtype === 'enum') {
      return propertyField.resource;
    }
    switch (propertyField.type) {
      case 'number':
        return 'Float';

      case 'string':
        return 'String';

      case 'boolean':
        return 'Boolean';

      default:
        throw new Error('unknow type');
    }
  }

  private isPrimitive(prop: Property) {
    return (
      prop.type === 'string' ||
      prop.type === 'number' ||
      prop.type === 'boolean'
    );
  }

  private isArrayProperty(prop: Property) {
    return prop.type === 'object' && prop?.subtype === 'array';
  }

  private generateCustomScalar() {
    return 'scalar JSON';
  }
}
