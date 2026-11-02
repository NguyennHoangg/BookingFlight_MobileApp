const fs = require('node:fs');
const path = require('node:path');
const ts = require('../../fe/node_modules/typescript');
const root = path.resolve(__dirname, '../..');
const files = [
 'screens/home/Home.tsx', 'screens/search/SearchFlightResult.tsx',
 'screens/flight/FlightDetail.tsx', 'screens/flight/FareSelection.tsx',
 'screens/booking/PassengerInfo.tsx', 'screens/booking/AdditionalServices.tsx',
 'screens/booking/BookingConfirmation.tsx', 'navigation/routes.ts', 'navigation/validation.ts',
 'hook/useAirport.ts','hook/useFareSelection.ts','hook/useTaxAndFee.ts','hook/useFlightFavorite.ts',
 'api/flight.api.ts','api/airport.api.ts','api/bookingOptions.api.ts','api/clientApi.ts',
 'utils/fare.ts','utils/passengerForm.ts','utils/seatMap.ts','utils/booking.ts','utils/taxAndFee.ts',
 'store/slices/bookingSlice.ts','components/booking/FlightSeatPicker.tsx',
 'components/booking/CabinSeatMap.tsx','components/booking/PassengerFields.tsx',
 'components/booking/BookingLayout.tsx','components/booking/BookingProgress.tsx',
 'components/booking/TaxAndFeeCard.tsx','components/flight/AirportSelectModal.tsx',
 'components/flight/PassengerSelectModal.tsx','components/flight/FlightFilterModal.tsx',
 'components/flight/fares/FareCheckoutBar.tsx','components/flight/fares/FareOptionCard.tsx',
 'components/flight/fares/FareSheet.tsx','components/flight/fares/FlightSummary.tsx',
];
const result = [];
for (const file of files) {
 const rel = 'fe/src/'+file;
 const content = fs.readFileSync(path.join(root,rel),'utf8');
 const source = ts.createSourceFile(rel,content,ts.ScriptTarget.Latest,true);
 function visit(node) {
  let name;
  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) name = node.name?.getText(source);
  let initializerFn;
  if (ts.isVariableDeclaration(node) && node.initializer) {
   const init = node.initializer;
   if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) initializerFn = init;
   else if (ts.isCallExpression(init) && init.expression.getText(source) === 'useCallback' && init.arguments[0] && ts.isArrowFunction(init.arguments[0])) initializerFn = init.arguments[0];
   if (initializerFn) name = node.name.getText(source);
  }
  if(name) {
   const fn = initializerFn || node;
   const start = source.getLineAndCharacterOfPosition(node.getStart(source)).line+1;
   const end = source.getLineAndCharacterOfPosition(node.end).line+1;
   const calls = new Set();
   function scan(part) {
    if(ts.isCallExpression(part)) calls.add(part.expression.getText(source));
    ts.forEachChild(part,scan);
   }
   scan(fn.body);
   result.push({file:rel,name,start,end,signature:fn.parameters.map(p=>p.getText(source)).join(', '),calls:[...calls].filter(x=>x.length<90),excerpt:content.split(/\r?\n/).slice(start-1,Math.min(start+7,end)).join('\n')});
  }
  ts.forEachChild(node,visit);
 }
 visit(source);
}
fs.writeFileSync(path.join(__dirname,'source-index.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({files:files.length,functions:result.length,names:result.map(r=>r.name)}));
