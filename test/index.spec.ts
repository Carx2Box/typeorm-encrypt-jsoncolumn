import {
  Entity,
  createConnection,
  PrimaryGeneratedColumn,
  getConnection,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { SubscriberJsonEncrypt, EncryptedJsonColumn } from '../lib/index';
import 'reflect-metadata';

const regex = [/secret/];
const jsonTest = '{"secret":"test"}';

@Entity()
class Test {
  @PrimaryGeneratedColumn()
  id: number;

  @EncryptedJsonColumn({
    type: 'varchar',
    nullable: false,
    encrypt: {
      key: 'd85117047fd06d3afa79b6e44ee3a52eb426fc24c3a2e3667732e8da0342b4da',
      algorithm: 'aes-256-cbc',
      ivLength: 16,
    },
    matching: regex,
  })
  secret: string;

  @ManyToMany(type => Second, entity => entity.parents, { cascade: true })
  @JoinTable()
  children: Second[];
}

// tslint:disable-next-line:max-classes-per-file
@Entity()
class Second {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(type => Test, test => test.children)
  parents: Test[];
}

beforeAll(async () => {
  await createConnection({
    type: 'sqljs',
    entities: [Test, Second],
    subscribers: [SubscriberJsonEncrypt],
    synchronize: true,
  });
});

test('It should encrypt data', async () => {
  const entity = new Test();
  entity.secret = jsonTest;

  const connection = getConnection();
  const repository = connection.getRepository(Test);

  await repository.save(entity);

  expect(entity.secret).not.toBe(jsonTest);
});

test('It should fetch encrypted data', async () => {
  const connection = getConnection();
  const repository = connection.getRepository(Test);

  const t = await repository.findOneOrFail();

  expect(t.secret).toBe(jsonTest);
});

test('it should update data', async () => {
  const connection = getConnection();
  const repository = connection.getRepository(Test);

  const t = await repository.findOneOrFail();

  expect(t.secret).toBe(jsonTest);

  t.secret = jsonTest;

  await repository.save(t);

  const u = await repository.findOneOrFail();

  expect(u.secret).toBe(jsonTest);
});

test('N:N relation should be saved', async () => {
  const connection = getConnection();
  const repository = connection.getRepository(Test);

  const t = await repository.findOneOrFail();

  t.children = [new Second(), new Second()];

  await repository.save(t);
});

test('N:N relation should be joined', async () => {
  const connection = getConnection();
  const repository = connection.getRepository(Test);

  const t = await repository.findOneOrFail({ relations: ['children'] });

  expect(t.children.length).toBe(2);
});
