import { ObjectLiteral, getMetadataArgsStorage } from 'typeorm';
import { EncryptedJsonColumnOptions, EncryptionOptions } from './interfaces';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

/**
 * For all columns that have encryption options run the supplied function.
 *
 * @param entity The typeorm Entity.
 * @param cb Function to run for matching columns.
 */
const forMatchingColumns = (
  entity: ObjectLiteral,
  cb: (propertyName: string, options: EncryptedJsonColumnOptions) => void,
) => {
  getMetadataArgsStorage().columns.forEach(column => {
    const { options, propertyName, mode, target } = column;
    const columnOptions = options as EncryptedJsonColumnOptions;
    if (
      columnOptions.encrypt &&
      mode === 'regular' &&
      (columnOptions.encrypt.looseMatching || entity.constructor === target)
    ) {
      if (entity[propertyName]) {
        cb(propertyName, columnOptions);
      }
    }
  });
};

/**
 * Checks the supplied entity for encrypted columns and encrypts any columns that need it.
 *
 * @param entity Typeorm Entity to check.
 */
export const encrypt = <T extends ObjectLiteral>(entity: T): T => {
  if (!entity) {
    return entity;
  }

  forMatchingColumns(entity, (propertyName, options) => {
    const entityObj: any = entity;
    entityObj[propertyName] = encryptJsonString(entity[propertyName], options);
  });

  return entity;
};

/**
 * Encrypts the supplied Json string with the columns options.
 *
 * @param value The any to encrypt.
 * @param options The encryption options.
 */
const encryptJsonString = (
  value: string,
  options: EncryptedJsonColumnOptions,
) => {
  if (!value) {
    return value;
  }

  const jsonValue = JSON.parse(value);
  const encrytedValue = encryptObject(jsonValue, options);

  return JSON.stringify(encrytedValue);
};

/**
 * Encrypts the supplied object with the columns options.
 *
 * @param value The any to encrypt.
 * @param options The encryption options.
 */
const encryptObject = (data, options: EncryptedJsonColumnOptions) => {
  if (objectUtil.isLeafAndNonEncryptable(data)) {
    return data;
  }

  if (objectUtil.isString(data)) {
      return encryptString(data, options.encrypt);
  }

  if (objectUtil.isArray(data)) {
    return data.map(clear => encryptObject(clear, options));
  }

  try {
    JSON.stringify(data);
  } catch (_) {
    return data;
  }

  const dataResult = {...data};
  for (const key of Object.keys(dataResult)) {
    const isPropertyToEncryt = options.matching.some(x => x.test(key));
    const value = data[key];
    if (objectUtil.isString(value) && isPropertyToEncryt) {
      dataResult[key] = encryptObject(dataResult[key], options);
    } else if (!objectUtil.isString(value)) {
      dataResult[key] = encryptObject(dataResult[key], options);
    }
  }

  return dataResult;
};

/**
 * Encrypts the supplied string with the columns options.
 *
 * @param value The string to encrypt.
 * @param options The encryption options.
 */
const encryptString = (value: string, options: EncryptionOptions) => {
  const buffer = Buffer.from(value, 'utf8');
  const iv = randomBytes(options.ivLength);
  const key = Buffer.from(options.key, 'hex');

  const cipher = createCipheriv(options.algorithm, key, iv);
  const start = cipher.update(buffer);
  const end = cipher.final();

  const dataEncrypt = Buffer.concat([iv, start, end]).toString('base64');

  return dataEncrypt;
};

/**
 * Checks the supplied entity for columns that need decrypting and decrypts them.
 *
 * @param entity The typeorm entity to check
 */
export const decrypt = (entity: ObjectLiteral) => {
  if (!entity) {
    return entity;
  }

  forMatchingColumns(entity, (propertyName, options) => {
    entity[propertyName] = decryptJsonString(entity[propertyName], options);
  });

  return entity;
};

/**
 * Decrypts the supplied Json string with the columns options.
 *
 * @param value The any to encrypt.
 * @param options The encryption options.
 */
const decryptJsonString = (
  value: string,
  options: EncryptedJsonColumnOptions,
) => {
  if (!value) {
    return value;
  }

  return JSON.stringify(decryptObject(JSON.parse(value), options));
};

/**
 * Encrypts the supplied object with the columns options.
 *
 * @param value The any to encrypt.
 * @param options The encryption options.
 */
const decryptObject = (data: any, options: EncryptedJsonColumnOptions) => {
  if (objectUtil.isLeafAndNonEncryptable(data)) {
    return data;
  }

  if (objectUtil.isString(data)) {
    return decryptString(data, options.encrypt);
  }

  if (objectUtil.isArray(data)) {
    return data.map(clear => decryptObject(clear, options));
  }

  try {
    JSON.stringify(data);
  } catch (_) {
    return data;
  }

  const dataResult = {...data};
  for (const key of Object.keys(dataResult)) {
    const isPropertyToEncryt = options.matching.some(x => x.test(key));
    const value = data[key];
    if (objectUtil.isString(value) && isPropertyToEncryt) {
      dataResult[key] = decryptObject(dataResult[key], options);
    } else if (!objectUtil.isString(value)) {
      dataResult[key] = decryptObject(dataResult[key], options);
    }
  }

  return dataResult;
};

/**
 * Decrypts the supplied string using the column options.
 *
 * @param value The string to decrypt,
 * @param options The encryption options.
 */
const decryptString = (value: string, options: EncryptionOptions) => {
  const buffer = Buffer.from(value, 'base64');
  const iv = buffer.slice(0, options.ivLength);
  const key = Buffer.from(options.key, 'hex');

  const decipher = createDecipheriv(options.algorithm, key, iv);
  const start = decipher.update(buffer.slice(options.ivLength));
  const end = decipher.final();

  return Buffer.concat([start, end]).toString('utf8');
};

/**
 * Utility class for check kind of data.
 */
const objectUtil = {
  isFunction: x => typeof x === 'function',
  isNumber: x => typeof x === 'number',
  isBoolean: x => x === false || x === true,
  isString: x => typeof x === 'string' || x instanceof String,
  isLeafAndNonEncryptable: x =>
    !x ||
    objectUtil.isFunction(x) ||
    objectUtil.isNumber(x) ||
    objectUtil.isBoolean(x),
  isArray: x => Array.isArray(x),
};
