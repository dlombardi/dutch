import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Expense } from './expense.entity';

@Entity('expense_splits')
@Unique(['expenseId', 'userId'])
export class ExpenseSplit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  expenseId: string;

  @Column()
  userId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  shares?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage?: number;

  // Relations
  @ManyToOne(() => Expense, (expense) => expense.splits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expenseId' })
  expense: Expense;

  @ManyToOne(() => User, (user) => user.expenseSplits)
  @JoinColumn({ name: 'userId' })
  user: User;
}
