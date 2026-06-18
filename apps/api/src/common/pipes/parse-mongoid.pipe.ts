import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { isValidMongoDbId } from '../utils/mongodb.utils';

@Injectable()
export class ParseMongoIdPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const val = String(value);
    const name = metadata.data || 'id';
    if (!isValidMongoDbId(val)) {
      throw new BadRequestException(
        `Invalid ${name}: "${val}". Must be a valid 24-character MongoDB ObjectID.`,
      );
    }
    return val;
  }
}
