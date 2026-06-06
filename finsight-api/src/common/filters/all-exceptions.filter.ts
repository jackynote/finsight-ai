import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<{ url?: string; originalUrl?: string }>();

    const httpStatus = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const response = exception instanceof HttpException ? this.normalizeHttpExceptionResponse(exception) : 'Internal server error';
    const message = typeof response === 'string' ? response : (response.message ?? 'Internal server error');
    const path = request.originalUrl ?? request.url ?? '';

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path,
      message,
    };

    this.logger.error(`Exception: ${JSON.stringify(responseBody)}`, exception instanceof Error ? exception.stack : '');

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  private normalizeHttpExceptionResponse(exception: HttpException): string | { message?: string } {
    const response = exception.getResponse() as string | { message?: string };
    return response;
  }
}
