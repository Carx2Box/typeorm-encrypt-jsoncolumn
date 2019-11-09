import { Entity, PrimaryGeneratedColumn, createConnection } from 'typeorm';
import { EncryptedJsonColumn } from './interfaces';
import { SubscriberJsonEncrypt } from './subscriber';

const regex = [/secret/];

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
}

async function TestComponent() {
  const connection = await createConnection({
    type: 'sqljs',
    entities: [Test],
    subscribers: [SubscriberJsonEncrypt],
    synchronize: true,
  });

  const entity = new Test();
  entity.secret = '{"secret": "testing", "node": { "secret": "testing2" }}';

  const repository = connection.getRepository(Test);
  await repository.save(entity);

  console.log('Entity save' , entity);

  const result = await repository.find({ select: ['id', 'secret'] });

  console.log('Entity get', result);

  if (entity.secret !== '{secret: "testing"}') {
    throw new Error('Error codde');
  }
}

TestComponent();
