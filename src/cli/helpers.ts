import { readdir } from "fs/promises";
import { join } from "path";

export async function findAllFiles(parentDirAbsPath:string) {
	const files:Array<string> = [];
	const items = await readdir(parentDirAbsPath, {withFileTypes: true, encoding: "utf-8"});
	for (let item of items){
		const itemPath = join( parentDirAbsPath, item.name );
		if (item.isDirectory() === false) {
			files.push(itemPath);
		} else {
			const innerFiles = await findAllFiles(itemPath)
			files.push(...innerFiles);
		}
	}
	return files;
}


// regexp is based on https://github.com/sindresorhus/escape-string-regexp
const reHasRegExp = /[|\\{}()[\]^$+*?.-]/
const reReplaceRegExp = /[|\\{}()[\]^$+*?.-]/g

export function escapeStringRegexp(str: string) {
	// see also: https://github.com/lodash/lodash/blob/2da024c3b4f9947a48517639de7560457cd4ec6c/escapeRegExp.js#L23
	if (reHasRegExp.test(str)) {
		return str.replace(reReplaceRegExp, '\\$&')
	}
	return str
}

export function stripTrailingSlash(route: string) {
	return route.replace(/\/$/, '') || '/'
}
