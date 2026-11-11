import {useState} from 'react';
import {norm,type Food} from './types';
import {read,write} from './storage';
const searchKey=(text:string)=>norm(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('đ','d');

export function FoodPicker({foods,selected,select}:{foods:Food[];selected:Set<string>;select:(food:Food)=>void}){
  const [query,setQuery]=useState(''),[error,setError]=useState('');
  const favorites=new Set(read<string[]>('favorites',[]));
  const matches=foods.filter(food=>searchKey(food.name).includes(searchKey(query)));
  function toggle(food:Food){
    const next=new Set(read<string[]>('favorites',[])),key=norm(food.name);
    if(next.has(key))next.delete(key);else next.add(key);
    try{write('favorites',[...next]);setError('')}catch{setError('Chưa lưu được đánh dấu trên thiết bị.')}
  }
  return <div className="food-picker">
      <div className="picker-body"><input type="search" placeholder="Tìm món…" aria-label="Tìm món" value={query} onChange={e=>setQuery(e.target.value)}/>
        <div className="picker-list">{[true,false].map(pinned=>{
          const group=matches.filter(f=>favorites.has(norm(f.name))===pinned);
          return group.length>0&&<section key={String(pinned)}><h4>{pinned?'Thường dùng':'Danh sách món'}</h4>{group.map(food=><div className="picker-row" key={food.name}>
            <button type="button" className="pick-food" aria-pressed={selected.has(norm(food.name))} onClick={()=>{select(food);setQuery('')}}><span aria-hidden="true" className="pick-check">{selected.has(norm(food.name))?'✓':''}</span>{food.name}</button>
            <button type="button" className="pin-food" aria-label={'Thường dùng: '+food.name} aria-pressed={pinned} onClick={()=>toggle(food)}>{pinned?'★':'☆'}</button>
          </div>)}</section>;
        })}{!matches.length&&<p>Chưa tìm thấy món.</p>}</div></div>
    {error&&<small role="alert">{error}</small>}</div>;
}
