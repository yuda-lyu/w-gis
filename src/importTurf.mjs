import isWindow from 'wsemi/src/isWindow.mjs'
import turfBrowser from './_importTurfBrowser.mjs'
import turfNode from './_importTurfNode.mjs'


/**
 * 取得引用turf物件
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/importTurf.test.mjs Github}
 * @memberOf w-gis
 * @returns {Object} 回傳turf物件
 * @example
 *
 * let r = importTurf
 * console.log(r)
 * // => [Module: null prototype] {
 * //   along: [Function: along],
 * //   angle: [Function: angle],
 * //   applyFilter: [Function: applyFilter],
 * //   area: [Function: area],
 * //   ...
 *
 */
let turf = null
if (isWindow()) {
    // console.log('use turfBrowser')
    turf = turfBrowser
}
else {
    // console.log('use turfNode')
    turf = turfNode
}
// console.log('turf', turf)


// //turf function
// let helpers = turf
// let { polygon, multiPolygon, lineString } = helpers
// let area = turf.area
// let centroid = turf.centroid
// let centerOfMass = turf.centerOfMass
// let intersect = turf.intersect
// let mask = turf.mask
// let difference = turf.difference
// let bezierSpline = turf.bezierSpline
// let buffer = turf.buffer
// let booleanPointInPolygon = turf.booleanPointInPolygon


export default turf
