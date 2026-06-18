import { BadRequestException } from '@nestjs/common';

/**
 * Validates if a string is a valid MongoDB ObjectID
 * MongoDB ObjectIDs are 24-character hex strings
 */
export function isValidMongoDbId(id: string): boolean {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validates MongoDB ID and throws BadRequestException if invalid
 */
export function validateMongoDbId(id: string, fieldName: string = 'ID'): void {
  if (!isValidMongoDbId(id)) {
    throw new BadRequestException(
      `Invalid ${fieldName}: "${id}". Must be a valid 24-character MongoDB ObjectID.`,
    );
  }
}
