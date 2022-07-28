import turf from './getTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


function clipMultiPolygon(pgs, pgsCut) {

    //difference
    let r = turf.difference(turf.helpers.multiPolygon(toMultiPolygon(pgs)), turf.helpers.multiPolygon(toMultiPolygon(pgsCut)))

    return distilMultiPolygon(r)
}


export default clipMultiPolygon
