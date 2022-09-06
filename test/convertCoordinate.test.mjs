import assert from 'assert'
import convertCoordinate from '../src/convertCoordinate.mjs'


describe(`convertCoordinate`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        from: 'WGS84',
        to: 'TWD97',
        ps: [121, 24],
    }
    out[k] = [121, 24.000000000000004]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 0
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'WGS84',
        to: 'TWD67',
        ps: [121, 24],
    }
    out[k] = [120.99185287062672, 24.001775588106096]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 1
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'WGS84',
        to: 'TWD97TM2',
        ps: [121, 24],
    }
    out[k] = [250000, 2655023.124957118]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 2
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'WGS84',
        to: 'TWD67TM2',
        ps: [121, 24],
    }
    out[k] = [249171.1063953548, 2655228.969012536]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 3
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD97',
        to: 'WGS84',
        ps: [121, 24.000000000000004],
    }
    out[k] = [121, 24.000000000000004]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 4
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD97',
        to: 'TWD67',
        ps: [121, 24.000000000000004],
    }
    out[k] = [120.99185287062672, 24.001775588106103]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 5
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD97',
        to: 'TWD97TM2',
        ps: [121, 24.000000000000004],
    }
    out[k] = [250000, 2655023.124957118]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 6
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD97',
        to: 'TWD67TM2',
        ps: [121, 24.000000000000004],
    }
    out[k] = [249171.1063953548, 2655228.9690125366]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 7
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD67',
        to: 'WGS84',
        ps: [120.99185287062672, 24.001775588106103],
    }
    out[k] = [120.99999996996448, 24.000000006583658]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 8
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD67',
        to: 'TWD97',
        ps: [120.99185287062672, 24.001775588106103],
    }
    out[k] = [120.99999996996448, 24.000000006583658]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 9
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD67',
        to: 'TWD97TM2',
        ps: [120.99185287062672, 24.001775588106103],
    }
    out[k] = [249999.99694413712, 2655023.125686239]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 10
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD67',
        to: 'TWD67TM2',
        ps: [120.99185287062672, 24.001775588106103],
    }
    out[k] = [249171.1063953548, 2655228.969012536]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 11
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD97TM2',
        to: 'WGS84',
        ps: [250000, 2655023.124957118],
    }
    out[k] = [121, 24.000000000000004]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 12
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD97TM2',
        to: 'TWD97',
        ps: [250000, 2655023.124957118],
    }
    out[k] = [121, 24.000000000000004]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 13
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD97TM2',
        to: 'TWD67',
        ps: [250000, 2655023.124957118],
    }
    out[k] = [120.99185287062672, 24.001775588106103]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 14
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD97TM2',
        to: 'TWD67TM2',
        ps: [250000, 2655023.124957118],
    }
    out[k] = [249171.1063953548, 2655228.9690125366]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 15
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD67TM2',
        to: 'WGS84',
        ps: [249171.1063953548, 2655228.969012536],
    }
    out[k] = [120.99999996996448, 24.000000006583658]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 16
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD67TM2',
        to: 'TWD97',
        ps: [249171.1063953548, 2655228.969012536],
    }
    out[k] = [120.99999996996448, 24.000000006583658]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 17
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD67TM2',
        to: 'TWD67',
        ps: [249171.1063953548, 2655228.969012536],
    }
    out[k] = [120.99185287062672, 24.001775588106096]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 18
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        from: 'TWD67TM2',
        to: 'TWD97TM2',
        ps: [249171.1063953548, 2655228.969012536],
    }
    out[k] = [249999.99694413712, 2655023.125686239]
    it(`should return ${JSON.stringify(out[k])} when convertCoordinate(${oin[k].from}, ${oin[k].to}, ${JSON.stringify(oin[k].ps)})`, function() {
        k = 19
        let r = convertCoordinate(oin[k].from, oin[k].to, oin[k].ps)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})
