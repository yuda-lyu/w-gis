import getBox from './src/getBox.mjs'


let pgs
let r

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
    [0, 0], //閉合
]
r = getBox(pgs)
console.log(JSON.stringify(r))
// => {"xmin":0,"ymin":0,"xmax":100,"ymax":1}

pgs = [ //ringString
    [0, 0],
    [100, 0],
    [100, 1],
    [0, 1],
]
r = getBox(pgs)
console.log(JSON.stringify(r))
// => {"xmin":0,"ymin":0,"xmax":100,"ymax":1}

pgs = [ //polygon
    [
        [0, 0],
        [100, 0],
        [100, 1],
        [0, 1],
    ]
]
r = getBox(pgs)
console.log(JSON.stringify(r))
// => {"xmin":0,"ymin":0,"xmax":100,"ymax":1}

pgs = [ //polygon
    [
        [0, 0],
        [10, 0],
        [10, 1],
        [0, 1],
    ]
]
r = getBox(pgs)
console.log(JSON.stringify(r))
// => {"xmin":0,"ymin":0,"xmax":10,"ymax":1}

pgs = [ //polygon
    [
        [0, 0],
        [100, 0],
        [100, 1],
        [0, 1],
    ],
    [
        [0, 0],
        [10, 0],
        [10, 1],
        [0, 1],
    ]
]
r = getBox(pgs)
console.log(JSON.stringify(r))
// => {"xmin":0,"ymin":0,"xmax":100,"ymax":1}

pgs = [ //multiPolygon
    [
        [
            [0, 0],
            [100, 0],
            [100, 1],
            [0, 1],
        ],
        [
            [0, 0],
            [10, 0],
            [10, 1],
            [0, 1],
        ],
        [
            [0, 0],
            [-10, 0],
            [-10, 123],
            [0, 1],
        ]
    ]
]
r = getBox(pgs)
console.log(JSON.stringify(r))
// => {"xmin":-10,"ymin":0,"xmax":100,"ymax":123}


//node g_getBox.mjs
