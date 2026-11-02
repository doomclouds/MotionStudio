/** Candidate case recipe, not a new published UI family. Fixed 1200x232 still. */
export function drawSeasonalStrip(c,{terms,activeIndex=16,x=0,y=518,headingFont='FSSerif600',labelFont='FSSans400'}){
 if(!Array.isArray(terms)||terms.length!==24)throw new RangeError('Exactly 24 ordered terms required');
 if(!Number.isInteger(activeIndex)||activeIndex<0||activeIndex>=24)throw new RangeError('activeIndex 0..23');
 if(!Number.isFinite(x)||!Number.isFinite(y))throw new TypeError('Finite origin required');
 for(const f of[headingFont,labelFont])if(typeof f!=='string'||!/^[\w -]{1,60}$/.test(f))throw new TypeError('Font family required');
 for(const t of terms){if(!/^#[\da-f]{6}$/i.test(t.fill)||!/^#[\da-f]{6}$/i.test(t.ink)||typeof t.name!=='string'||[...t.name].length!==2||typeof t.colorName!=='string'||![1,2,3].includes([...t.colorName].length))throw new TypeError('Each term needs two-character name, 1..3 character color name and hex colors')}
 const before={font:c.font,textAlign:c.textAlign,textBaseline:c.textBaseline,fillStyle:c.fillStyle,letterSpacing:c.letterSpacing};c.save();const regions=[];
 try{let xx=x;const write=(ch,cx,cy,size,font,ink)=>{c.font=`400 ${size}px ${font}`;c.fillStyle=ink;c.textAlign='center';c.textBaseline='alphabetic';c.letterSpacing='0px';c.fillText(ch,cx,cy)};
 for(const[i,t]of terms.entries()){const active=i===activeIndex,w=1200/24.6*(active?1.6:1),yy=y+(active?0:70),z=active?26:21;c.fillStyle=t.fill;c.fillRect(xx,yy,w,y+232-yy);for(const[j,ch]of[...t.name].entries())write(ch,xx+w/2,yy+z+(active?10:12)+j*z*1.2,z,headingFont,t.ink);for(const[j,ch]of[...t.colorName].entries())write(ch,xx+w/2,y+217-([...t.colorName].length-1)*15.08+j*15.08,13,labelFont,t.ink);regions.push({name:t.name,x:xx,y:yy,width:w,height:y+232-yy,selected:active,color:t.fill});xx+=w}
 return{candidate:'seasonal-strip-recipe',bounds:{x,y,width:1200,height:232},activeIndex,regions,encoding:'ordered seasonal color identity; width and height emphasize selection, not measured quantities'};
 }finally{c.restore();Object.assign(c,before)}
}
