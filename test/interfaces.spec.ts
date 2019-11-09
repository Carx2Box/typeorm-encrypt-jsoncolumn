import { Entity } from 'typeorm';
import { EncryptedJsonColumn } from '../lib/interfaces';

const regex = [/secret/];
const jsonTest = '{"secret": "test"}';

test('It should throw an error when creating an invalid key', () => {
  expect(() => {
    @Entity()
    class TestCase {
      @EncryptedJsonColumn({
        encrypt: {
          key: 'foo',
          algorithm: 'aes-256-cbc',
          ivLength: 16,
        },
        matching: regex,
      })
      test: string;
    }

    const tc = new TestCase();
    tc.test = 'foo';
  }).toThrow('Invalid Key');
});

test('It should throw an error when creating an invalid key', () => {
  expect(() => {
    // tslint:disable-next-line:max-classes-per-file
    @Entity()
    class TestCase {
      @EncryptedJsonColumn({
        encrypt: {
          key: 'foo',
          algorithm: 'aes-256-bc',
          ivLength: 16,
        },
        matching: regex,
      })
      test: string;
    }

    const tc = new TestCase();
    tc.test = 'foo';
  }).toThrow('Invalid Algorithm');
});
