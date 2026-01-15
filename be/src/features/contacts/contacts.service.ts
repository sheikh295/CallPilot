import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../../entities/contact.entity';
import { LoggerService } from '../../services/logger/logger.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';
import * as Papa from 'papaparse';
import { validate } from 'class-validator';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly logger: LoggerService,
  ) {}

  async create(createContactDto: CreateContactDto, userId: string): Promise<Contact> {
    try {
      const contact = this.contactRepository.create({
        ...createContactDto,
        phoneNumber: this.normalizePhoneNumber(createContactDto.phoneNumber),
      });

      const savedContact = await this.contactRepository.save(contact);

      await this.logger.info('Contact created successfully', {
        contactId: savedContact.id,
        contactName: savedContact.name,
        userId,
      });

      return savedContact;
    } catch (error) {
      await this.logger.error('Failed to create contact', {
        error: error.message,
        userId,
        contactData: createContactDto,
      });
      throw error;
    }
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ contacts: Contact[]; total: number; page: number; limit: number }> {
    try {
      // Cap the limit at 100
      const maxLimit = 100;
      const actualLimit = Math.min(limit, maxLimit);

      const queryBuilder = this.contactRepository.createQueryBuilder('contact');

      // Add search functionality
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        queryBuilder.where(
          '(contact.name ILIKE :search OR contact.phoneNumber ILIKE :search)',
          { search: searchTerm }
        );
      }

      const [contacts, total] = await queryBuilder
        .orderBy('contact.createdAt', 'DESC')
        .skip((page - 1) * actualLimit)
        .take(actualLimit)
        .getManyAndCount();

      await this.logger.info('Contacts retrieved successfully', {
        userId,
        totalContacts: total,
        page,
        limit: actualLimit,
        search: search || null,
      });

      return {
        contacts,
        total,
        page,
        limit: actualLimit,
      };
    } catch (error) {
      await this.logger.error('Failed to retrieve contacts', {
        error: error.message,
        userId,
        page,
        limit,
        search,
      });
      throw error;
    }
  }

  async findOne(id: string, userId: string): Promise<Contact> {
    try {
      const contact = await this.contactRepository.findOne({ where: { id } });

      if (!contact) {
        await this.logger.warn('Contact not found', {
          contactId: id,
          userId,
        });
        throw new NotFoundException('Contact not found');
      }

      await this.logger.info('Contact retrieved successfully', {
        contactId: id,
        contactName: contact.name,
        userId,
      });

      return contact;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        await this.logger.error('Failed to retrieve contact', {
          error: error.message,
          contactId: id,
          userId,
        });
      }
      throw error;
    }
  }

  async update(id: string, updateContactDto: UpdateContactDto, userId: string): Promise<Contact> {
    try {
      const contact = await this.findOne(id, userId);

      // Normalize phone number if provided
      if (updateContactDto.phoneNumber) {
        updateContactDto.phoneNumber = this.normalizePhoneNumber(updateContactDto.phoneNumber);
      }

      Object.assign(contact, updateContactDto);
      const updatedContact = await this.contactRepository.save(contact);

      await this.logger.info('Contact updated successfully', {
        contactId: id,
        contactName: updatedContact.name,
        userId,
        updatedFields: Object.keys(updateContactDto),
      });

      return updatedContact;
    } catch (error) {
      await this.logger.error('Failed to update contact', {
        error: error.message,
        contactId: id,
        userId,
        updateData: updateContactDto,
      });
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const contact = await this.findOne(id, userId);

      await this.contactRepository.remove(contact);

      await this.logger.info('Contact deleted successfully', {
        contactId: id,
        contactName: contact.name,
        userId,
      });
    } catch (error) {
      await this.logger.error('Failed to delete contact', {
        error: error.message,
        contactId: id,
        userId,
      });
      throw error;
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Contact | null> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    return this.contactRepository.findOne({
      where: { phoneNumber: normalizedPhone },
    });
  }

  async bulkCreate(csvContent: string, userId: string): Promise<{ successCount: number; errors: { row: number; error: string }[] }> {
    try {
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
      });

      if (parseResult.errors.length > 0) {
        throw new Error(`CSV parsing error: ${parseResult.errors.map(e => e.message).join(', ')}`);
      }

      const rows = parseResult.data as any[];
      const errors: { row: number; error: string }[] = [];
      let successCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because header is row 1, data starts at row 2

        const dto = new CreateContactDto();
        dto.name = row.Name?.trim();
        dto.phoneNumber = row.PhoneNumber?.trim();

        if (!dto.name || !dto.phoneNumber) {
          errors.push({ row: rowNumber, error: 'Name and PhoneNumber are required' });
          continue;
        }

        // Normalize phone number
        dto.phoneNumber = this.normalizePhoneNumber(dto.phoneNumber);

        // Validate
        const validationErrors = await validate(dto);
        if (validationErrors.length > 0) {
          const errorMessages = validationErrors.map(err => `${err.property}: ${Object.values(err.constraints || {}).join(', ')}`);
          errors.push({ row: rowNumber, error: errorMessages.join('; ') });
          continue;
        }

        try {
          await this.create(dto, userId);
          successCount++;
        } catch (error) {
          errors.push({ row: rowNumber, error: `Database error: ${error.message}` });
        }
      }

      await this.logger.info('Bulk contact insertion completed', {
        userId,
        totalRows: rows.length,
        successCount,
        errorCount: errors.length,
      });

      return { successCount, errors };
    } catch (error) {
      await this.logger.error('Failed to perform bulk contact insertion', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Normalize phone number to E.164 format for Vapi compatibility
   * Preserves the + prefix if present, or adds +1 for US numbers
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all whitespace
    let normalized = phoneNumber.trim();

    // If it already starts with +, keep it and remove other non-digit/+ characters
    if (normalized.startsWith('+')) {
      // Keep the +, remove everything except digits after it
      return '+' + normalized.substring(1).replace(/\D/g, '');
    }

    // If it doesn't start with +, remove all non-digits
    const digitsOnly = normalized.replace(/\D/g, '');

    // If it's 10 digits (US number without country code), add +1
    if (digitsOnly.length === 10) {
      return '+1' + digitsOnly;
    }

    // If it's 11 digits and starts with 1 (US number with country code but no +), add +
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return '+' + digitsOnly;
    }

    // For any other case, just return with + prefix
    return '+' + digitsOnly;
  }
}