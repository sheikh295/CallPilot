import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  // Virtual property for formatted phone number
  get formattedPhoneNumber(): string {
    // Basic US phone number formatting
    const cleaned = this.phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return this.phoneNumber;
  }
}