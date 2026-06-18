import { ResponseInterceptor } from './response.interceptor';
import { ResponseDto } from '../dtos/response.dto';
import { of } from 'rxjs';

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor();

  function mockContext(statusCode = 200) {
    return {
      switchToHttp: () => ({ getResponse: () => ({ statusCode }) }),
    } as any;
  }

  it('returns ResponseDto unchanged when already ResponseDto', (done) => {
    const dto = new ResponseDto(true, 200, 'ok', { a: 1 });
    const next: any = { handle: () => of(dto) };

    interceptor.intercept(mockContext(200), next).subscribe((res) => {
      expect(res).toBe(dto);
      done();
    });
  });

  it('wraps data with message properly', (done) => {
    const data = { message: 'Hello', data: { x: 1 } };
    const next: any = { handle: () => of(data) };

    interceptor.intercept(mockContext(200), next).subscribe((res) => {
      expect(res).toEqual(new ResponseDto(true, 200, 'Hello', { x: 1 }));
      done();
    });
  });

  it('wraps default data when no message', (done) => {
    const data = { value: 1 };
    const next: any = { handle: () => of(data) };

    interceptor.intercept(mockContext(200), next).subscribe((res) => {
      expect(res).toEqual(
        new ResponseDto(true, 200, 'Data retrieval successful', data),
      );
      done();
    });
  });

  it('returns failure ResponseDto when status >= 400 and message present', (done) => {
    const data = { message: 'Error occurred', data: null };
    const next: any = { handle: () => of(data) };

    interceptor.intercept(mockContext(500), next).subscribe((res) => {
      expect(res).toEqual(new ResponseDto(false, 500, 'Error occurred', null));
      done();
    });
  });
});
