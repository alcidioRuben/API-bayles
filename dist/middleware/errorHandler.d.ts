import { Request, Response, NextFunction } from 'express';
import { Boom } from '@hapi/boom';
import { ApiError } from '../Types/api';
export declare const errorHandler: (error: Error | ApiError | Boom, req: Request, res: Response, next: NextFunction) => void;
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const createApiError: (message: string, statusCode?: number, code?: string, details?: any) => ApiError;
export declare const notFoundHandler: (req: Request, res: Response) => void;
export declare const handleWhatsAppError: (error: any) => ApiError;
