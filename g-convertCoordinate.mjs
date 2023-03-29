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

ps = [121, 24]
r = convertCoordinate('WGS84', 'UTMTM6', ps)
console.log('WGS84', 'to', 'UTMTM6', r)
// => WGS84 to UTMTM6 [ 295715.5173190569, 2655913.497631182 ]

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

ps = [121, 24.000000000000004]
r = convertCoordinate('TWD97', 'UTMTM6', ps)
console.log('TWD97', 'to', 'UTMTM6', r)
// => TWD97 to UTMTM6 [ 295715.5173190569, 2655913.4976311824 ]

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
// => TWD67 to TWD67TM2 [ 249171.10333948207, 2655228.9697416592 ]

ps = [120.99185287062672, 24.001775588106103]
r = convertCoordinate('TWD67', 'UTMTM6', ps)
console.log('TWD67', 'to', 'UTMTM6', r)
// => TWD67 to UTMTM6 [ 295715.5142731895, 2655913.4984038025 ]

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

ps = [250000, 2655023.124957118]
r = convertCoordinate('TWD97TM2', 'UTMTM6', ps)
console.log('TWD97TM2', 'to', 'UTMTM6', r)
// => TWD97TM2 to UTMTM6 [ 295715.5173190569, 2655913.4976311824 ]

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
// => TWD67TM2 to TWD67 [ 120.99185284059037, 24.001775594688155 ]

ps = [249171.1063953548, 2655228.969012536]
r = convertCoordinate('TWD67TM2', 'TWD97TM2', ps)
console.log('TWD67TM2', 'to', 'TWD97TM2', r)
// => TWD67TM2 to TWD97TM2 [ 249999.99694413712, 2655023.125686239 ]

ps = [249171.1063953548, 2655228.969012536]
r = convertCoordinate('TWD67TM2', 'UTMTM6', ps)
console.log('TWD67TM2', 'to', 'UTMTM6', r)
// => TWD67TM2 to UTMTM6 [ 295715.5142731895, 2655913.4984038025 ]

//from UTMTM6
ps = [295715.5173190569, 2655913.497631182]
r = convertCoordinate('UTMTM6', 'WGS84', ps)
console.log('UTMTM6', 'to', 'WGS84', r)
// => UTMTM6 to WGS84 [ 120.99999997049657, 24.000000006421075 ]

ps = [295715.5173190569, 2655913.497631182]
r = convertCoordinate('UTMTM6', 'TWD97', ps)
console.log('UTMTM6', 'to', 'TWD97', r)
// => UTMTM6 to TWD97 [ 120.99999997049657, 24.000000006421075 ]

ps = [295715.5173190569, 2655913.497631182]
r = convertCoordinate('UTMTM6', 'TWD67', ps)
console.log('UTMTM6', 'to', 'TWD67', r)
// => UTMTM6 to TWD67 [ 120.99185284112247, 24.001775594525597 ]

ps = [295715.5173190569, 2655913.497631182]
r = convertCoordinate('UTMTM6', 'TWD97TM2', ps)
console.log('UTMTM6', 'to', 'TWD97TM2', r)
// => UTMTM6 to TWD97TM2 [ 249999.99699827324, 2655023.1256682333 ]

ps = [295715.5173190569, 2655913.497631182]
r = convertCoordinate('UTMTM6', 'TWD67TM2', ps)
console.log('UTMTM6', 'to', 'TWD67TM2', r)
// => UTMTM6 to TWD67TM2 [ 249171.1033936166, 2655228.969723653 ]


//node --experimental-modules --es-module-specifier-resolution=node g-convertCoordinate.mjs
