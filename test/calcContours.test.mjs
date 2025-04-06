import assert from 'assert'
import fs from 'fs'
import calcContours from '../src/calcContours.mjs'


describe(`calcContours`, function() {
    let res1 = JSON.parse(fs.readFileSync('./test/calcContours1.json', 'utf8'))
    let res2 = JSON.parse(fs.readFileSync('./test/calcContours2.json', 'utf8'))
    let res3 = JSON.parse(fs.readFileSync('./test/calcContours3.json', 'utf8'))
    let res4 = JSON.parse(fs.readFileSync('./test/calcContours4.json', 'utf8'))
    let res5 = JSON.parse(fs.readFileSync('./test/calcContours5.json', 'utf8'))
    let res6 = JSON.parse(fs.readFileSync('./test/calcContours6.json', 'utf8'))
    let res7 = JSON.parse(fs.readFileSync('./test/calcContours7.json', 'utf8'))

    let k = -1
    let kp = {}
    let opt

    let points = [
        [24.325, 120.786, 0], [23.944, 120.968, 10], [24.884, 121.234, 20], [24.579, 121.345, 80], [24.664, 121.761, 40], [23.803, 121.397, 30],
        [23.727, 120.772, 0], [23.539, 120.975, 0], [23.612, 121.434, 0],
        [23.193, 120.355, 22], [23.456, 120.890, 42], [23.280, 120.551, 25], [23.162, 121.247, 5],
    ]

    let containInner = [ //此結構代表1個polygon, leaflet可支援顯示, 但turf做intersect不支援, 故l-contour會通過toMultiPolygon轉換才能支援
        [
            [24.28, 120.842], [24.494, 121.203], [24.314, 121.190], [24.232, 121.109], [24.249, 120.910],
        ],
        [
            [24.217, 120.851], [24.172, 121.242], [24.059, 121.333], [24.001, 121.055],
        ],
    ]

    let clipInner = [ //此結構代表1個polygon, leaflet可支援顯示, 但turf做difference不支援, 故l-contour會通過toMultiPolygon轉換才能支援
        [
            [24.28, 120.842], [24.494, 121.203], [24.314, 121.190], [24.232, 121.109], [24.249, 120.910],
        ],
        [
            [24.217, 120.851], [24.172, 121.242], [24.059, 121.333], [24.001, 121.055],
        ],
    ]

    let clipOuter = [
        [24.585, 120.79], [24.9, 121.620], [23.984, 121.6], [23.941, 121.196], [24.585, 120.79]
    ]

    let thresholds = [0, 5, 10, 20, 30, 40, 55, 70, 85]

    opt = {
        containInner,
        // clipInner,
        // clipOuter,
        // thresholds,
    }

    k++
    kp[k] = {
        testName: 'res1',
        opt: JSON.parse(JSON.stringify(opt)),
        res: res1,
    }
    it(`should return ${kp[k].testName} when calcContours(points, {containInner})`, function() {
        k = 0
        let r = calcContours(points, kp[k].opt)
        let rr = kp[k].res
        assert.strict.deepStrictEqual(r, rr)
    })

    opt = {
        // containInner,
        clipInner,
        // clipOuter,
        // thresholds,
    }

    k++
    kp[k] = {
        testName: 'res2',
        opt: JSON.parse(JSON.stringify(opt)),
        res: res2,
    }
    it(`should return ${kp[k].testName} when calcContours(points, {clipInner})`, function() {
        k = 1
        let r = calcContours(points, kp[k].opt)
        let rr = kp[k].res
        assert.strict.deepStrictEqual(r, rr)
    })

    opt = {
        // containInner,
        // clipInner,
        clipOuter,
        // thresholds,
    }

    k++
    kp[k] = {
        testName: 'res3',
        opt: JSON.parse(JSON.stringify(opt)),
        res: res3,
    }
    it(`should return ${kp[k].testName} when calcContours(points, {clipOuter})`, function() {
        k = 2
        let r = calcContours(points, kp[k].opt)
        let rr = kp[k].res
        assert.strict.deepStrictEqual(r, rr)
    })

    opt = {
        // containInner,
        // clipInner,
        // clipOuter,
        thresholds,
    }

    k++
    kp[k] = {
        testName: 'res4',
        opt: JSON.parse(JSON.stringify(opt)),
        res: res4,
    }
    it(`should return ${kp[k].testName} when calcContours(points, {thresholds})`, function() {
        k = 3
        let r = calcContours(points, kp[k].opt)
        let rr = kp[k].res
        assert.strict.deepStrictEqual(r, rr)
    })

    opt = {
        withStyle: true,
        // returnGeojson: true,
    }

    k++
    kp[k] = {
        testName: 'res5',
        opt: JSON.parse(JSON.stringify(opt)),
        res: res5,
    }
    it(`should return ${kp[k].testName} when calcContours(points, {withStyle})`, function() {
        k = 4
        let r = calcContours(points, kp[k].opt)
        let rr = kp[k].res
        assert.strict.deepStrictEqual(r, rr)
    })

    opt = {
        withStyle: true,
        returnGeojson: true,
    }

    k++
    kp[k] = {
        testName: 'res6',
        opt: JSON.parse(JSON.stringify(opt)),
        res: res6,
    }
    it(`should return ${kp[k].testName} when calcContours(points, {withStyle,returnGeojson})`, function() {
        k = 5
        let r = calcContours(points, kp[k].opt)
        let rr = kp[k].res
        assert.strict.deepStrictEqual(r, rr)
    })

    opt = {
        withStyle: true,
        returnGeojson: true,
        inverseCoordinate: true,
    }

    k++
    kp[k] = {
        testName: 'res7',
        opt: JSON.parse(JSON.stringify(opt)),
        res: res7,
    }
    it(`should return ${kp[k].testName} when calcContours(points, {withStyle,returnGeojson,inverseCoordinate})`, function() {
        k = 6
        let r = calcContours(points, kp[k].opt)
        let rr = kp[k].res
        assert.strict.deepStrictEqual(r, rr)
    })

})
