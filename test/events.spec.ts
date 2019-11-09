import { Entity, createConnection, PrimaryGeneratedColumn } from 'typeorm';
import { SubscriberJsonEncrypt, EncryptedJsonColumn } from '../lib/index';
import { encrypt, decrypt } from '../lib/events';
import 'reflect-metadata';

const regex = [/secret/];
const jsonTest = '{"secret":"test"}';

@Entity()
class TestEvents {
  @PrimaryGeneratedColumn()
  id: number;

  @EncryptedJsonColumn({
    encrypt: {
      key: 'd85117047fd06d3afa79b6e44ee3a52eb426fc24c3a2e3667732e8da0342b4da',
      algorithm: 'aes-256-cbc',
      ivLength: 16,
    },
    matching: regex
  })
  secret: string;
}

beforeAll(async () => {
  await createConnection({
    type: 'sqljs',
    entities: [TestEvents],
    subscribers: [SubscriberJsonEncrypt],
  });
});

test('encrypt should encrypt an entity', () => {
  const entity = new TestEvents();
  entity.secret = jsonTest;

  const newEntity = encrypt(entity);

  expect(newEntity.secret).not.toBe(jsonTest);
});

test('decrypt should decrypt an entity', () => {
  const entity = new TestEvents();
  entity.secret = jsonTest;

  const newEntity = encrypt(entity);

  expect(newEntity.secret).not.toBe(jsonTest);

  const decryptedEntity = decrypt(newEntity);

  expect(decryptedEntity.secret).toBe(jsonTest);
});
