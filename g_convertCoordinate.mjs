import convertCoordinate from './src/convertCoordinate.mjs'


let ps
let r

ps = [121, 24]
r = convertCoordinate('WGS84', 'TWD97TM2', ps)
console.log('WGS84', 'to', 'TWD97TM2', r)
// => WGS84 to TWD97TM2 [ 250000, 2655023.124957118 ]

ps = [121, 24]
r = convertCoordinate('WGS84', 'TWD67TM2', ps)
console.log('WGS84', 'to', 'TWD67TM2', r)
// => WGS84 to TWD67TM2 [ 249171.1063953548, 2655228.969012536 ]

ps = [250000, 2655023]
r = convertCoordinate('TWD97TM2', 'TWD67TM2', ps)
console.log('TWD97TM2', 'to', 'TWD67TM2', r)
// => TWD97TM2 to TWD67TM2 [ 249171.10639535502, 2655228.8440549527 ]

//node --experimental-modules --es-module-specifier-resolution=node g_convertCoordinate.mjs
