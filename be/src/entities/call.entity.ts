import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Contact } from './contact.entity';

export type CallStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'no_answer';

@Entity('calls')
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  contactId: string;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contactId' })
  contact: Contact;

  @Column({
    type: 'enum',
    enum: ['queued', 'in_progress', 'completed', 'failed', 'no_answer'],
    default: 'queued'
  })
  status: CallStatus;

  @Column({ type: 'text', nullable: true })
  outcome: string;

  @Column({ type: 'text', nullable: true })
  transcript: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'json', nullable: true })
  structuredOutput: any;

  @Column({ type: 'text', nullable: true })
  agentPrompt: string;

  @Column({ type: 'text', nullable: true })
  callGoals: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}