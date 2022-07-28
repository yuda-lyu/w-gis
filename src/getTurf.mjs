import isWindow from 'wsemi/src/isWindow.mjs'
import turfBrowser from './_importTurfBrowser.mjs'
import turfNode from './_importTurfNode.mjs'


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
// let helpers = turf.helpers
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
