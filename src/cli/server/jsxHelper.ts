
export function parseJSX(jsx:string) {
    return JSON.parse(jsx, (_key, value) => {
        if (value === "$RE") {
            return Symbol.for("react.element");
        } else if (typeof value === "string" && value.startsWith("$$")) {
            return value.slice(1);
        } else {
            return value;
        }
    });
}

export function stringifyJSX(jsx:any) {
    return JSON.stringify(jsx, (_key, value) => {
        if (value === Symbol.for("react.element")) {
            return "$RE";
        } else if (typeof value === "string" && value.startsWith("$")) {
            return "$" + value;
        } else {
            return value;
        }
    });
}