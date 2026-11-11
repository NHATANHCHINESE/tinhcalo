import {useEffect,useRef,type ReactNode} from 'react';

export function EditorDialog({open,title,close,children,id}:{id?:string;open:boolean;title:string;close:()=>void;children:ReactNode}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const dialog=ref.current!;
    if(open && !dialog.open) dialog.showModal();
    if(!open && dialog.open) dialog.close();
  },[open]);
  return <dialog id={id} ref={ref} className="macro editor" aria-label={title} onClose={close}>
    <div className="editor-head"><h2>{title}</h2><button className="icon" aria-label="Đóng" onClick={close}>×</button></div>
    {children}
  </dialog>;
}
