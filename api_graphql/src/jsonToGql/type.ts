export interface JsonInput {
  enums: Enums;
  registries: Registries;
  transactions: Transactions;
  queries: QueriesSchema;
  concepts: Concepts;
}

export type Registries = Record<string, Registry>;
export type Transactions = Record<string, Transaction>;
export type QueriesSchema = Record<string, QueryContent>;
export type Enums = Record<string, string[]>;
export type Concepts = Record<string, Property>;

export interface Transaction {
  description: string;
  registry: string;
  output: Property[];
  input: Property;
}

export interface Registry {
  description?: string;
  destination?: string;
  key?: [Property];
  schema: Schema;
}

export interface QueryContent {
  description: string;
  registry: string;
  output: Property[];
  input: Property; // Record<string, Property>
  query: Query;
}

export interface Schema {
  title: string;
  type: 'object';
  subtype?: SubType;
  default?: any; //
  additionalProperties?: boolean;
  // in case of complex objects (array, object, map, ...)
  properties?: Record<string, Property>;
  item?: Property;
}

export interface Property {
  type: AvailableType;
  subtype?: SubType;
  optional?: boolean;
  default?: any;
  resource?: string;
  // in case of complex objects (array, object, map, ...)
  properties?: Record<string, Property>;
  item?: Property;
  // ifor key properties
  name?: string;
}

export type AvailableType = 'string' | 'number' | 'object' | 'boolean';
export type SubType = 'ref' | 'enum' | 'array' | 'map' | 'concept' | 'registry';

export interface Query {
  selector: Record<string, unknown>;
  sort?: Record<string, 'desc' | 'asc'>;
  use_index?: string;
}
