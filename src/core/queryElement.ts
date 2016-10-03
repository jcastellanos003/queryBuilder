class Position {
    public end: number
    constructor(public start: number, end: number) {
        this.end = start + end;
    }
}

export class QueryElement {
    public position: Position;
    constructor(public term: string, public type: number, public text: string, public propType: string, public previousLength: number, public nextTerms: Array<string>) {
        this.position = new Position(previousLength + 1, text.length);
    }
}