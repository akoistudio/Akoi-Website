const KEY='akoi-active-design';
export function readActiveDesign(storage){try{const p=JSON.parse(storage.getItem(KEY));return p&&typeof p.id==='string'&&p.id&&typeof p.name==='string'?{id:p.id,name:p.name}:null;}catch{return null;}}
export function setActiveDesign(storage,design){if(!design){storage.removeItem(KEY);return null;}const p={id:design.id,name:design.name};storage.setItem(KEY,JSON.stringify(p));return p;}
