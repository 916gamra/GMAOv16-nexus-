const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'presentation', 'pages', 'StockView.jsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "import React from 'react';",
  "import React, { useMemo, useDeferredValue, useState } from 'react';"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("StockView imports fixed.");
