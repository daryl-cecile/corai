import { customAlphabet } from "nanoid";
import { escapeStringRegexp, stripTrailingSlash } from "./helpers";

export function parseRouteParameter(routeParamPattern:string) {
	const isDynamic = routeParamPattern.startsWith("[") && routeParamPattern.endsWith("]");
	if (isDynamic) routeParamPattern = routeParamPattern.slice(1, -1);
	const isOptional = routeParamPattern.startsWith("[") && routeParamPattern.endsWith("]");
	if (isOptional) routeParamPattern = routeParamPattern.slice(1, -1);
	const isGreedy = routeParamPattern.startsWith("...");
	if (isGreedy) routeParamPattern = routeParamPattern.slice(3);
	return {
		key: routeParamPattern,
		isOptional,
		isGreedy,
		isDynamic
	}
}

export function routeHasDynamicParts(route:string) {
	const segments = stripTrailingSlash(route).slice(1).split('/');
	return segments.some(part => parseRouteParameter(part).isDynamic);
}

interface Group {
	pos: number
	repeat: boolean
	optional: boolean
}

export function parseRoute(route:string) {
	const segments = stripTrailingSlash(route).slice(1).split('/');
	const groups: Record<string, Group> = {};
	const routeKeys: Record<string, string> = {};
	const generateRouteKey = createRouteKeyGenerator(12);
	let groupIndex = 1;

	return {
		regexPattern: segments.map(seg => {
			const {key, isDynamic, isOptional, isGreedy} = parseRouteParameter(seg);
			if (isDynamic){
				groups[key] = {
					pos: groupIndex++,
					repeat: isGreedy,
					optional: isOptional
				}
				return isGreedy ? (isOptional ? '(?:/(.+?))?' : '/(.+?)') : '/([^/]+?)';
			}
			else {
				return `/${escapeStringRegexp(seg)}`;
			}
		}).join(''),
		namedRegexPattern: segments.map(seg => {
			const {key, isDynamic, isOptional, isGreedy} = parseRouteParameter(seg);
			if (isDynamic) {
				const cleanedKey = generateRouteKey();
				routeKeys[cleanedKey] = key;
				return isGreedy ? (
					isOptional
						? `(?:/(?<${cleanedKey}>.+?))?`
						: `/(?<${cleanedKey}>.+?)`
				) : `/(?<${cleanedKey}>[^/]+?)`;
			}
			else {
				return `/${escapeStringRegexp(seg)}`
			}
		}).join(''),
		groups,
		routeKeys
	}
}

export function getRouteRegex(normalizedRoute:string){
	const {regexPattern, groups, namedRegexPattern, routeKeys} = parseRoute(normalizedRoute);
	return {
		re: new RegExp(`^${regexPattern}(?:/)?$`),
		namedRe: `^${namedRegexPattern}(?:/)?$`,
		groups,
		routeKeys
	}
}

export function createRouteKeyGenerator(size:number=12){
	const generate = customAlphabet("abcdefghijklmnopqrstuvwxyz");
	return () => generate(size)
}

export function extractRouteParams(route:string|undefined, path:string){
	if (!route) return {};
	
	const {namedRe, routeKeys} = getRouteRegex(route);
	const pattern = new RegExp(namedRe);
	const matchedParams = pattern.exec(path);

	let result:Record<string, any> = {};

	if (matchedParams?.groups){
		Object.entries(matchedParams.groups).forEach(([key, val]) => {
			if (routeKeys[key]) result[routeKeys[key] as string] = val;
			else result[key] = val;
		});
	}

	return result;
}

export function getRouteFromFilePath(fileAbsPath:string|undefined, rootDirAbsPath:string){
	if (!fileAbsPath) return undefined;
	const relativeFp = fileAbsPath.replace(rootDirAbsPath, '');
	return relativeFp.substring(0, relativeFp.lastIndexOf("/") + 1); // remove (endpoint|page).ts[x]
}