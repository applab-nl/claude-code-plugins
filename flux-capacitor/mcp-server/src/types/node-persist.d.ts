/**
 * Type declarations for node-persist
 * Since @types/node-persist doesn't exist, we provide minimal types here
 */

declare module 'node-persist' {
  interface InitOptions {
    dir?: string;
    stringify?: (value: any) => string;
    parse?: (value: string) => any;
    encoding?: string;
    expiredInterval?: number;
  }

  interface NodePersist {
    init(options?: InitOptions): Promise<void>;
    setItem(key: string, value: any): Promise<void>;
    getItem(key: string): Promise<any>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    values(): Promise<any[]>;
    length(): Promise<number>;
  }

  const storage: NodePersist;
  export default storage;
}
