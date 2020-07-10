interface Options {
    workspace: string;
    srcDir?: string;
    onlyTemplate?: boolean;
}
export declare function check(options: Options): Promise<void>;
export {};
