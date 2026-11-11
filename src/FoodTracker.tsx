import {FoodPicker} from './FoodPicker';
import {useState,type FormEvent} from 'react';
import {format,metrics,norm,type Food,type Meal,type Portion} from './types';
import {nutrition,portion} from './calculations';
import {addMeal,removePortion} from './storage';
import {FoodDatabase} from './FoodDatabase';
import {editPortion} from './editPortion';
function bulkPortions(input:string,foods:Food[]):Portion[]{
  return input.trim().split(/\r?\n/).filter(s=>s.trim()).map((line,index)=>{
    const match=line.trim().match(/^(.+?)(?:\s*[;|\t:]\s*|\s+)(\d+(?:[.,]\d+)?)\s*(g|gam|gói|miếng)?$/i);
    if(!match)throw Error('Dòng '+(index+1)+' cần tên món và số gam.');
    const food=foods.find(f=>norm(f.name)===norm(match[1]));
    if(!food)throw Error('Dòng '+(index+1)+' chưa có “'+match[1]+'” trong danh sách. Hãy tạo thực phẩm trước.');
    const unit=match[3]?.toLowerCase().replace(/^gam$/,'g');
    if(unit && unit!==(food.unit??'g'))throw Error('Dòng '+(index+1)+' cần nhập theo '+(food.unit??'g')+'.');
    const grams=Number(match[2].replace(',','.'));
    if(!(grams>0&&grams<=100000))throw Error('Kiểm tra số gam ở dòng '+(index+1)+'.');
    return portion(food,grams);
  });
}
function FoodItem({meal,index,foods,onError}:{meal:Meal;index:number;foods:Food[];onError:(msg:string)=>void}){
  const row=meal.foods[index],{values,known,fiberKnown}=nutrition(row,foods);
  const [busy,setBusy]=useState(false);
  async function remove(){
    setBusy(true);
    try{await removePortion(meal,index)}catch(e){onError(e instanceof Error?e.message:'Chưa xóa được món.')}finally{setBusy(false)}
  }
  return <li className="food-item"><details><summary><span className="food-title"><strong>{row.name}</strong><small>{meal.kind} · {format(row.grams)} {row.basis?.unit??'g'}</small></span><b>{format(values.calories)} kcal</b></summary>
    <div className="food-more"><div className="food-nutrients">{metrics.slice(1).map(m=><span key={m.key}>{m.label} <b>{known&&(m.key!=='fiber'||fiberKnown)?format(values[m.key])+' '+m.unit:'—'}</b></span>)}</div>
    <div className="portion-actions"><button type="button" className="link-action" disabled={busy} onClick={()=>editPortion(meal,index)}>Sửa khẩu phần</button>
    <button className="link-action" disabled={busy} onClick={remove} aria-label={'Xóa '+row.name}>Xóa món</button></div></div></details></li>;
}
export function FoodList({foods,meals,onError}:{foods:Food[];meals:Meal[];onError:(msg:string)=>void}){
  if(!meals.length)return <div className="empty-diary"><img src="art/studio-diary.webp" alt=""/><p>Chưa ghi món nào.</p></div>;
  return <ul className="food-list">{meals.flatMap(m=>m.foods.map((_,i)=><FoodItem key={m.id+'-'+i} meal={m} index={i} foods={foods} onError={onError}/>))}</ul>;
}
export function FoodTracker({foods,onSaved,initial}:{foods:Food[];initial?:Food;onSaved:(message:string)=>void}){
  type Draft = {food:Food; amount:string};
  const [draft,setDraft]=useState<Draft[]>(()=>initial?[{food:initial,amount:String(initial.baseGrams)}]:[]);
  const [mode,setMode]=useState(false),[lines,setLines]=useState('');
  const [kind,setKind]=useState('Bữa trưa'),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const selected=new Set(draft.map(item=>norm(item.food.name)));
  function toggle(food:Food){
    const key=norm(food.name);
    setDraft(items=>items.some(item=>norm(item.food.name)===key)
      ?items.filter(item=>norm(item.food.name)!==key)
      :[...items,{food,amount:String(food.baseGrams)}]);
    setMessage('');
  }
  async function submit(e:FormEvent){
    e.preventDefault();
    if(busy)return;
    setMessage('');setBusy(true);
    try{
      const items=mode?bulkPortions(lines,foods):draft.map(({food,amount})=>{
        const quantity=Number(amount);
        if(!Number.isFinite(quantity)||quantity<.01||quantity>100000)throw Error('Kiểm tra lượng ăn của '+food.name+'.');
        return portion(food,quantity);
      });
      if(!items.length)throw Error('Hãy chọn ít nhất một món.');
      await addMeal({id:crypto.randomUUID(),at:Date.now(),kind,foods:items});
      setDraft([]);setLines('');
      onSaved('Đã thêm '+items.length+' món vào '+kind.toLocaleLowerCase('vi')+'.');
    }catch(e){setMessage(e instanceof Error?e.message:'Chưa lưu được bữa ăn.')}finally{setBusy(false)}
  }
  return <section className="tracker">
    <div className="switches"><button aria-pressed={!mode} onClick={()=>{setMode(false);setMessage('')}}>Chọn món</button><button aria-pressed={mode} onClick={()=>{setMode(true);setMessage('')}}>Dán nhiều món</button></div>
    <form onSubmit={submit} onKeyDown={e=>{if(e.key==='Enter' && e.target instanceof HTMLInputElement)e.preventDefault()}}>
      <label className="meal-kind">Bữa ăn<select value={kind} onChange={e=>setKind(e.target.value)}>{['Bữa sáng','Bữa trưa','Bữa tối','Bữa phụ'].map(x=><option key={x}>{x}</option>)}</select></label>
      {mode?<label>Mỗi dòng một món và lượng ăn (g, gói hoặc miếng)<textarea rows={4} required value={lines} onChange={e=>setLines(e.target.value)} placeholder={'Cơm trắng 150 g\nỨc gà chín 120 g'}/></label>:
        <><FoodPicker foods={foods} selected={selected} select={toggle}/>
        {draft.length>0&&<div className="servings"><h3>Đã chọn ({draft.length})</h3>{draft.map(({food,amount})=><div key={food.name} className="serving-row">
          <span>{food.name}</span><label><input aria-label={'Lượng ăn '+food.name} type="number" inputMode="decimal" min=".01" max="100000" step="any" value={amount} required onChange={e=>{const value=e.target.value;setDraft(items=>items.map(item=>item.food.name===food.name?{...item,amount:value}:item))}}/>{food.unit??'g'}</label>
          <button type="button" className="remove-food" aria-label={'Bỏ '+food.name} onClick={()=>toggle(food)}>×</button></div>)}</div>}</>}
      <button className="m-action" disabled={busy||(!mode&&!draft.length)}>{busy?'Đang lưu…':mode?'Thêm các món':'Thêm món'+(draft.length?' ('+draft.length+')':'')}</button>
    </form><p className="feedback" role="status">{message}</p><FoodDatabase/>
  </section>;
}
