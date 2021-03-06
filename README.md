# typeorm-encrypt-jsoncolumn

A typeorm extension for encrypt and decrypt json string column

## Install

npm i typeorm-encrypt-jsoncolumn --save

## Example

``` ts
import { Entity, PrimaryGeneratedColumn, createConnection } from 'typeorm';
import { EncryptedJsonColumn } from 'typeorm-encrypt-jsoncolumn';
import { SubscriberJsonEncrypt } from 'typeorm-encrypt-jsoncolumn';

const machingRegex = [/secret/];

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
    matching: machingRegex,
  })
  secret: string;
}

async function executeComponent() {
  const connection = await createConnection({
    type: 'sqljs',
    entities: [Test],
    subscribers: [SubscriberJsonEncrypt],
    synchronize: true,
  });

  const entity = new Test();
  entity.secret = '{"secret": "testing"}';

  const repository = connection.getRepository(Test);
  await repository.save(entity);

  const result = await repository.find({ select: ['id', 'secret'] });

  if (entity.secret !== '{secret: "testing"}') {
    throw new Error('Error codde');
  }
}

executeComponent();
