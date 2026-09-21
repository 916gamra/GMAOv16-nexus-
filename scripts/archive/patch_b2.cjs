const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
`      const itemDesigKey = item.designation.toLowerCase();

      let entrees = (mvtSummary[itemRefKey]?.entrees || 0) + (mvtSummary[itemDesigKey]?.entrees || 0);
      let sorties = (mvtSummary[itemRefKey]?.sorties || 0) + (mvtSummary[itemDesigKey]?.sorties || 0);`,
`      let entrees = mvtSummary[itemRefKey]?.entrees || 0;
      let sorties = mvtSummary[itemRefKey]?.sorties || 0;`
);

fs.writeFileSync('src/App.jsx', code);
