import {updatePortion} from './storage';
import type {Meal} from './types';

export function editPortion(meal:Meal,index:number):Promise<number|null>{
  const row=meal.foods[index];
  const dialog=document.querySelector<HTMLDialogElement>('#portion-editor')!;
  if(dialog.open)return Promise.resolve(null);
  const form=dialog.querySelector('form')!;
  const input=form.elements.namedItem('amount') as HTMLInputElement;
  const cancel=form.querySelector<HTMLButtonElement>('button[type="button"]')!;
  const save=form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const error=form.querySelector<HTMLElement>('[role="alert"]')!;
  const unit=row.basis?.unit??'g';
  form.querySelector('.portion-food-name')!.textContent=row.name;
  form.querySelector('.portion-label')!.textContent=unit==='g'?'Khối lượng đã ăn (g)':'Số '+unit+' đã ăn';
  input.value=String(row.grams).replace('.',',');
  input.removeAttribute('aria-invalid');
  error.textContent='';
  let saved:number|null=null;
  return new Promise(resolve=>{
    cancel.onclick=()=>dialog.close();
    dialog.oncancel=event=>{if(save.disabled)event.preventDefault()};
    form.onsubmit=async event=>{
      event.preventDefault();
      if(save.disabled)return;
      const raw=input.value.trim().replace(',','.');
      const amount=/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)?Number(raw):NaN;
      if(!Number.isFinite(amount)||amount<0.01||amount>100000){
        input.setAttribute('aria-invalid','true');
        error.textContent='Nhập lượng ăn từ 0,01 đến 100.000 '+unit+'.';
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      save.disabled=cancel.disabled=true;
      try{
        await updatePortion(meal,index,amount);
        saved=amount;
        dialog.close();
      }catch(reason){
        error.textContent=reason instanceof Error?reason.message:'Chưa lưu được khẩu phần.';
      }finally{save.disabled=cancel.disabled=false}
    };
    dialog.addEventListener('close',()=>{
      form.onsubmit=null;
      cancel.onclick=null;
      dialog.oncancel=null;
      resolve(saved);
    },{once:true});
    dialog.showModal();
    input.select();
  });
}
