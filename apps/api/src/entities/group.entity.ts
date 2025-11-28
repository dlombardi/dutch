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
import { Settlement } from './settlement.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: '💰' })
  emoji: string;

  @Column({ default: 'USD' })
  defaultCurrency: string;

  @Column({ unique: true })
  inviteCode: string;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => GroupMember, (member) => member.group)
  members: GroupMember[];

  @OneToMany(() => Expense, (expense) => expense.group)
  expenses: Expense[];

  @OneToMany(() => Settlement, (settlement) => settlement.group)
  settlements: Settlement[];
}
