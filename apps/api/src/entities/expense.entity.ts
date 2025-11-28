import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Group } from './group.entity';
import { ExpenseSplit } from './expense-split.entity';

export enum SplitType {
  EQUAL = 'equal',
  EXACT = 'exact',
  PERCENTAGE = 'percentage',
  SHARES = 'shares',
}

export enum ExpenseCategory {
  FOOD = 'food',
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation',
  ACTIVITY = 'activity',
  SHOPPING = 'shopping',
  OTHER = 'other',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
    default: ExpenseCategory.OTHER,
  })
  category: ExpenseCategory;

  @Column()
  paidById: string;

  @Column({
    type: 'enum',
    enum: SplitType,
    default: SplitType.EQUAL,
  })
  splitType: SplitType;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column()
  createdById: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  exchangeRate?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Group, (group) => group.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @ManyToOne(() => User, (user) => user.paidExpenses)
  @JoinColumn({ name: 'paidById' })
  paidBy: User;

  @ManyToOne(() => User, (user) => user.createdExpenses)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @OneToMany(() => ExpenseSplit, (split) => split.expense)
  splits: ExpenseSplit[];
}
