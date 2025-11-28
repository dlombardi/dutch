import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { GroupMember } from './group-member.entity';
import { Expense } from './expense.entity';
import { ExpenseSplit } from './expense-split.entity';
import { Settlement } from './settlement.entity';

export enum AuthProvider {
  MAGIC_LINK = 'magic_link',
  GOOGLE = 'google',
  APPLE = 'apple',
  GUEST = 'guest',
}

export enum UserType {
  GUEST = 'guest',
  CLAIMED = 'claimed',
  FULL = 'full',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  email?: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.GUEST,
  })
  authProvider: AuthProvider;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.GUEST,
  })
  type: UserType;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ nullable: true })
  deviceId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => GroupMember, (member) => member.user)
  groupMemberships: GroupMember[];

  @OneToMany(() => Expense, (expense) => expense.paidBy)
  paidExpenses: Expense[];

  @OneToMany(() => Expense, (expense) => expense.createdBy)
  createdExpenses: Expense[];

  @OneToMany(() => ExpenseSplit, (split) => split.user)
  expenseSplits: ExpenseSplit[];

  @OneToMany(() => Settlement, (settlement) => settlement.fromUser)
  settlementsFrom: Settlement[];

  @OneToMany(() => Settlement, (settlement) => settlement.toUser)
  settlementsTo: Settlement[];
}
