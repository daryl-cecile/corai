#!/usr/bin/env node

import { Command } from "commander";
import {name, version} from "./../../package.json";
import startServer from "./server";
import { getEnv } from "./environment";

const Program = new Command();

Program
	.name(name)
	.description("Simple Server Framework")
	.version(version);


Program
	.command("dev")
    .description("Start the Local Server")
	.action(async () => {
		return startServer({
            env: "dev"
        });
	});

Program
	.command("start")
    .description("Start the Server")
	.action(async () => {
		return startServer({
            env: getEnv()
        });
	});

void Program.parseAsync();