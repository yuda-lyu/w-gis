import findPointInKpFeature from './src/findPointInKpFeature.mjs'


let p
let b

let kpFt = {
    ft1: {
        'type': 'Feature',
        'properties': {
            'name': 'pgs1',
        },
        'geometry': {
            'type': 'MultiPolygon',
            'coordinates': [
                [
                    [
                        [0, 0],
                        [0, 1],
                        [1, 1],
                        [1, 0],
                        [0, 0],
                    ]
                ]
            ]
        }
    },
    ft2: {
        'type': 'Feature',
        'properties': {
            'name': 'pgs2',
        },
        'geometry': {
            'type': 'MultiPolygon',
            'coordinates': [
                [
                    [
                        [1, 1],
                        [1, 2],
                        [2, 2],
                        [2, 1],
                        [1, 1],
                    ]
                ]
            ]
        }
    },
}

p = [0.5, 0.5]
b = findPointInKpFeature(p, kpFt)
console.log(b)
// => 'ft1'

p = [1.5, 1.5]
b = findPointInKpFeature(p, kpFt)
console.log(b)
// => 'ft2'

p = [2.5, 2.5]
b = findPointInKpFeature(p, kpFt)
console.log(b)
// => 'unknow'

p = [0.5, 0.5]
kpFt = {
    'ft1': [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
    ],
}
b = findPointInKpFeature(p, kpFt)
console.log(b)
// => 'unknow'

p = [0.5, 0.5]
kpFt = {
    'ft1': [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
    ],
}
b = findPointInKpFeature(p, kpFt, { def: '未知' })
console.log(b)
// => '未知'


//node g_findPointInKpFeature.mjs
