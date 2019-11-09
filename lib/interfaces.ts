import { ColumnOptions, Column } from 'typeorm';
import { validateKey } from './helpers';
import { getCiphers } from 'crypto';

export interface EncryptedJsonColumnOptions extends ColumnOptions {
  encrypt: EncryptionOptions;
  matching: RegExp[];
}

export interface EncryptionOptions {
  key: string;
  algorithm: string;
  ivLength: number;
  looseMatching?: boolean;
}

export const EncryptedJsonColumn = (options: EncryptedJsonColumnOptions) => {
  if (getCiphers().indexOf(options.encrypt.algorithm) < 0) {
    throw new Error('Invalid Algorithm');
  }

  if (!validateKey(options.encrypt.key, options.encrypt.algorithm)) {
    throw new Error('Invalid Key');
  }

  if (!options.type) {
    options.type = 'varchar';
    options.nullable = false;
  }

  return Column(options);
};
