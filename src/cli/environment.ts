import { bundleRequire } from "bundle-require";
import { existsSync } from "fs";
import { isAbsolute, resolve } from "path";
import { ApplicationError } from "./errors";


type Environments = "dev" | "prod" | "test" | string;

type ConfigEnvironments = Record<Environments, {
    port?: number,
    ssl?: boolean
}>;

type TestConfigs = {}

export type FullConfig = {
    appSource?: string,
    environments?: ConfigEnvironments,
    testing?: TestConfigs
}

export type Config = {
    appSource: string,
    testing: TestConfigs
} & ConfigEnvironments[string]

export async function getConfig(envName:string){
    const currentDirectory = process.cwd();
    
    let configPath = resolve( currentDirectory, '.config/serve.config.ts' );

    if ( !existsSync(configPath) ) {
        configPath = resolve( currentDirectory, 'serve.config.ts' );
    }

    if ( !existsSync(configPath) ) {
        throw ApplicationError(`No config files found in ${currentDirectory}`);
    }

    const { mod } = await bundleRequire({
        filepath: configPath
    });

    const config:Config = (mod.default ?? mod.config ?? mod);

    if (!config) throw ApplicationError(`Configuration invalid in ${configPath}`);

    const defaultConfig:DeepRequired<FullConfig> = {
        appSource: "./",
        environments: {
            prod: {
                port: 443,
                ssl: true,
            },
            dev: {
                port: 8084,
                ssl: false,
            },
            test: {
                port: 8084,
                ssl: false
            }
        },
        testing: {}
    }

    const {environments, ...mergedConfig} = Object.assign(defaultConfig, config);

    if ( !isAbsolute(mergedConfig.appSource!) ) mergedConfig.appSource = resolve( process.cwd(), mergedConfig.appSource );

    if (!environments || !environments[envName]) throw ApplicationError(`No config found for environment named "${envName}"`);

    return {
        ...mergedConfig,
        ...environments?.[envName]
    } as Config
    
}

export function getEnv(){
    const env = process.env.NODE_ENV?.toLowerCase() ?? "prod";

    switch (env){
        case "production":
        case "prod":
            return "prod";
        case "development":
        case "dev":
            return "dev"
        case "testing":
        case "test":
            return "test";
        default:
            return env;
    }
}