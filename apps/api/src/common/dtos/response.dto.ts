export class ResponseDto<T = any> {
  success: boolean;
  status_code: number;
  message: string;
  data?: T | null;

  constructor(
    success: boolean,
    status_code: number,
    message: string,
    data?: T | null,
  ) {
    this.success = success;
    this.status_code = status_code;
    this.message = message;
    this.data = data ?? null;
  }
}
