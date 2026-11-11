import {confirmAction} from './confirmAction';
import {useState,type FormEvent} from 'react';
import {metrics,format,norm,type Food} from './types';
import {savedFoods,write} from './storage';
import {EditorDialog} from './EditorDialog';
import {FoodTracker} from './FoodTracker';

export function MyFoods({custom,foods}:{custom:Food[];foods:Food[]}){
  const [editing,setEditing]=useState<Food|'new'|null>(null);
  const [logging,setLogging]=useState<Food|null>(null);
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');
  const [query,setQuery]=useState('');
  const [onlyCustom,setOnlyCustom]=useState(false);
  const customNames=new Set(custom.map(f=>norm(f.name)));
  const visible=foods.filter(f=>(!onlyCustom||customNames.has(norm(f.name)))&&norm(f.name).includes(norm(query)));
  async function remove(food:Food){
    if(!await confirmAction('Xóa “'+food.name+'” khỏi danh sách món trên thiết bị này?'))return;
    try{
      const removed=new Set(savedFoods().removed);
      removed.add(norm(food.name));
      write('removedFoods',[...removed]);
      setNotice('Đã xóa '+food.name+' khỏi danh sách.');
    }catch{setNotice('Chưa xóa được món. Vui lòng thử lại.')}
  }
  const original=editing && editing!=='new'?editing:null;

  function edit(food:Food|'new'){setError('');setNotice('');setEditing(food)}
  function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const data=new FormData(event.currentTarget),name=String(data.get('name')).trim();
    if(!name){setError('Hãy nhập tên món.');return}
    const number=(field:string)=>Number(data.get(field));
    const food:Food={name,baseGrams:number('baseGrams'),nutrients:{
      calories:number('calories'),protein:number('protein'),carbs:number('carbs'),fat:number('fat'),fiber:number('fiber')
    }};
    try{
      const {custom:items,removed}=savedFoods();
      const others=items.filter(f=>!(original&&norm(f.name)===norm(original.name))&&!(removed.includes(norm(name))&&norm(f.name)===norm(name)));
      if(others.some(f=>norm(f.name)===norm(name))){setError('Tên này đã có trong Món của tôi. Hãy chọn Sửa hoặc dùng tên khác.');return}
      write('custom',[...others,food]);
      if(removed.includes(norm(name)))write('removedFoods',removed.filter(key=>key!==norm(name)));
      setEditing(null);setNotice('Đã lưu '+name+'.');
    }catch{setError('Chưa lưu được món trên thiết bị. Vui lòng thử lại.')}
  }
  return <section className="macro personal">
    <div className="daily-heading"><h1>Món của tôi</h1><button className="add-action" onClick={()=>edit('new')}>＋ Tạo món</button></div>
    <p role="status" className="home-notice">{notice}</p>
    <div className="mcard"><div className="library-tools"><input type="search" aria-label="Tìm trong Món của tôi" placeholder="Tìm món…" value={query} onChange={e=>setQuery(e.target.value)}/><div className="switches"><button aria-pressed={!onlyCustom} onClick={()=>setOnlyCustom(false)}>Tất cả</button><button aria-pressed={onlyCustom} onClick={()=>setOnlyCustom(true)}>Tự tạo</button></div></div>
      {visible.length===0?<p>Chưa có món phù hợp.</p>:
      <ul className="personal-list">{visible.map(food=><li key={norm(food.name)}>
        <div><strong>{food.name}</strong><small>{format(food.baseGrams)} {food.unit??'g'} · {format(food.nutrients.calories)} kcal</small></div>
        <div className="personal-actions">{customNames.has(norm(food.name))&&<button className="link-action" aria-label={'Sửa '+food.name} onClick={()=>edit(food)}>Sửa</button>}<button className="link-action" aria-label={'Xóa '+food.name} onClick={()=>remove(food)}>Xóa</button><button className="camera-action" onClick={()=>{setNotice('');setLogging(food)}}>Ghi vào nhật ký</button></div>
      </li>)}</ul>}</div>
    <EditorDialog open={editing!==null} title={original?'Sửa món riêng':'Tạo món riêng'} close={()=>setEditing(null)}>
      {editing&&<form key={original?.name??'new'} onSubmit={save}><label>Tên món<input name="name" maxLength={100} defaultValue={original?.name} required placeholder="Ví dụ: Cơm gà nhà làm"/></label>
        <p>Nhập số liệu dinh dưỡng cho một khẩu phần đã nấu chín.</p>
        <div className="field-grid"><label>Khẩu phần gốc (g)<input type="number" inputMode="decimal" name="baseGrams" min=".01" max="100000" step="any" defaultValue={original?.baseGrams??100} required/></label>
        {metrics.map(m=><label key={m.key}>{m.label} ({m.unit})<input type="number" inputMode="decimal" name={m.key} min="0" max="1000000" step="any" defaultValue={original?.nutrients[m.key]??undefined} required/></label>)}</div>
        {error&&<p role="alert">{error}</p>}<button className="m-action">Lưu món</button></form>}
    </EditorDialog>
    <EditorDialog open={logging!==null} title="Ghi vào nhật ký" close={()=>setLogging(null)}>
      {logging&&<FoodTracker foods={foods} initial={logging} onSaved={msg=>{setLogging(null);setNotice(msg)}}/>}
    </EditorDialog>
  </section>;
}
