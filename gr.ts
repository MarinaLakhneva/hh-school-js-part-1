export interface GraphMap {
    [key: string]: {
        [key: string]: number;
    };
}

export class Graph {
    private map: GraphMap;

    constructor(map: GraphMap) {
        this.map = map;
    }

    private extractKeys(obj: object): string[] {
        const keys: string[] = [];
        let key: string;
        for (key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                keys.push(key);
            }
        }
        return keys;
    }

    private sorter(a: string, b: string): number {
        return parseFloat(a) - parseFloat(b);
    }

    private findPaths(
        start: string,
        end: string,
        infinity: number = Infinity
    ): { [key: string]: string } | null {
        const costs: { [key: string]: number } = {};
        const open: { [key: string]: string[] } = { 0: [start] };
        const predecessors: { [key: string]: string } = {};
        let keys: string[];

        const addToOpen = function (cost: number, vertex: string) {
            const key = `${cost}`;
            if (!open[key]) {
                open[key] = [];
            }
            open[key].push(vertex);
        };

        costs[start] = 0;

        while (open) {
            if (!(keys = this.extractKeys(open)).length) {
                break;
            }

            keys.sort(this.sorter);

            const key = keys[0];
            const bucket = open[key];
            const node = bucket.shift();
            const currentCost = parseFloat(key);
            const adjacentNodes = this.map[node] || {};

            if (!bucket.length) {
                delete open[key];
            }

            for (const vertex in adjacentNodes) {
                if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
                    const cost = adjacentNodes[vertex];
                    const totalCost = cost + currentCost;
                    const vertexCost = costs[vertex];

                    if (vertexCost === undefined || vertexCost > totalCost) {
                        costs[vertex] = totalCost;
                        addToOpen(totalCost, vertex);
                        predecessors[vertex] = node;
                    }
                }
            }
        }

        if (costs[end] === undefined) {
            return null;
        }
        return predecessors;
    }

    private extractShortest(predecessors: { [key: string]: string }, end: string): string[] {
        const nodes: string[] = [];
        let u = end;

        while (u !== undefined) {
            nodes.push(u);
            u = predecessors[u];
        }

        nodes.reverse();
        return nodes;
    }

    public findShortestPath(...nodes: string[]): string[] | null {
        let start = nodes.shift();
        let end: string;
        let predecessors: { [key: string]: string };
        const path: string[] = [];
        let shortest: string[];

        while (nodes.length) {
            end = nodes.shift();
            predecessors = this.findPaths(start, end);

            if (predecessors) {
                shortest = this.extractShortest(predecessors, end);
                if (nodes.length) {
                    path.push(...shortest.slice(0, -1));
                } else {
                    return path.concat(shortest);
                }
            } else {
                return null;
            }

            start = end;
        }
    }
}
