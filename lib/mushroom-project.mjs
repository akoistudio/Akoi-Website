import {DEFAULTS,PRESETS} from './model.mjs';
import {BASE_DEFAULTS} from './base-model.mjs';
import {validateProject} from './design-project.mjs';
export function mushroomProject(style='smooth'){
 return validateProject({format:'akoi-design',version:1,shade:{...DEFAULTS,...PRESETS.mushroom,shape:'mushroom',socketDiameter:72,texture:style==='ribbed'?'fluted':'smooth',textureDepth:style==='ribbed'?.5:0,textureCount:16},base:{...BASE_DEFAULTS,profile:'straight',height:200,diameter:100,topDiameter:100,socketDiameter:72,e27Enabled:true,e27Depth:65,texture:style==='ribbed'?'fluted':'smooth',textureDepth:.35,textureCount:16},finishes:{shade:'#f4eddf',base:'#f4eddf'},lidEnabled:false,diffuserEnabled:false});
}
