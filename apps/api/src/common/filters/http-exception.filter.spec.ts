import { HttpExceptionFilter } from './http-exception.filter';
import { BadRequestException, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { ResponseDto } from '../dtos/response.dto';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  function mockHost() {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res: Partial<Response> = { status } as any;
    const ctx: any = { switchToHttp: () => ({ getResponse: () => res }) };
    return { ctx, status, json, res };
  }

  it('handles HttpException with string response', () => {
    const { ctx, status, json } = mockHost();
    const ex = new HttpException('bad', 400);

    filter.catch(ex, ctx as any);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(new ResponseDto(false, 400, 'bad', null));
  });

  it('handles HttpException with array message', () => {
    const { ctx, status, json } = mockHost();
    const ex = new BadRequestException(['a', 'b']);

    filter.catch(ex, ctx as any);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      new ResponseDto(false, 400, 'a, b', null),
    );
  });

  it('handles HttpException with object message string', () => {
    const { ctx, status, json } = mockHost();
    const ex = new BadRequestException({ message: 'oops' } as any);

    filter.catch(ex, ctx as any);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      new ResponseDto(false, 400, 'oops', null),
    );
  });

  it('handles non-http exception as internal error', () => {
    const { ctx, status, json } = mockHost();
    const ex = new Error('boom');

    filter.catch(ex, ctx as any);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      new ResponseDto(false, 500, 'Internal server error', null),
    );
  });
});
