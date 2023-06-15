


export function writeLine(content:string){
    process.stdout.write(content + '\n');
}

export function replaceLine(content:string, lineCount:number=1) {
    clearLine(lineCount);
    writeLine(content);
}

export function clearLine(count:number = 1){
    if (count <= 0) return;
    for (let linesCleared = 0; linesCleared < count; linesCleared++) {
        const y = linesCleared === 0 ? 0 : -1;
        process.stdout.moveCursor(0, y);
        process.stdout.clearLine(1);
    }
    process.stdout.cursorTo(0)
}