import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../Types/api';
declare module '../Types/api' {
    interface AuthenticatedRequest {
        startTime?: number;
    }
}
export declare const authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const adminMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const sessionMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const responseMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const createRateLimit: (windowMs: number, max: number) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export type { AuthenticatedRequest };
