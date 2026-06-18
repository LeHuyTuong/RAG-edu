import { ParseMongoIdPipe } from './parse-mongoid.pipe';
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';

describe('ParseMongoIdPipe', () => {
  const pipe = new ParseMongoIdPipe();

  it('returns value when valid 24-char hex string', () => {
    const metadata: ArgumentMetadata = {
      type: 'param',
      metatype: String,
      data: 'id',
    };
    const val = '507f1f77bcf86cd799439011';
    expect(pipe.transform(val, metadata)).toBe(val);
  });

  it('throws BadRequestException for invalid id', () => {
    const metadata: ArgumentMetadata = {
      type: 'param',
      metatype: String,
      data: 'accountId',
    };
    const bad = 'invalid-id';
    expect(() => pipe.transform(bad, metadata)).toThrow(BadRequestException);
  });
});
