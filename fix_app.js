const fs = require('fs');

const appJsxPath = 'frontend/src/App.jsx';
let c = fs.readFileSync(appJsxPath, 'utf8');

c = c.replace(
  '<Link to="/" className="px-3 xl:px-4 h-full flex items-center hover:text-brand-orange transition-colors">Giới thiệu</Link>',
  '<Link to="/tra-cuu" className="px-3 xl:px-4 h-full flex items-center hover:text-brand-orange transition-colors">Tra Cứu Tiến Độ</Link>\n              <Link to="/" className="px-3 xl:px-4 h-full flex items-center hover:text-brand-orange transition-colors">Giới thiệu</Link>'
);

fs.writeFileSync(appJsxPath, c, 'utf8');
console.log('App.jsx fixed successfully!');
