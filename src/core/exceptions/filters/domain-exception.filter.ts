import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { DomainException } from '../domain-exception.js';
import { Request, Response } from 'express';
import { DomainExceptionCode } from '../domain-exception-codes.js';

export type BadRequestError = {
  errorsMessages: Array<{ field: string; message: string }>;
};

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const code = this.mapToHttpStatus(exception.code);
    const responceBoby = this.buildResponseBody(exception);

    response.status(code).send(responceBoby);
  }

  private mapToHttpStatus(code: DomainExceptionCode): number {
    switch (code) {
      // case DomainExceptionCode.BadRequest:
      case DomainExceptionCode.ValidationError:
        // case DomainExceptionCode.ConfirmationCodeExpired:
        // case DomainExceptionCode.EmailNotConfirmed:
        // case DomainExceptionCode.PasswordRecoveryCodeExpired:
        return HttpStatus.BAD_REQUEST;
      // case DomainExceptionCode.Forbidden:
      //   return HttpStatus.FORBIDDEN;
      // case DomainExceptionCode.NotFound:
      //   return HttpStatus.NOT_FOUND;
      // case DomainExceptionCode.Unauthorized:
      //   return HttpStatus.UNAUTHORIZED;
      // case DomainExceptionCode.InternalServerError:
      //   return HttpStatus.INTERNAL_SERVER_ERROR;
      default:
        return HttpStatus.I_AM_A_TEAPOT;
    }
  }

  private buildResponseBody(exception: DomainException) {
    if (exception.code === DomainExceptionCode.ValidationError) {
      return {
        errorsMessages: exception.extensions.map((extention) => ({
          field: extention.key,
          message: extention.message,
        })),
      } satisfies BadRequestError;
    }
  }
}
