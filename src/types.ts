export const metrics = [
  {key:'calories', label:'Calories', unit:'kcal', color:'#276b6c', tint:'#c6e3db'},
  {key:'protein', label:'Protein', unit:'g', color:'#926449', tint:'#edd1bb'},
  {key:'carbs', label:'Carb', unit:'g', color:'#916e2d', tint:'#f3e3b5'},
  {key:'fat', label:'Chất béo', unit:'g', color:'#986b6c', tint:'#edd3d2'},
  {key:'fiber', label:'Chất xơ', unit:'g', color:'#556f51', tint:'#dbe6c9'}
] as const;
export type Metric = typeof metrics[number]['key'];
export type Nutrients = Record<Metric,number>;
export type Food = {name:string; baseGrams:number; unit?:'gói'|'miếng'; nutrients:Omit<Nutrients,'fiber'>&{fiber:number|null}};
export type Portion = {name:string; grams:number; density:number; basis?:Food};
export type Meal = {id:string; at:number; kind:string; foods:Portion[]; hasPhoto?:boolean};
export const defaults:Nutrients = {calories:2000,protein:90,carbs:250,fat:65,fiber:25};
export const zero:Nutrients = {calories:0,protein:0,carbs:0,fat:0,fiber:0};
export const format = (n:number) => n.toLocaleString('vi-VN',{maximumFractionDigits:1});
export const norm = (s:string) => s.normalize('NFC').trim().toLocaleLowerCase('vi');
export const dayKey = (d:Date) => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
