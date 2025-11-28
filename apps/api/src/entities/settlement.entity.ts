import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Group } from './group.entity';

export enum SettlementMethod {
  CASH = 'cash',
  VENMO = 'venmo',
  PAYPAL = 'paypal',
  ZELLE = 'zelle',
  BANK_TRANSFER = 'bank_transfer',
  OTHER = 'other',
}

@Entity('settlements')
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @Column()
  fromUserId: string;

  @Column()
  toUserId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({
    type: 'enum',
    enum: SettlementMethod,
    default: SettlementMethod.OTHER,
  })
  method: SettlementMethod;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  settledAt: Date;

  // Relations
  @ManyToOne(() => Group, (group) => group.settlements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @ManyToOne(() => User, (user) => user.settlementsFrom)
  @JoinColumn({ name: 'fromUserId' })
  fromUser: User;

  @ManyToOne(() => User, (user) => user.settlementsTo)
  @JoinColumn({ name: 'toUserId' })
  toUser: User;
}
