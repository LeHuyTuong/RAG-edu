import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dtos/response.dto';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        // Nếu đã là ResponseDto, trả về ngay
        if (data instanceof ResponseDto) {
          return data;
        }

        // Nếu data có message, trích xuất message và data
        if (data?.message && typeof data.message === 'string') {
          return new ResponseDto(
            statusCode < 400,
            statusCode,
            data.message,
            data.data || null,
          );
        }

        // Trường hợp mặc định
        return new ResponseDto(
          statusCode < 400,
          statusCode,
          'Data retrieval successful',
          data || null,
        );
      }),
    );
  }
}
