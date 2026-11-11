import {useState,type FormEvent} from 'react';
import {importSheet} from './sheets';
import {write} from './storage';

export function FoodDatabase(){
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const form=e.currentTarget, data=new FormData(form);
    setMessage('');setBusy(true);
    try{
      const foods=await importSheet(String(data.get('url')));
      write('sheet',foods);setMessage('Đã nạp '+foods.length+' thực phẩm và lưu trên thiết bị.');
    }catch(err){setMessage(err instanceof Error?err.message:'Chưa lưu được dữ liệu.')}finally{setBusy(false)}
  }
  return <details className="database"><summary>Nạp từ Google Sheets</summary><div className="database-content">
    <form onSubmit={submit}><p>Chọn một Sheet cho phép xem bằng liên kết. Dòng đầu chứa tên cột, các giá trị dinh dưỡng tính theo khẩu phần <b>baseGrams</b>.</p><code>name · baseGrams · calories · protein · carbs · fat · fiber</code><label>Liên kết trang tính<input name="url" type="url" placeholder="https://docs.google.com/spreadsheets/d/…" required/></label><small>Nạp lại sẽ thay danh sách từ Sheets. Món đã ghi giữ số liệu lúc thêm.</small>
      <button className="m-action" disabled={busy}>{busy?'Đang xử lý…':'Nạp từ Google Sheets'}</button>
    </form><p role="status">{message}</p></div></details>;
}
