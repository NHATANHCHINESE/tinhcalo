import {metrics,format,type Metric,type Nutrients} from './types';
const point=(radius:number,angle:number)=>{
  const radians=angle*Math.PI/180;
  return [180+radius*Math.cos(radians),180+radius*Math.sin(radians)];
};
function arc(radius:number,start:number,end:number){
  return 'M '+point(radius,start).join(' ')+' A '+radius+' '+radius+' 0 0 1 '+point(radius,end).join(' ');
}
export function MacroDonut({values,goals,selected,select,partialFiber}:{partialFiber:boolean;values:Nutrients;goals:Nutrients;selected:Metric;select:(key:Metric)=>void}){
  return <svg className="macro-donut" viewBox="0 0 360 360" role="group" aria-label="Tiến độ từng chất so với mục tiêu">
    <defs>
      <radialGradient id="dial-base" cx="73%" cy="18%" r="85%"><stop stopColor="#fffff1"/><stop offset=".7" stopColor="#ded3b5"/><stop offset=".92" stopColor="#ac9c80"/><stop offset="1" stopColor="#8b8571"/></radialGradient>
      <radialGradient id="disk" cx="75%" cy="17%" r="83%"><stop stopColor="#fffdf0"/><stop offset=".63" stopColor="#f4e6cc"/><stop offset=".88" stopColor="#e5d2b1"/><stop offset="1" stopColor="#bba88d"/></radialGradient>
      <filter id="segment-relief" x="-20%" y="-20%" width="150%" height="150%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation="4.2" result="rounded"/>
        <feDiffuseLighting in="rounded" surfaceScale="4.5" diffuseConstant="1.2" lightingColor="white" result="light"><feDistantLight azimuth="315" elevation="56"/></feDiffuseLighting>
        <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1=".60" k2=".43" result="lit"/>
        <feComposite in="lit" in2="SourceAlpha" operator="in"/>
      </filter>
    </defs>
    <circle cx="180" cy="184" r="175" fill="url(#dial-base)"/>
    {metrics.map(({key,label,color,tint,unit},i)=>{
      const middle=-90+i*72,start=middle-33.6,end=middle+33.6;
      const [x,y]=point(119,middle);
      const at=(r:number,a:number)=>point(r,a).join(' ');
      // Round all four transitions from the curved face to the radial edges.
      const sector=arc(168,start+3,end-3)
        +' Q '+at(168,end)+' '+at(158,end)+' L '+at(78,end)
        +' Q '+at(68,end)+' '+at(68,end-7)
        +' A 68 68 0 0 0 '+at(68,start+7)
        +' Q '+at(68,start)+' '+at(78,start)+' L '+at(158,start)
        +' Q '+at(168,start)+' '+at(168,start+3)+' Z';
      const progress=Math.min(1,values[key]/goals[key]);
      return <g key={key} className="sector" role="button" tabIndex={0} aria-pressed={selected===key} aria-label={label+' '+format(values[key])+' '+unit} onClick={()=>select(key)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(key)}}}>
        <path d={sector} transform="translate(-1 3)" fill={color} stroke={color} strokeWidth="4" strokeLinejoin="round"/>
        <path className="segment-face" d={sector} fill={tint} stroke={tint} strokeWidth="5" strokeLinejoin="round" filter="url(#segment-relief)"/>
        <path d={arc(163,start+2,end-2)} fill="none" stroke={color} opacity={selected===key?.7:.14} strokeWidth="3" strokeLinecap="round"/>
        {progress>0&&<path d={arc(163,start+2,start+2+(end-start-4)*progress)} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"/>}
        <text x={x} y={y-4} textAnchor="middle" className="sector-name">{label}</text><text x={x} y={y+16} textAnchor="middle" className="sector-val">{partialFiber&&key==='fiber'?'≥ ':''}{format(values[key])} {unit}</text>
      </g>;
    })}
    <circle cx="180" cy="183" r="61" fill="#938974"/><circle cx="180" cy="179" r="61" fill="url(#disk)"/><text x="180" y="177" textAnchor="middle" className="dial-percent">{partialFiber&&selected==='fiber'?'≥':''}{Math.round(values[selected]/goals[selected]*100)}%</text><text x="180" y="200" textAnchor="middle" className="sector-name">mục tiêu</text>
  </svg>;
}
