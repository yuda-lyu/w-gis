import assert from 'assert'
import convertCoordinate from '../src/convertCoordinate.mjs'


describe(`convertCoordinate`, function() {

    // ps = [121, 24]
    // r = convertCoordinate('WGS84', 'TWD97TM2', ps)
    // console.log('WGS84', 'to', 'TWD97TM2', r)
    // => WGS84 to TWD97TM2 [ 250000, 2655023.124957118 ]
    let c1ps = [121, 24]
    let c1in = `'WGS84', 'TWD97TM2', ${c1ps}`
    let c1out = [250000, 2655023.124957118]
    it(`should return ${c1out} when convertCoordinate(${c1in})`, function() {
        let r = convertCoordinate('WGS84', 'TWD97TM2', c1ps)
        let rr = c1out
        assert.strict.deepStrictEqual(r, rr)
    })

    // ps = [121, 24]
    // r = convertCoordinate('WGS84', 'TWD67TM2', ps)
    // console.log('WGS84', 'to', 'TWD67TM2', r)
    // // => WGS84 to TWD67TM2 [ 249171.1063953548, 2655228.969012536 ]
    let c2ps = [121, 24]
    let c2in = `'WGS84', 'TWD67TM2', ${c2ps}`
    let c2out = [249171.1063953548, 2655228.969012536]
    it(`should return ${c2out} when convertCoordinate(${c2in})`, function() {
        let r = convertCoordinate('WGS84', 'TWD67TM2', c2ps)
        let rr = c2out
        assert.strict.deepStrictEqual(r, rr)
    })

    // ps = [250000, 2655023]
    // r = convertCoordinate('TWD97TM2', 'TWD67TM2', ps)
    // console.log('TWD97TM2', 'to', 'TWD67TM2', r)
    // // => TWD97TM2 to TWD67TM2 [ 249171.10639535502, 2655228.8440549527 ]
    let c3ps = [250000, 2655023]
    let c3in = `'TWD97TM2', 'TWD67TM2', ${c3ps}`
    let c3out = [249171.10639535502, 2655228.8440549527]
    it(`should return ${c3out} when convertCoordinate(${c3in})`, function() {
        let r = convertCoordinate('TWD97TM2', 'TWD67TM2', c3ps)
        let rr = c3out
        assert.strict.deepStrictEqual(r, rr)
    })

})
