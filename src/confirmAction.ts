// Share the same accessible modal, including when called from a photo detail dialog.
export function confirmAction(message:string, action='Xóa'):Promise<boolean>{
  const dialog=document.createElement('dialog');
  dialog.className='macro editor confirm-action';
  dialog.setAttribute('aria-label',action);
  const text=document.createElement('p');
  text.textContent=message;
  const form=document.createElement('form');
  form.method='dialog';
  const cancel=document.createElement('button');
  cancel.className='camera-action';
  cancel.value='cancel';
  cancel.autofocus=true;
  cancel.textContent='Hủy';
  const accept=document.createElement('button');
  accept.className='confirm-delete';
  accept.value='accept';
  accept.textContent=action;
  form.append(cancel,accept);
  dialog.append(text,form);
  document.body.append(dialog);
  return new Promise(resolve=>{
    dialog.addEventListener('close',()=>{dialog.remove();resolve(dialog.returnValue==='accept')},{once:true});
    dialog.showModal();
  });
}
