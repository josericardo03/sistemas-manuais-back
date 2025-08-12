declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      username: string;
      role: string;
      permissions: string[];
    };
  }
}

declare module "multer" {
  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }

  export interface StorageEngine {
    _handleFile(req: any, file: any, callback: any): void;
    _removeFile(req: any, file: any, callback: any): void;
  }

  export interface DiskStorageOptions {
    destination?:
      | string
      | ((
          req: any,
          file: any,
          callback: (error: Error | null, destination: string) => void
        ) => void);
    filename?: (
      req: any,
      file: any,
      callback: (error: Error | null, filename: string) => void
    ) => void;
  }

  export function diskStorage(options: DiskStorageOptions): StorageEngine;
  export function memoryStorage(): StorageEngine;
  export function any(): any;
  export function single(fieldname: string): any;
  export function array(fieldname: string, maxCount?: number): any;
  export function fields(fields: any[]): any;
  export function none(): any;
}
