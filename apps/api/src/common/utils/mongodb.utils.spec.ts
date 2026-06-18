import { isValidMongoDbId, validateMongoDbId } from './mongodb.utils';
import { BadRequestException } from '@nestjs/common';

describe('mongodb utils', () => {
  it('isValidMongoDbId returns true for valid id', () => {
    expect(isValidMongoDbId('507f1f77bcf86cd799439011')).toBe(true);
  });

  it('isValidMongoDbId returns false for invalid id', () => {
    expect(isValidMongoDbId('invalid')).toBe(false);
  });

  it('validateMongoDbId does not throw for valid id', () => {
    expect(() => validateMongoDbId('507f1f77bcf86cd799439011')).not.toThrow();
  });

  it('validateMongoDbId throws for invalid id', () => {
    expect(() => validateMongoDbId('bad')).toThrow(BadRequestException);
  });
});
