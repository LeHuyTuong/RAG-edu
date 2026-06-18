import { ResponseDto } from './response.dto';

describe('ResponseDto', () => {
  it('sets fields and defaults data to null when omitted', () => {
    const dto = new ResponseDto(true, 200, 'ok');
    expect(dto.success).toBe(true);
    expect(dto.status_code).toBe(200);
    expect(dto.message).toBe('ok');
    expect(dto.data).toBeNull();
  });

  it('accepts data when provided', () => {
    const dto = new ResponseDto(false, 400, 'err', { a: 1 });
    expect(dto.data).toEqual({ a: 1 });
  });
});
