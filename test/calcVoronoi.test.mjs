import assert from 'assert'
import calcVoronoi from '../src/calcVoronoi.mjs'


describe(`calcVoronoi`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        ps: [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }],
        opt: {},
    }
    out[k] = {
        nodes: [
            { x: 492.2829390058606, y: 101.37540698936401 },
            { x: 386.3692756036636, y: 293.58909242298085 },
            { x: 98.28090392098173, y: 141.96363364262197 },
            { x: 491.16970240018804, y: 8.420150415699624 },
            { x: 341.3003289473684, y: 389.4 },
            { x: 180.96226415094338, y: 389.4 },
            { x: 68.03825239785515, y: 150.0010950834529 },
            { x: -35.5, y: 389.4 },
            { x: -35.5, y: 100.80434782608694 },
            { x: 856.3136690647482, y: 389.4 },
            { x: 941.5591142744167, y: 7.170423092131273 },
            { x: 950.5224880382775, y: -15.400000000000006 },
            { x: 1037.7035971223022, y: -15.400000000000006 },
            { x: 1017.3179856115107, y: 389.4 },
            { x: 1207.5, y: 267.85802469135797 },
            { x: 1040.6372881355933, y: 389.4 },
            { x: 1207.5, y: -15.400000000000006 },
            { x: 690.3167288225892, y: 345.381326584976 },
            { x: 499.40228070175453, y: -15.400000000000006 },
            { x: -35.5, y: -15.400000000000006 },
            { x: 708.7505415162454, y: 389.4 },
            { x: 1207.5, y: 389.4 }
        ],
        polygons: [
            [0, 1, 2, 3, 0],
            [1, 4, 5, 6, 2, 1],
            [7, 8, 6, 5, 7],
            [9, 10, 11, 12, 13, 9],
            [14, 15, 13, 12, 16, 14],
            [
                17, 0, 3, 18,
                11, 10, 17
            ],
            [
                19, 18, 3, 2,
                6, 8, 19
            ],
            [4, 1, 0, 17, 20, 4],
            [15, 14, 21, 15],
            [20, 17, 10, 9, 20]
        ]
    }
    it(`should return voronoi nodes and polygons when calcVoronoi(ps)`, function() {
        k = 0
        let r = calcVoronoi(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }],
        opt: {
            box: {
                xb0: -100,
                yb0: -50,
                xb1: 1300,
                yb1: 400,
            },
        },
    }
    out[k] = {
        nodes: [
            { x: 492.2829390058606, y: 101.37540698936401 },
            { x: 386.3692756036636, y: 293.58909242298085 },
            { x: 98.28090392098173, y: 141.96363364262197 },
            { x: 491.16970240018804, y: 8.420150415699624 },
            { x: 336.3141447368421, y: 400 },
            { x: 185.96226415094338, y: 400 },
            { x: 68.03825239785515, y: 150.0010950834529 },
            { x: -100, y: 400 },
            { x: -100, y: 70.15683229813664 },
            { x: 853.9496402877697, y: 400 },
            { x: 941.5591142744167, y: 7.170423092131273 },
            { x: 964.2631578947369, y: -50 },
            { x: 1039.4460431654677, y: -50 },
            { x: 1016.7841726618705, y: 400 },
            { x: 1300, y: 200.48148148148147 },
            { x: 1026.084745762712, y: 400 },
            { x: 1300, y: -50 },
            { x: 690.3167288225892, y: 345.381326584976 },
            { x: 511.3605263157897, y: -50 },
            { x: -100, y: -50 },
            { x: 713.1895306859205, y: 400 },
            { x: 1300, y: 400 }
        ],
        polygons: [
            [0, 1, 2, 3, 0],
            [1, 4, 5, 6, 2, 1],
            [7, 8, 6, 5, 7],
            [9, 10, 11, 12, 13, 9],
            [14, 15, 13, 12, 16, 14],
            [
                17, 0, 3, 18,
                11, 10, 17
            ],
            [
                19, 18, 3, 2,
                6, 8, 19
            ],
            [4, 1, 0, 17, 20, 4],
            [15, 14, 21, 15],
            [20, 17, 10, 9, 20]
        ]
    }
    it(`should return voronoi nodes and polygons when calcVoronoi(ps, box)`, function() {
        k = 1
        let r = calcVoronoi(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }],
        opt: { withFinder: true },
        p: { x: 1151, y: 371, ext: 'abc' },
        optFind: {},
    }
    out[k] = 8
    it(`should return nearest index when calcVoronoi(withFinder).funFindIn(p)`, function() {
        k = 2
        let o = calcVoronoi(oin[k].ps, oin[k].opt)
        let r = o.funFindIn(oin[k].p, oin[k].optFind)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }],
        opt: { withFinder: true },
        p: { x: 1071, y: 371 },
        optFind: { returnPoint: true },
    }
    out[k] = { x: 1151, y: 371, ext: 'abc' }
    it(`should return nearest point when calcVoronoi(withFinder).funFindIn(p, returnPoint=true)`, function() {
        k = 3
        let o = calcVoronoi(oin[k].ps, oin[k].opt)
        let r = o.funFindIn(oin[k].p, oin[k].optFind)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }],
        opt: { withFinder: true },
        p: { x: 1061, y: 371 },
        optFind: {},
    }
    out[k] = 4
    it(`should return nearest index when calcVoronoi(withFinder).funFindIn(near pgs4)`, function() {
        k = 4
        let o = calcVoronoi(oin[k].ps, oin[k].opt)
        let r = o.funFindIn(oin[k].p, oin[k].optFind)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
