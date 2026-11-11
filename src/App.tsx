import {confirmAction} from './confirmAction';
import {duckMood,duckImage,duckLabels} from './duck';
import {createPortal} from 'react-dom';
import {MyFoods} from './MyFoods';
import {useEffect,useState,type FormEvent} from 'react';
import {metrics,defaults,dayKey,norm,type Metric,type Nutrients} from './types';
import {database,summarize} from './calculations';
import {dayMeals,clearDay,read,write,savedFoods,migrate,changed} from './storage';
import {MacroDonut} from './MacroDonut';
import {MacroPanel} from './MacroPanel';
import {EditorDialog} from './EditorDialog';
import {FoodTracker,FoodList} from './FoodTracker';
function Goals({goals,onSaved}:{goals:Nutrients;onSaved:()=>void}){
  const [message,setMessage]=useState('');
  function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const data=new FormData(e.currentTarget),next={...goals};
    for(const m of metrics)next[m.key]=Number(data.get(m.key));
    try{write('goals',next);setMessage('');onSaved()}catch{setMessage('Chưa lưu được mục tiêu trên thiết bị.')}
  }
  return <section id="goals" className="goals"><form key={JSON.stringify(goals)} onSubmit={save}><div className="goal-fields">{metrics.map(m=><label key={m.key}>{m.label}<span className="unit-input"><input name={m.key} type="number" inputMode="decimal" step="any" min=".01" max="100000" defaultValue={goals[m.key]} required/><em>{m.unit}</em></span></label>)}</div><button className="m-action">Lưu mục tiêu</button><span role="status" className="goal-message">{message}</span></form></section>;
}
export default function App(){
  const [rev,refresh]=useState(0),[selected,setSelected]=useState<Metric>('calories');
  const [editor,setEditor]=useState<'food'|'goals'|null>(null);
  const [notice,setNotice]=useState('');
  const [error,setError]=useState(''),[ready,setReady]=useState(false),[resetting,setResetting]=useState(false);
  useEffect(()=>{
    const update=()=>refresh(r=>r+1);
    const visible=()=>{if(!document.hidden)update()};
    window.addEventListener(changed,update);window.addEventListener('storage',update);
    document.addEventListener('visibilitychange',visible);
    let timer:number;
    function midnight(){const date=new Date();date.setHours(24,0,0,50);timer=window.setTimeout(()=>{update();midnight()},date.getTime()-Date.now())}midnight();
    migrate().then(()=>{setReady(true);update()}).catch(()=>setError('Không đọc được nhật ký trên thiết bị. Hãy cho phép lưu trữ rồi tải lại trang.'));
    return ()=>{clearTimeout(timer);window.removeEventListener(changed,update);window.removeEventListener('storage',update);document.removeEventListener('visibilitychange',visible)};
  },[]);
  const today=dayKey(new Date()), goals=read('goals',defaults), store=savedFoods(),historyFoods=database(store.sheet,store.custom);
  const hidden=new Set(store.removed);
  const foods=historyFoods.filter(f=>!hidden.has(norm(f.name)));
  const meals=dayMeals(today).sort((a,b)=>b.at-a.at);
  const {values,missing,missingFiber}=summarize(meals.flatMap(m=>m.foods),historyFoods);
  const duck=duckMood(meals,values.calories,goals.calories);
  useEffect(()=>{
    if(!duck.until)return;
    const timer=window.setTimeout(()=>refresh(r=>r+1),Math.max(0,duck.until-Date.now())+1);
    return ()=>clearTimeout(timer);
  },[duck.until]);
  useEffect(()=>{
    if(!notice)return;
    const timer=window.setTimeout(()=>setNotice(''),4500);
    return ()=>clearTimeout(timer);
  },[notice]);
  async function reset(){
    if(!await confirmAction('Xóa toàn bộ thực phẩm và bữa ảnh của hôm nay? Mục tiêu, dữ liệu thực phẩm và các ngày trước vẫn được lưu.'))return;
    setResetting(true);try{await clearDay(today)}catch{setError('Có lỗi khi xóa nhật ký hôm nay.')}finally{setResetting(false)}
  }
  return <div className="macro" data-revision={rev}>
    {createPortal(<MyFoods custom={store.custom} foods={foods}/>,document.getElementById('personal-root')!)}
    <div className="daily-heading puppy-hero"><div className="hero-chart"><MacroDonut partialFiber={missingFiber>0} values={values} goals={goals} selected={selected} select={setSelected}/></div><div className="hero-copy"><p>{new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long'})}</p><h1>Nhật ký hôm nay</h1></div>
      <div className="quick-actions"><button className="camera-action" onClick={()=>window.dispatchEvent(new Event('macroday-camera'))}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="3.5"/></svg>Chụp ảnh</button></div>
    </div>
    {error&&<p className="alert" role="alert">{error} <button onClick={()=>setError('')}>Đóng</button></p>}

    <div className="day-cards"><section className="mcard overview"><div className="section-head"><h2>Dinh dưỡng</h2><button className="link-action" onClick={()=>{setNotice('');setEditor('goals')}}>Chỉnh mục tiêu</button></div>
      <div className="overview-grid"><figure className="duck-figure"><div className="duck-window"><img className="nutrition-duck" width="720" height="720" data-pose={duck.state} src={duckImage(duck.state)} alt={duckLabels[duck.state]}/></div><figcaption>{duck.caption}</figcaption></figure><MacroPanel partialFiber={missingFiber>0} values={values} goals={goals} selected={selected}/></div>
      {missingFiber>0&&<p role="status">Chưa có số liệu chất xơ cho {missingFiber} món. Tổng chất xơ chỉ gồm phần đã biết.</p>}
      {missing>0&&<p role="status">Có {missing} món chỉ có số Calories. Bạn có thể bổ sung trong mục Món của tôi.</p>}
    </section>
    {ready&&<section className="mcard diary"><div className="section-head"><h2>Bữa ăn đã ghi</h2>{meals.length>0&&<button className="link-action" disabled={resetting} onClick={reset}>Ngày mới</button>}</div><FoodList foods={historyFoods} meals={meals} onError={setError}/></section>}</div>
    {createPortal(<>
      <button className="meal-fab" type="button" aria-label="Thêm món ăn" title="Thêm món ăn" aria-haspopup="dialog" aria-controls="meal-editor" aria-expanded={editor==='food'} disabled={!ready} onClick={()=>{setNotice('');setEditor('food')}}>
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round"/></svg>
      </button>
      <p role="status" className="meal-toast">{notice}</p>
      <EditorDialog id="meal-editor" open={editor==='food'} title="Thêm món hôm nay" close={()=>setEditor(null)}>{editor==='food'&&<FoodTracker foods={foods} onSaved={msg=>{setNotice(msg);setEditor(null)}}/>}</EditorDialog>
    </>,document.body)}
    <EditorDialog open={editor==='goals'} title="Mục tiêu mỗi ngày" close={()=>setEditor(null)}><Goals goals={goals} onSaved={()=>{setEditor(null);setNotice('Đã lưu mục tiêu.')}}/></EditorDialog>
  </div>;
}
