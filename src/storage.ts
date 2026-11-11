import {dayKey,type Food,type Meal} from './types';
const prefix='macroday.';
export const changed='macroday-update';
function notify(){window.dispatchEvent(new Event(changed))}
export function read<T>(key:string,fallback:T):T {
  const value=localStorage.getItem(prefix+key);
  return value===null ? fallback : JSON.parse(value) as T;
}
export function write(key:string,value:unknown){
  localStorage.setItem(prefix+key,JSON.stringify(value));notify();
}
type Day={meals:Meal[];imported:string[]};
const keyFor=(day:string)=>'day.'+day;
const getDay=(key:string)=>read<Day>(keyFor(key),{meals:[],imported:[]});
export const dayMeals=(key:string)=>getDay(key).meals;
async function mutate(key:string,fn:(day:Day)=>void){
  const run=()=>{const day=getDay(key);fn(day);write(keyFor(key),day)};
  if(navigator.locks) await navigator.locks.request(prefix+key,run);else run();
}
let opened:Promise<IDBDatabase>|undefined;
function db(){
  if(!opened) opened=new Promise<IDBDatabase>((resolve,reject)=>{
    const req=indexedDB.open('bep-nho',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('meals',{keyPath:'id'});
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
  return opened;
}
async function query<T>(mode:IDBTransactionMode,op:(store:IDBObjectStore)=>IDBRequest<T>){
  const handle=await db();return new Promise<T>((resolve,reject)=>{
    const tx=handle.transaction('meals',mode);const req=op(tx.objectStore('meals'));
    tx.oncomplete=()=>resolve(req.result);tx.onabort=tx.onerror=()=>reject(tx.error);
  });
}
let migration:Promise<void>|undefined;
export function migrate(){
  if(!migration) migration=(async()=>{
    if(read('migrated',false))return;
    const rows=await query<(Meal&{photo?:string})[]>('readonly',s=>s.getAll());
    for(const old of rows){
      if(!old.foods)continue;
      await mutate(dayKey(new Date(old.at)),day=>{
        if(day.imported.includes(old.id))return;
        const {photo,...meta}=old;
        if(!day.meals.some(m=>m.id===old.id))day.meals.push({...meta,hasPhoto:!!photo});
        day.imported.push(old.id);
      });
    }
    write('migrated',true);
  })().catch(error=>{migration=undefined;throw error});
  return migration;
}
export async function allMeals(){
  await migrate();return Object.keys(localStorage).filter(k=>k.startsWith(prefix+'day.')).flatMap(k=>dayMeals(k.slice((prefix+'day.').length)));
}
export async function addMeal(meal:Meal,photo?:string){
  await migrate();
  if(photo) await query('readwrite',s=>s.put({id:meal.id,photo}));
  try{await mutate(dayKey(new Date(meal.at)),day=>day.meals.push({...meal,hasPhoto:!!photo}))}
  catch(error){if(photo)await query('readwrite',s=>s.delete(meal.id));throw error}
}
export async function loadPhoto(id:string){return (await query('readonly',s=>s.get(id)))?.photo as string|undefined}
export async function removeMeal(meal:Meal){
  await mutate(dayKey(new Date(meal.at)),day=>{day.meals=day.meals.filter(m=>m.id!==meal.id)});
  if(meal.hasPhoto)await query('readwrite',s=>s.delete(meal.id));
}
function currentMeal(day:Day, meal:Meal, index:number){
  const current=day.meals.find(entry=>entry.id===meal.id);
  if(!current || !current.foods[index] || JSON.stringify(current.foods)!==JSON.stringify(meal.foods)){
    throw Error('Bữa ăn vừa thay đổi. Hãy đóng và mở lại món.');
  }
  return current;
}
export async function updatePortion(meal:Meal,index:number,quantity:number){
  if(!Number.isFinite(quantity)||quantity<0.01||quantity>100000)throw Error('Nhập lượng ăn từ 0,01 đến 100.000.');
  await mutate(dayKey(new Date(meal.at)),day=>{
    const current=currentMeal(day,meal,index);
    current.foods[index].grams=quantity;
  });
}
export async function removePortion(meal:Meal,index:number){
  let clean=false;
  await mutate(dayKey(new Date(meal.at)),day=>{
    const m=currentMeal(day,meal,index);
    m.foods.splice(index,1);
    if(!m.foods.length){day.meals=day.meals.filter(r=>r.id!==m.id);clean=!!m.hasPhoto}
  });
  if(clean)await query('readwrite',s=>s.delete(meal.id));
}
export async function clearDay(key:string){
  let ids:string[]=[];
  await mutate(key,day=>{ids=day.meals.filter(m=>m.hasPhoto).map(m=>m.id);day.meals=[]});
  for(const id of ids)await query('readwrite',s=>s.delete(id));
}
export const savedFoods=()=>({sheet:read<Food[]>('sheet',[]),custom:read<Food[]>('custom',[]),removed:read<string[]>('removedFoods',[])});
