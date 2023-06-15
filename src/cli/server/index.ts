import http from "http";
import { serve } from "micro";
import { getConfig } from "../environment";
import { writeLine } from "../terminal";
import chalk from "chalk";
import { findAllFiles } from "../helpers";
import { join } from "path";
import { existsSync } from "fs";
import { ApplicationError } from "../errors";
import { Context } from "../../sdk";
import { getRouteFromFilePath } from "../routes";
import { StatusCodes } from "http-status-codes";
import { isEndpoint, isPage, matchFile } from "./utils";
import { handleEndpoint, handlePage, handlePublicAssets, handleResource } from "./handlers";
import { readFile } from "fs/promises";
import mime from "mime";

type ServerOptions = {
    env?: "prod" | "dev" | "test" | string
}

export default async function startServer(options:ServerOptions){
    const config = await getConfig(options.env ?? "prod");

    writeLine(chalk.white(`Starting ${options.env ?? "prod"} server...`));
    writeLine(chalk.gray('Source: ') + chalk.dim(config.appSource));
    writeLine(chalk.gray('Port: ') + chalk.dim(config.port));

    const projectRoot = join(config.appSource , 'routes');

    if (!existsSync(projectRoot)) throw ApplicationError(`Routes folder is missing. This was expected to be found in ${config.appSource}`);

    const filesInProject = await findAllFiles( projectRoot );
    const routeFiles = filesInProject.filter(path => isEndpoint(path) || isPage(path));

    const server = new http.Server(
        serve(async (req, res) => {
            const path = req.url!.split("?").at(0) ?? "/";

            const matches = matchFile(path, {
                files: routeFiles,
                projectDir: projectRoot
            });

            const handlerFilePath = matches.at(0);
            const route = getRouteFromFilePath(handlerFilePath, projectRoot);
            const context = new Context(req, res, route);

            if (matches.length === 0 || !handlerFilePath){
                await handleResource(context);

                if (context.hasSent) return;

                await handlePublicAssets(projectRoot, context);

                if (context.hasSent) return;
                
                context.notFound();
                return;
            }

            if (isEndpoint(handlerFilePath)){
                await handleEndpoint(handlerFilePath, context);
            } else {
                await handlePage(handlerFilePath, context);
            }

            if (context.hasSent) return;

            context.send('No response', { statusCode: StatusCodes.NO_CONTENT });
        })
    );

    server.listen(config.port, () => {
        writeLine(chalk.white(`Server up and running on port ${config.port}`) + chalk.greenBright("•"));
        if (options.env === "dev"){
            writeLine(chalk.gray(`Running on http://localhost:${config.port}`));
        }
    });

    process.on('SIGINT', function() {
        writeLine('');
        writeLine(chalk.gray(`Shutting down ${options.env ?? "prod"} server...`));
        server.closeAllConnections();
        server.close(() => {
            writeLine(chalk.white(`Server on port ${config.port} has shut down`) + chalk.gray("•"));
            process.exit();
        });
    });

}