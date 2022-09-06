import _ from 'lodash'
import w from 'wsemi'
import convertCoordinate from './src/convertCoordinate.mjs'


let ps
let r

//from WGS84
ps = [121, 24]
r = convertCoordinate('WGS84', 'TWD97', ps)
console.log('WGS84', 'to', 'TWD97', r)
// => WGS84 to TWD97 [ 121, 24.000000000000004 ]

ps = [121, 24]
r = convertCoordinate('WGS84', 'TWD67', ps)
console.log('WGS84', 'to', 'TWD67', r)
// => WGS84 to TWD67 [ 120.99185287062672, 24.001775588106096 ]

ps = [121, 24]
r = convertCoordinate('WGS84', 'TWD97TM2', ps)
console.log('WGS84', 'to', 'TWD97TM2', r)
// => WGS84 to TWD97TM2 [ 250000, 2655023.124957118 ]

ps = [121, 24]
r = convertCoordinate('WGS84', 'TWD67TM2', ps)
console.log('WGS84', 'to', 'TWD67TM2', r)
// => WGS84 to TWD67TM2 [ 249171.1063953548, 2655228.969012536 ]

//from TWD97
ps = [121, 24.000000000000004]
r = convertCoordinate('TWD97', 'WGS84', ps)
console.log('TWD97', 'to', 'WGS84', r)
// => TWD97 to WGS84 [ 121, 24.000000000000004 ]

ps = [121, 24.000000000000004]
r = convertCoordinate('TWD97', 'TWD67', ps)
console.log('TWD97', 'to', 'TWD67', r)
// => TWD97 to TWD67 [ 120.99185287062672, 24.001775588106103 ]

ps = [121, 24.000000000000004]
r = convertCoordinate('TWD97', 'TWD97TM2', ps)
console.log('TWD97', 'to', 'TWD97TM2', r)
// => TWD97 to TWD97TM2 [ 250000, 2655023.124957118 ]

ps = [121, 24.000000000000004]
r = convertCoordinate('TWD97', 'TWD67TM2', ps)
console.log('TWD97', 'to', 'TWD67TM2', r)
// => TWD97 to TWD67TM2 [ 249171.1063953548, 2655228.9690125366 ]

//from TWD67
ps = [120.99185287062672, 24.001775588106103]
r = convertCoordinate('TWD67', 'WGS84', ps)
console.log('TWD67', 'to', 'WGS84', r)
// => TWD67 to WGS84 [ 120.99999996996448, 24.000000006583658 ]

ps = [120.99185287062672, 24.001775588106103]
r = convertCoordinate('TWD67', 'TWD97', ps)
console.log('TWD67', 'to', 'TWD97', r)
// => TWD67 to TWD97 [ 120.99999996996448, 24.000000006583658 ]

ps = [120.99185287062672, 24.001775588106103]
r = convertCoordinate('TWD67', 'TWD97TM2', ps)
console.log('TWD67', 'to', 'TWD97TM2', r)
// => TWD67 to TWD97TM2 [ 249999.99694413712, 2655023.125686239 ]

ps = [120.99185287062672, 24.001775588106103]
r = convertCoordinate('TWD67', 'TWD67TM2', ps)
console.log('TWD67', 'to', 'TWD67TM2', r)
// => TWD67 to TWD67TM2 [ 249171.1063953548, 2655228.969012536 ]

//from TWD97TM2
ps = [250000, 2655023.124957118]
r = convertCoordinate('TWD97TM2', 'WGS84', ps)
console.log('TWD97TM2', 'to', 'WGS84', r)
// => TWD97TM2 to WGS84 [ 121, 24.000000000000004 ]

ps = [250000, 2655023.124957118]
r = convertCoordinate('TWD97TM2', 'TWD97', ps)
console.log('TWD97TM2', 'to', 'TWD97', r)
// => TWD97TM2 to TWD97 [ 121, 24.000000000000004 ]

ps = [250000, 2655023.124957118]
r = convertCoordinate('TWD97TM2', 'TWD67', ps)
console.log('TWD97TM2', 'to', 'TWD67', r)
// => TWD97TM2 to TWD67 [ 120.99185287062672, 24.001775588106103 ]

ps = [250000, 2655023.124957118]
r = convertCoordinate('TWD97TM2', 'TWD67TM2', ps)
console.log('TWD97TM2', 'to', 'TWD67TM2', r)
// => TWD97TM2 to TWD67TM2 [ 249171.1063953548, 2655228.9690125366 ]

//from TWD67TM2
ps = [249171.1063953548, 2655228.969012536]
r = convertCoordinate('TWD67TM2', 'WGS84', ps)
console.log('TWD67TM2', 'to', 'WGS84', r)
// => TWD67TM2 to WGS84 [ 120.99999996996448, 24.000000006583658 ]

ps = [249171.1063953548, 2655228.969012536]
r = convertCoordinate('TWD67TM2', 'TWD97', ps)
console.log('TWD67TM2', 'to', 'TWD97', r)
// => TWD67TM2 to TWD97 [ 120.99999996996448, 24.000000006583658 ]

ps = [249171.1063953548, 2655228.969012536]
r = convertCoordinate('TWD67TM2', 'TWD67', ps)
console.log('TWD67TM2', 'to', 'TWD67', r)
// => TWD67TM2 to TWD67 [ 120.99185287062672, 24.001775588106096 ]

ps = [249171.1063953548, 2655228.969012536]
r = convertCoordinate('TWD67TM2', 'TWD97TM2', ps)
console.log('TWD67TM2', 'to', 'TWD97TM2', r)
// => TWD67TM2 to TWD97TM2 [ 249999.99694413712, 2655023.125686239 ]


//node --experimental-modules --es-module-specifier-resolution=node g.mjs
