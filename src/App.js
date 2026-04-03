import { useState, useMemo } from "react";

const CATEGORIES = ["Финансы","Логистика","Производство","Продажи","Отчётность","Другое"];
const PRIORITIES = ["Низкий","Средний","Высокий"];
const PCOLOR = {"Низкий":"#639922","Средний":"#BA7517","Высокий":"#A32D2D"};
const PBG = {"Низкий":"#EAF3DE","Средний":"#FAEEDA","Высокий":"#FCEBEB"};
const CCOLOR = {"Финансы":"#185FA5","Логистика":"#0F6E56","Производство":"#534AB7","Продажи":"#D4537E","Отчётность":"#BA7517","Другое":"#5F5E5A"};
const CBG = {"Финансы":"#E6F1FB","Логистика":"#E1F5EE","Производство":"#EEEDFE","Продажи":"#FBEAF0","Отчётность":"#FAEEDA","Другое":"#F1EFE8"};
const RECUR_TYPES = [
  {val:"none",label:"Без повторения"},
  {val:"daily",label:"Каждый день"},
  {val:"weekly",label:"Каждую неделю"},
  {val:"weekday",label:"По дням недели..."},
  {val:"monthly",label:"Каждый месяц"},
  {val:"interval",label:"Каждые N дней..."},
];
const WDAYS = ["вс","пн","вт","ср","чт","пт","сб"];
const KANBAN_COLS = [{key:"todo",label:"К выполнению"},{key:"inprogress",label:"В процессе"},{key:"done",label:"Готово"}];
const MONTH_NAMES = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

function todayStr() { return new Date().toISOString().split("T")[0]; }
function nowTs() { return new Date().toLocaleString("ru-RU",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}); }

function nextOccurrence(recur, fromStr) {
  const from = new Date(fromStr || todayStr());
  from.setHours(0,0,0,0);
  const b = new Date(from);
  if (recur.type === "daily") { b.setDate(b.getDate()+1); return b.toISOString().split("T")[0]; }
  if (recur.type === "weekly") { b.setDate(b.getDate()+7); return b.toISOString().split("T")[0]; }
  if (recur.type === "monthly") { b.setMonth(b.getMonth()+1); return b.toISOString().split("T")[0]; }
  if (recur.type === "interval") { b.setDate(b.getDate()+(recur.interval||1)); return b.toISOString().split("T")[0]; }
  if (recur.type === "weekday") {
    const days = recur.days || [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(from); d.setDate(d.getDate()+i);
      if (days.includes(d.getDay())) return d.toISOString().split("T")[0];
    }
  }
  return null;
}

function recurLabel(r) {
  if (!r || r.type === "none") return null;
  if (r.type === "daily") return "каждый день";
  if (r.type === "weekly") return "каждую неделю";
  if (r.type === "monthly") return "каждый месяц";
  if (r.type === "interval") return "каждые " + (r.interval||1) + " дн.";
  if (r.type === "weekday") return (r.days||[]).map(function(d){ return WDAYS[d]; }).join(", ");
  return null;
}

function isOverdue(t) { return !t.done && !!t.due && t.due < todayStr(); }
function isDueToday(t) { return !t.done && t.due === todayStr(); }
function isDueSoon(t) {
  if (!t.due || t.done) return false;
  var diff = (new Date(t.due) - new Date(todayStr())) / 86400000;
  return diff > 0 && diff <= 3;
}
function getKanbanStatus(t) { if (t.done) return "done"; return t.kanban || "todo"; }

var _id = 30;
function uid() { _id++; return String(_id); }

function emptyForm() {
  return {title:"",cat:"Финансы",priority:"Средний",due:"",note:"",recur:{type:"none",days:[],interval:2},tags:[],kanban:"todo"};
}

var inp = {padding:"8px 12px",borderRadius:8,border:"0.5px solid #ccc",background:"#f9f9f9",color:"#222",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};
var sel = Object.assign({},inp,{cursor:"pointer"});
function btn(extra) { return Object.assign({padding:"7px 14px",borderRadius:8,border:"0.5px solid #ccc",background:"#fff",color:"#222",fontSize:13,cursor:"pointer",fontWeight:500},extra||{}); }

var INIT = [
  {id:"1",title:"Подготовка квартальной отчётности",cat:"Отчётность",priority:"Высокий",due:"2026-04-05",done:false,note:"Для ОАЭ бухгалтеров",subtasks:[{id:"2",title:"Собрать данные",done:true},{id:"3",title:"Проверить корректность",done:false}],recur:{type:"none",days:[],interval:2},tags:["срочно"],kanban:"inprogress",comments:[]},
  {id:"4",title:"Сверка складских данных",cat:"Логистика",priority:"Средний",due:"2026-04-07",done:false,note:"",subtasks:[],recur:{type:"weekday",days:[5],interval:2},tags:["еженедельно"],kanban:"todo",comments:[]},
  {id:"5",title:"Внесение операций в систему",cat:"Финансы",priority:"Высокий",due:"2026-04-03",done:false,note:"",subtasks:[],recur:{type:"daily",days:[],interval:2},tags:[],kanban:"inprogress",comments:[{id:"c1",text:"Система была недоступна",ts:"03.04.2026, 09:15"}]},
  {id:"6",title:"Контроль производственных таблиц",cat:"Производство",priority:"Средний",due:"2026-04-10",done:false,note:"Заполнение фабрикой",subtasks:[],recur:{type:"weekly",days:[],interval:2},tags:["фабрика"],kanban:"todo",comments:[]},
  {id:"7",title:"Заполнение таблиц по продажам",cat:"Продажи",priority:"Низкий",due:"2026-04-08",done:false,note:"",subtasks:[],recur:{type:"none",days:[],interval:2},tags:[],kanban:"todo",comments:[]},
  {id:"8",title:"Контроль движения материалов",cat:"Логистика",priority:"Высокий",due:"2026-04-04",done:true,note:"",subtasks:[],recur:{type:"none",days:[],interval:2},tags:[],kanban:"done",comments:[]},
];

function CheckIcon() {
  return React.createElement("svg",{width:10,height:8,viewBox:"0 0 10 8"},React.createElement("polyline",{points:"1,4 4,7 9,1",fill:"none",stroke:"#E6F1FB",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round"}));
}
function RecurIcon() {
  return React.createElement("svg",{width:10,height:10,viewBox:"0 0 10 10"},React.createElement("path",{d:"M5 1 A4 4 0 1 1 1 5",fill:"none",stroke:"#888",strokeWidth:"1.5",strokeLinecap:"round"}),React.createElement("polyline",{points:"1,2 1,5 4,5",fill:"none",stroke:"#888",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"}));
}

function TagInput(props) {
  var tags = props.tags; var onChange = props.onChange;
  var state = useState(""); var val = state[0]; var setVal = state[1];
  return React.createElement("div",null,
    React.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:5,marginBottom:6}},
      tags.map(function(t){return React.createElement("span",{key:t,style:{fontSize:11,padding:"3px 8px",borderRadius:20,background:"#f0f0f0",border:"0.5px solid #ccc",color:"#555",display:"flex",alignItems:"center",gap:4}},"#",t,React.createElement("span",{style:{cursor:"pointer",fontSize:13},onClick:function(){onChange(tags.filter(function(x){return x!==t;}))}},"×"));})),
    React.createElement("input",{style:Object.assign({},inp,{fontSize:13,padding:"5px 10px"}),placeholder:"Добавить тег (Enter)...",value:val,onChange:function(e){setVal(e.target.value);},onKeyDown:function(e){if(e.key==="Enter"&&val.trim()&&!tags.includes(val.trim())){onChange([...tags,val.trim()]);setVal("");}}})
  );
}

function RecurEditor(props) {
  var val = props.val; var onChange = props.onChange;
  return React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
    React.createElement("select",{style:sel,value:val.type,onChange:function(e){onChange(Object.assign({},val,{type:e.target.value}));}},
      RECUR_TYPES.map(function(r){return React.createElement("option",{key:r.val,value:r.val},r.label);})),
    val.type==="weekday"&&React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},
      WDAYS.map(function(d,i){var active=(val.days||[]).includes(i);return React.createElement("button",{key:i,style:btn(active?{background:"#185FA5",color:"#E6F1FB",border:"none"}:{}),onClick:function(){var days=active?val.days.filter(function(x){return x!==i;}):[...(val.days||[]),i];onChange(Object.assign({},val,{days:days}));}},d);})),
    val.type==="interval"&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
      React.createElement("span",{style:{fontSize:13,color:"#666"}},"Каждые"),
      React.createElement("input",{type:"number",min:1,max:365,style:Object.assign({},inp,{width:70}),value:val.interval||2,onChange:function(e){onChange(Object.assign({},val,{interval:parseInt(e.target.value)||1}));}}),
      React.createElement("span",{style:{fontSize:13,color:"#666"}},"дней"))
  );
}

function TaskFormFields(props) {
  var f = props.f; var setF = props.setF;
  return React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:0}},
    React.createElement("input",{style:inp,placeholder:"Название задачи",value:f.title,onChange:function(e){setF(function(v){return Object.assign({},v,{title:e.target.value});})}}),
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,margin:"8px 0"}},
      React.createElement("select",{style:sel,value:f.cat,onChange:function(e){setF(function(v){return Object.assign({},v,{cat:e.target.value});});}},CATEGORIES.map(function(c){return React.createElement("option",{key:c},c);})),
      React.createElement("select",{style:sel,value:f.priority,onChange:function(e){setF(function(v){return Object.assign({},v,{priority:e.target.value});});}},PRIORITIES.map(function(p){return React.createElement("option",{key:p},p);})),
      React.createElement("input",{type:"date",style:inp,value:f.due||"",onChange:function(e){setF(function(v){return Object.assign({},v,{due:e.target.value});});}})),
    React.createElement("textarea",{style:Object.assign({},inp,{resize:"vertical",minHeight:52,marginBottom:8}),placeholder:"Заметка...",value:f.note||"",onChange:function(e){setF(function(v){return Object.assign({},v,{note:e.target.value});});}}),
    React.createElement("div",{style:{marginBottom:8}},
      React.createElement("div",{style:{fontSize:12,color:"#666",marginBottom:5}},"Теги"),
      React.createElement(TagInput,{tags:f.tags||[],onChange:function(tags){setF(function(v){return Object.assign({},v,{tags:tags});});}})),
    React.createElement("div",{style:{marginBottom:8}},
      React.createElement("div",{style:{fontSize:12,color:"#666",marginBottom:5}},"Статус канбан"),
      React.createElement("div",{style:{display:"flex",gap:6}},
        KANBAN_COLS.map(function(c){return React.createElement("button",{key:c.key,style:btn(f.kanban===c.key?{background:"#185FA5",color:"#E6F1FB",border:"none"}:{}),onClick:function(){setF(function(v){return Object.assign({},v,{kanban:c.key});});}},c.label);}))),
    React.createElement("div",null,
      React.createElement("div",{style:{fontSize:12,color:"#666",marginBottom:5}},"Повторение"),
      React.createElement(RecurEditor,{val:f.recur||{type:"none",days:[],interval:2},onChange:function(r){setF(function(v){return Object.assign({},v,{recur:r});});}}))
  );
}

function AISubtaskGenerator(props) {
  var task = props.task; var onAdd = props.onAdd;
  var s1 = useState(false); var loading = s1[0]; var setLoading = s1[1];
  var s2 = useState([]); var suggestions = s2[0]; var setSuggestions = s2[1];
  var s3 = useState([]); var selected = s3[0]; var setSelected = s3[1];
  var s4 = useState(""); var error = s4[0]; var setError = s4[1];

  function generate() {
    setLoading(true); setError(""); setSuggestions([]); setSelected([]);
    fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        model:"claude-sonnet-4-20250514",
        max_tokens:1000,
        system:"Ты помощник операционного менеджера. Отвечай ТОЛЬКО валидным JSON массивом строк. Без комментариев и markdown.",
        messages:[{role:"user",content:"Разбей на 4-6 подзадач: \""+task.title+"\". Категория: "+task.cat+". Заметка: "+(task.note||"нет")+". Только JSON массив строк."}]
      })
    }).then(function(r){return r.json();}).then(function(data){
      var text=data.content.map(function(i){return i.text||"";}).join("");
      var clean=text.replace(/```json|```/g,"").trim();
      var arr=JSON.parse(clean);
      if(Array.isArray(arr)){setSuggestions(arr);setSelected(arr.map(function(_,i){return i;}));}
      setLoading(false);
    }).catch(function(){setError("Не удалось сгенерировать подзадачи.");setLoading(false);});
  }

  function toggleSel(i){setSelected(function(s){return s.includes(i)?s.filter(function(x){return x!==i;}):[...s,i];});}
  function apply(){selected.forEach(function(i){onAdd(suggestions[i]);});setSuggestions([]);setSelected([]);}

  return React.createElement("div",{style:{marginTop:10,paddingTop:10,borderTop:"0.5px solid #eee"}},
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:suggestions.length?10:0}},
      React.createElement("button",{style:btn({background:"#EEEDFE",color:"#534AB7",border:"none",fontSize:12,padding:"5px 10px"}),onClick:generate,disabled:loading},loading?"⟳ Генерирую...":"✦ AI: разбить на подзадачи"),
      error&&React.createElement("span",{style:{fontSize:12,color:"#A32D2D"}},error)),
    suggestions.length>0&&React.createElement("div",{style:{background:"#EEEDFE",borderRadius:10,padding:10,marginTop:6}},
      React.createElement("div",{style:{fontSize:12,color:"#534AB7",fontWeight:500,marginBottom:8}},"Выбери подзадачи:"),
      suggestions.map(function(s,i){return React.createElement("div",{key:i,style:{display:"flex",alignItems:"center",gap:8,marginBottom:6,cursor:"pointer"},onClick:function(){toggleSel(i);}},
        React.createElement("div",{style:{width:14,height:14,borderRadius:3,border:"1.5px solid #534AB7",background:selected.includes(i)?"#534AB7":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}},
          selected.includes(i)&&React.createElement("svg",{width:8,height:6,viewBox:"0 0 8 6"},React.createElement("polyline",{points:"1,3 3,5 7,1",fill:"none",stroke:"#EEEDFE",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"}))),
        React.createElement("span",{style:{fontSize:13,color:"#3C3489"}},s));}),
      React.createElement("div",{style:{display:"flex",gap:6,marginTop:8}},
        React.createElement("button",{style:btn({background:"#534AB7",color:"#EEEDFE",border:"none",fontSize:12,padding:"5px 12px"}),onClick:apply},"Добавить выбранные ("+selected.length+")"),
        React.createElement("button",{style:btn({fontSize:12,padding:"5px 10px"}),onClick:function(){setSuggestions([]);setSelected([]);}},"Отмена")))
  );
}

function CommentsSection(props) {
  var t=props.t; var onAddComment=props.onAddComment; var onDeleteComment=props.onDeleteComment;
  var ts=useState(""); var text=ts[0]; var setText=ts[1];
  return React.createElement("div",{style:{marginTop:10,paddingTop:10,borderTop:"0.5px solid #eee"}},
    React.createElement("div",{style:{fontSize:11,color:"#888",marginBottom:8}},"Комментарии "+(t.comments.length>0?"("+t.comments.length+")":"")),
    t.comments.map(function(c){return React.createElement("div",{key:c.id,style:{background:"#f5f5f5",borderRadius:8,padding:"8px 10px",marginBottom:6,position:"relative"}},
      React.createElement("div",{style:{fontSize:11,color:"#aaa",marginBottom:3}},c.ts),
      React.createElement("div",{style:{fontSize:13,color:"#222"}},c.text),
      React.createElement("button",{style:{position:"absolute",top:6,right:8,background:"none",border:"none",cursor:"pointer",color:"#aaa",fontSize:14,padding:0},onClick:function(){onDeleteComment(c.id);}},"×"));}),
    React.createElement("div",{style:{display:"flex",gap:6,marginTop:6}},
      React.createElement("input",{style:Object.assign({},inp,{fontSize:13,padding:"5px 10px"}),placeholder:"Написать комментарий...",value:text,onChange:function(e){setText(e.target.value);},onKeyDown:function(e){if(e.key==="Enter"&&text.trim()){onAddComment(text.trim());setText("");}}}),
      React.createElement("button",{style:btn({padding:"5px 12px",flexShrink:0}),onClick:function(){if(text.trim()){onAddComment(text.trim());setText("");}}},"+")));
}

function SubtaskSection(props) {
  var t=props.t; var onToggleSub=props.onToggleSub; var onRemoveSub=props.onRemoveSub; var onAddSub=props.onAddSub;
  var ts=useState(""); var text=ts[0]; var setText=ts[1];
  var done=t.subtasks.filter(function(s){return s.done;}).length;
  var total=t.subtasks.length;
  return React.createElement("div",{style:{marginTop:10,paddingTop:10,borderTop:"0.5px solid #eee"}},
    total>0&&React.createElement("div",null,
      React.createElement("div",{style:{fontSize:11,color:"#888",marginBottom:5}},"Подзадачи "+done+"/"+total),
      React.createElement("div",{style:{height:3,borderRadius:3,background:"#eee",marginBottom:8,overflow:"hidden"}},React.createElement("div",{style:{height:"100%",width:(total?Math.round(done/total*100):0)+"%",background:"#185FA5",borderRadius:3}}))),
    t.subtasks.map(function(s){return React.createElement("div",{key:s.id,style:{display:"flex",alignItems:"center",gap:8,marginBottom:5}},
      React.createElement("div",{onClick:function(){onToggleSub(s.id);},style:{width:14,height:14,borderRadius:3,border:"1.5px solid #999",background:s.done?"#185FA5":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}},
        s.done&&React.createElement("svg",{width:8,height:6,viewBox:"0 0 8 6"},React.createElement("polyline",{points:"1,3 3,5 7,1",fill:"none",stroke:"#E6F1FB",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"}))),
      React.createElement("span",{style:{flex:1,fontSize:13,textDecoration:s.done?"line-through":"none",color:s.done?"#aaa":"#222"}},s.title),
      React.createElement("button",{style:{background:"none",border:"none",cursor:"pointer",color:"#aaa",fontSize:14,padding:"0 2px"},onClick:function(){onRemoveSub(s.id);}},"×"));}),
    React.createElement("div",{style:{display:"flex",gap:6,marginTop:6}},
      React.createElement("input",{style:Object.assign({},inp,{fontSize:13,padding:"5px 10px"}),placeholder:"Новая подзадача...",value:text,onChange:function(e){setText(e.target.value);},onKeyDown:function(e){if(e.key==="Enter"&&text.trim()){onAddSub(text.trim());setText("");}}}),
      React.createElement("button",{style:btn({padding:"5px 10px",flexShrink:0}),onClick:function(){if(text.trim()){onAddSub(text.trim());setText("");}}},"+")),
    React.createElement(AISubtaskGenerator,{task:t,onAdd:onAddSub}));
}

function PriorityBanner(props) {
  var tasks=props.tasks;
  var urgent=tasks.filter(function(t){return !t.done&&(isOverdue(t)||isDueToday(t)||t.priority==="Высокий");});
  urgent.sort(function(a,b){function score(t){return(isOverdue(t)?100:0)+(isDueToday(t)?50:0)+(t.priority==="Высокий"?20:0);}return score(b)-score(a);});
  if(!urgent.length)return null;
  var top=urgent[0];
  return React.createElement("div",{style:{background:"#FCEBEB",border:"0.5px solid #F09595",borderRadius:10,padding:"10px 14px",marginBottom:"1rem",display:"flex",alignItems:"center",gap:10}},
    React.createElement("span",{style:{fontSize:16}},"⚡"),
    React.createElement("div",{style:{flex:1}},
      React.createElement("div",{style:{fontSize:12,color:"#A32D2D",fontWeight:500,marginBottom:2}},"Сделать прямо сейчас"),
      React.createElement("div",{style:{fontSize:13,color:"#501313"}},top.title)),
    urgent.length>1&&React.createElement("span",{style:{fontSize:11,color:"#A32D2D",flexShrink:0}},"+",urgent.length-1," срочных"));
}

function TaskCard(props) {
  var t=props.t,onToggle=props.onToggle,onRemove=props.onRemove,onEdit=props.onEdit;
  var onToggleSub=props.onToggleSub,onRemoveSub=props.onRemoveSub,onAddSub=props.onAddSub;
  var onAddComment=props.onAddComment,onDeleteComment=props.onDeleteComment,compact=props.compact;
  var es=useState(false);var exp=es[0];var setExp=es[1];
  var ts2=useState("subtasks");var tab=ts2[0];var setTab=ts2[1];
  var rl=recurLabel(t.recur);
  var subDone=t.subtasks.filter(function(s){return s.done;}).length;
  var subTotal=t.subtasks.length;
  var borderColor=isOverdue(t)?"#E24B4A":isDueToday(t)?"#BA7517":"#e0e0e0";
  var dateLabel=null;
  if(t.due){if(isOverdue(t))dateLabel="просрочено";else if(isDueToday(t))dateLabel="сегодня";else dateLabel=t.due.split("-").reverse().join(".");}
  var dateColor=isOverdue(t)?"#A32D2D":isDueToday(t)?"#BA7517":isDueSoon(t)?"#854F0B":"#888";

  if(compact){
    return React.createElement("div",{style:{background:"#fff",border:"0.5px solid "+borderColor,borderRadius:10,padding:"8px 10px",marginBottom:6,opacity:t.done?0.6:1}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
        React.createElement("div",{onClick:function(){onToggle(t.id);},style:{width:16,height:16,borderRadius:4,border:"1.5px solid #999",background:t.done?"#185FA5":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}},
          t.done?React.createElement(CheckIcon,null):(rl?React.createElement(RecurIcon,null):null)),
        React.createElement("span",{style:{flex:1,fontSize:13,fontWeight:500,textDecoration:t.done?"line-through":"none",color:t.done?"#aaa":"#222",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},t.title),
        React.createElement("span",{style:{fontSize:11,padding:"2px 6px",borderRadius:20,background:PBG[t.priority],color:PCOLOR[t.priority],flexShrink:0}},t.priority)),
      (t.tags||[]).length>0&&React.createElement("div",{style:{display:"flex",gap:4,flexWrap:"wrap",marginTop:4,paddingLeft:24}},t.tags.map(function(tag){return React.createElement("span",{key:tag,style:{fontSize:10,padding:"1px 6px",borderRadius:20,background:"#f0f0f0",color:"#666"}},"#",tag);})),
      dateLabel&&React.createElement("div",{style:{fontSize:11,color:dateColor,marginTop:3,paddingLeft:24}},dateLabel),
      t.comments.length>0&&React.createElement("div",{style:{fontSize:11,color:"#aaa",marginTop:3,paddingLeft:24}},"💬 ",t.comments.length));
  }

  return React.createElement("div",{style:{background:"#fff",border:"0.5px solid "+borderColor,borderRadius:12,padding:"12px 14px",marginBottom:8,opacity:t.done?0.6:1}},
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},
      React.createElement("div",{onClick:function(){onToggle(t.id);},style:{width:18,height:18,borderRadius:5,border:"1.5px solid #999",background:t.done?"#185FA5":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}},
        t.done?React.createElement(CheckIcon,null):(rl?React.createElement(RecurIcon,null):null)),
      React.createElement("span",{style:{flex:1,fontSize:14,fontWeight:500,textDecoration:t.done?"line-through":"none",color:t.done?"#aaa":"#222",cursor:"pointer"},onClick:function(){setExp(function(v){return !v;})}},t.title),
      React.createElement("div",{style:{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}},
        subTotal>0&&React.createElement("span",{style:{fontSize:11,padding:"2px 7px",borderRadius:20,background:"#f0f0f0",color:"#666"}},subDone,"/",subTotal),
        t.comments.length>0&&React.createElement("span",{style:{fontSize:11,padding:"2px 7px",borderRadius:20,background:"#f0f0f0",color:"#666"}},"💬 ",t.comments.length),
        rl&&React.createElement("span",{style:{fontSize:11,padding:"2px 7px",borderRadius:20,background:"#E6F1FB",color:"#185FA5"}},"↻ ",rl),
        React.createElement("span",{style:{fontSize:11,padding:"2px 8px",borderRadius:20,background:CBG[t.cat],color:CCOLOR[t.cat],fontWeight:500}},t.cat),
        React.createElement("span",{style:{fontSize:11,padding:"2px 8px",borderRadius:20,background:PBG[t.priority],color:PCOLOR[t.priority],fontWeight:500}},t.priority),
        dateLabel&&React.createElement("span",{style:{fontSize:11,color:dateColor}},dateLabel)),
      React.createElement("button",{style:{background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:13,padding:"0 4px"},onClick:function(){onEdit(t);}},"✎"),
      React.createElement("button",{style:{background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:15,padding:"0 4px"},onClick:function(){onRemove(t.id);}},"×")),
    (t.tags||[]).length>0&&React.createElement("div",{style:{display:"flex",gap:4,flexWrap:"wrap",marginTop:6,paddingLeft:28}},t.tags.map(function(tag){return React.createElement("span",{key:tag,style:{fontSize:11,padding:"2px 8px",borderRadius:20,background:"#f0f0f0",color:"#666"}},"#",tag);})),
    !exp&&subTotal>0&&React.createElement("div",{style:{marginTop:6,height:2,borderRadius:2,background:"#eee",overflow:"hidden"}},React.createElement("div",{style:{height:"100%",width:Math.round(subDone/subTotal*100)+"%",background:"#185FA5",borderRadius:2}})),
    exp&&React.createElement("div",null,
      t.note&&React.createElement("div",{style:{marginTop:8,padding:"7px 10px",background:"#f5f5f5",borderRadius:8,fontSize:13,color:"#666",marginBottom:6}},t.note),
      React.createElement("div",{style:{display:"flex",gap:0,marginTop:10,borderBottom:"0.5px solid #eee"}},
        [["subtasks","Подзадачи"],["comments","Комментарии"]].map(function(item){var k=item[0];var l=item[1];return React.createElement("button",{key:k,style:{background:"none",border:"none",borderBottom:tab===k?"2px solid #185FA5":"2px solid transparent",color:tab===k?"#185FA5":"#888",fontSize:13,padding:"6px 14px",cursor:"pointer",fontWeight:tab===k?500:400},onClick:function(){setTab(k);}},l+(k==="comments"&&t.comments.length>0?" ("+t.comments.length+")":""));})),
      tab==="subtasks"&&React.createElement(SubtaskSection,{t:t,onToggleSub:onToggleSub,onRemoveSub:onRemoveSub,onAddSub:onAddSub}),
      tab==="comments"&&React.createElement(CommentsSection,{t:t,onAddComment:onAddComment,onDeleteComment:onDeleteComment})));
}

function EditModal(props) {
  var t=props.t;var onSave=props.onSave;var onCancel=props.onCancel;
  var fs=useState(Object.assign({},t,{recur:Object.assign({},t.recur,{days:[...(t.recur.days||[])]}),tags:[...(t.tags||[])]}));
  var f=fs[0];var setF=fs[1];
  return React.createElement("div",{style:{background:"#f5f5f5",border:"0.5px solid #ddd",borderRadius:12,padding:14,marginBottom:8}},
    React.createElement(TaskFormFields,{f:f,setF:setF}),
    React.createElement("div",{style:{display:"flex",gap:8,marginTop:10}},
      React.createElement("button",{style:btn({background:"#185FA5",color:"#E6F1FB",border:"none"}),onClick:function(){onSave(f);}},"Сохранить"),
      React.createElement("button",{style:btn(),onClick:onCancel},"Отмена")));
}

function CalendarView(props) {
  var tasks=props.tasks;
  var cs=useState(new Date(2026,3,1));var cur=cs[0];var setCur=cs[1];
  var year=cur.getFullYear();var month=cur.getMonth();
  var firstDay=new Date(year,month,1).getDay();var daysInMonth=new Date(year,month+1,0).getDate();
  var cells=[];for(var i=0;i<firstDay;i++)cells.push(null);for(var d=1;d<=daysInMonth;d++)cells.push(d);
  var today=new Date();
  var tasksByDay={};
  tasks.forEach(function(t){if(t.due){var pts=t.due.split("-");var y=parseInt(pts[0]),m=parseInt(pts[1])-1,dd=parseInt(pts[2]);if(y===year&&m===month){if(!tasksByDay[dd])tasksByDay[dd]=[];tasksByDay[dd].push(t);}}});
  return React.createElement("div",null,
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:16}},
      React.createElement("button",{style:btn({padding:"5px 10px"}),onClick:function(){setCur(new Date(year,month-1,1));}},"←"),
      React.createElement("span",{style:{fontSize:15,fontWeight:500,flex:1,textAlign:"center"}},MONTH_NAMES[month]," ",year),
      React.createElement("button",{style:btn({padding:"5px 10px"}),onClick:function(){setCur(new Date(year,month+1,1));}},"→")),
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:4,marginBottom:4}},
      ["пн","вт","ср","чт","пт","сб","вс"].map(function(dd){return React.createElement("div",{key:dd,style:{fontSize:11,color:"#aaa",textAlign:"center",padding:"4px 0"}},dd);})),
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:4}},
      cells.map(function(d,idx){
        if(!d)return React.createElement("div",{key:"e"+idx});
        var isToday=d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();
        var dt=tasksByDay[d]||[];
        return React.createElement("div",{key:d,style:{minHeight:70,background:isToday?"#E6F1FB":"#f9f9f9",borderRadius:8,padding:"4px 5px",border:isToday?"1px solid #185FA5":"0.5px solid #e0e0e0"}},
          React.createElement("div",{style:{fontSize:12,fontWeight:isToday?500:400,color:isToday?"#185FA5":"#888",marginBottom:3,textAlign:"right"}},d),
          dt.slice(0,3).map(function(t){return React.createElement("div",{key:t.id,style:{fontSize:10,padding:"2px 4px",borderRadius:4,background:CBG[t.cat],color:CCOLOR[t.cat],marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},t.title);}),
          dt.length>3&&React.createElement("div",{style:{fontSize:10,color:"#aaa",textAlign:"center"}},"+",dt.length-3));
      })));
}

function KanbanView(props) {
  var tasks=props.tasks,onToggle=props.onToggle,onRemove=props.onRemove,onEdit=props.onEdit;
  var onToggleSub=props.onToggleSub,onRemoveSub=props.onRemoveSub,onAddSub=props.onAddSub;
  var onAddComment=props.onAddComment,onDeleteComment=props.onDeleteComment,onMoveKanban=props.onMoveKanban;
  return React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12}},
    KANBAN_COLS.map(function(col){
      var colTasks=tasks.filter(function(t){return getKanbanStatus(t)===col.key;});
      return React.createElement("div",{key:col.key,style:{background:"#f5f5f5",borderRadius:12,padding:12}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}},
          React.createElement("span",{style:{fontSize:13,fontWeight:500}},col.label),
          React.createElement("span",{style:{fontSize:11,padding:"2px 8px",borderRadius:20,background:"#fff",color:"#888",border:"0.5px solid #ddd"}},colTasks.length)),
        colTasks.map(function(t){
          return React.createElement("div",{key:t.id},
            React.createElement(TaskCard,{t:t,onToggle:onToggle,onRemove:onRemove,onEdit:onEdit,onToggleSub:function(sid){onToggleSub(t.id,sid);},onRemoveSub:function(sid){onRemoveSub(t.id,sid);},onAddSub:function(title){onAddSub(t.id,title);},onAddComment:function(text){onAddComment(t.id,text);},onDeleteComment:function(cid){onDeleteComment(t.id,cid);},compact:true}),
            React.createElement("div",{style:{display:"flex",gap:4,marginBottom:6,marginTop:-2}},
              KANBAN_COLS.filter(function(c){return c.key!==col.key;}).map(function(c){return React.createElement("button",{key:c.key,style:btn({fontSize:10,padding:"2px 7px"}),onClick:function(){onMoveKanban(t.id,c.key);}},"→ ",c.label);})));
        }));
    }));
}

function WeekDashboard(props) {
  var tasks=props.tasks;
  var today=new Date();today.setHours(0,0,0,0);
  var days=[];for(var i=0;i<7;i++){var d=new Date(today);d.setDate(d.getDate()+i);days.push(d);}
  var urgent=tasks.filter(function(t){return !t.done&&t.priority==="Высокий";}).sort(function(a,b){if(!a.due)return 1;if(!b.due)return -1;return a.due.localeCompare(b.due);});
  var weekCount=tasks.filter(function(t){if(!t.due||t.done)return false;var dd=new Date(t.due);return dd>=today&&dd<=days[6];}).length;
  return React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:16}},
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10}},
      React.createElement("div",{style:{background:"#E6F1FB",borderRadius:10,padding:"10px 14px"}},React.createElement("div",{style:{fontSize:11,color:"#0C447C",marginBottom:4}},"Задач на неделю"),React.createElement("div",{style:{fontSize:22,fontWeight:500,color:"#0C447C"}},weekCount)),
      React.createElement("div",{style:{background:"#EEEDFE",borderRadius:10,padding:"10px 14px"}},React.createElement("div",{style:{fontSize:11,color:"#534AB7",marginBottom:4}},"Повторяющихся"),React.createElement("div",{style:{fontSize:22,fontWeight:500,color:"#534AB7"}},tasks.filter(function(t){return t.recur&&t.recur.type!=="none";}).length)),
      React.createElement("div",{style:{background:"#FCEBEB",borderRadius:10,padding:"10px 14px"}},React.createElement("div",{style:{fontSize:11,color:"#791F1F",marginBottom:4}},"Высокий приоритет"),React.createElement("div",{style:{fontSize:22,fontWeight:500,color:"#791F1F"}},urgent.length))),
    React.createElement("div",{style:{background:"#fff",border:"0.5px solid #e0e0e0",borderRadius:12,padding:14}},
      React.createElement("div",{style:{fontSize:13,fontWeight:500,color:"#888",marginBottom:10}},"Эта неделя"),
      React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:6}},
        days.map(function(day){
          var ds=day.toISOString().split("T")[0];
          var dt=tasks.filter(function(t){return t.due===ds&&!t.done;});
          var isToday=day.toDateString()===today.toDateString();
          return React.createElement("div",{key:ds,style:{textAlign:"center"}},
            React.createElement("div",{style:{fontSize:10,color:isToday?"#185FA5":"#aaa",marginBottom:4,fontWeight:isToday?500:400}},WDAYS[day.getDay()].toUpperCase()),
            React.createElement("div",{style:{fontSize:13,fontWeight:isToday?500:400,color:isToday?"#185FA5":"#222",marginBottom:6}},day.getDate()),
            dt.map(function(t){return React.createElement("div",{key:t.id,style:{fontSize:10,padding:"2px 3px",borderRadius:4,background:PBG[t.priority],color:PCOLOR[t.priority],marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},t.title);}),
            dt.length===0&&React.createElement("div",{style:{height:24,borderRadius:4,background:"#f5f5f5",border:"0.5px dashed #ddd"}}));
        }))),
    urgent.length>0&&React.createElement("div",{style:{background:"#fff",border:"0.5px solid #e0e0e0",borderRadius:12,padding:14}},
      React.createElement("div",{style:{fontSize:13,fontWeight:500,color:"#888",marginBottom:10}},"Сделать прямо сейчас"),
      urgent.slice(0,5).map(function(t){
        return React.createElement("div",{key:t.id,style:{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"0.5px solid #eee"}},
          React.createElement("span",{style:{fontSize:11,padding:"2px 7px",borderRadius:20,background:CBG[t.cat],color:CCOLOR[t.cat],flexShrink:0}},t.cat),
          React.createElement("span",{style:{flex:1,fontSize:13,color:"#222"}},t.title),
          t.due&&React.createElement("span",{style:{fontSize:11,color:isOverdue(t)?"#A32D2D":"#888",flexShrink:0}},isOverdue(t)?"просрочено":t.due.split("-").reverse().join(".")));
      })));
}

function StatsView(props) {
  var tasks=props.tasks;
  var progress=tasks.length?Math.round(tasks.filter(function(t){return t.done;}).length/tasks.length*100):0;
  return React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:16}},
    React.createElement("div",{style:{background:"#fff",border:"0.5px solid #e0e0e0",borderRadius:12,padding:16}},
      React.createElement("div",{style:{fontSize:13,fontWeight:500,color:"#888",marginBottom:12}},"По категориям"),
      CATEGORIES.map(function(c){var tot=tasks.filter(function(t){return t.cat===c;}).length;var dn=tasks.filter(function(t){return t.cat===c&&t.done;}).length;var pct=tot?Math.round(dn/tot*100):0;return React.createElement("div",{key:c,style:{marginBottom:10}},React.createElement("div",{style:{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}},React.createElement("span",null,c),React.createElement("span",{style:{color:"#888"}},dn,"/",tot," (",pct,"%)")),React.createElement("div",{style:{height:6,borderRadius:4,background:"#eee",overflow:"hidden"}},React.createElement("div",{style:{height:"100%",width:pct+"%",background:CCOLOR[c],borderRadius:4}})));})),
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10}},
      PRIORITIES.map(function(p){var cnt=tasks.filter(function(t){return t.priority===p;}).length;return React.createElement("div",{key:p,style:{background:PBG[p],borderRadius:10,padding:"12px 14px"}},React.createElement("div",{style:{fontSize:11,color:PCOLOR[p],marginBottom:4}},p),React.createElement("div",{style:{fontSize:22,fontWeight:500,color:PCOLOR[p]}},cnt));})),
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}},
      React.createElement("div",{style:{background:"#f5f5f5",borderRadius:10,padding:"12px 14px"}},React.createElement("div",{style:{fontSize:11,color:"#888",marginBottom:4}},"Прогресс"),React.createElement("div",{style:{fontSize:22,fontWeight:500}},progress,"%")),
      React.createElement("div",{style:{background:"#f5f5f5",borderRadius:10,padding:"12px 14px"}},React.createElement("div",{style:{fontSize:11,color:"#888",marginBottom:4}},"Повторяющихся"),React.createElement("div",{style:{fontSize:22,fontWeight:500}},tasks.filter(function(t){return t.recur&&t.recur.type!=="none";}).length)),
      React.createElement("div",{style:{background:"#f5f5f5",borderRadius:10,padding:"12px 14px"}},React.createElement("div",{style:{fontSize:11,color:"#888",marginBottom:4}},"Комментариев"),React.createElement("div",{style:{fontSize:22,fontWeight:500}},tasks.reduce(function(s,t){return s+t.comments.length;},0)))));
}

export default function App() {
  var ts=useState(INIT);var tasks=ts[0];var setTasks=ts[1];
  var sf=useState(false);var showForm=sf[0];var setShowForm=sf[1];
  var ff=useState(emptyForm());var form=ff[0];var setForm=ff[1];
  var fc=useState("Все");var filterCat=fc[0];var setFilterCat=fc[1];
  var fst=useState("Все");var filterStatus=fst[0];var setFilterStatus=fst[1];
  var fp=useState("Все");var filterPriority=fp[0];var setFilterPriority=fp[1];
  var ftag=useState("");var filterTag=ftag[0];var setFilterTag=ftag[1];
  var sb=useState("due");var sortBy=sb[0];var setSortBy=sb[1];
  var sr=useState("");var search=sr[0];var setSearch=sr[1];
  var ei=useState(null);var editId=ei[0];var setEditId=ei[1];
  var vw=useState("dashboard");var view=vw[0];var setView=vw[1];

  function toggleTask(id){setTasks(function(prev){return prev.map(function(t){if(t.id!==id)return t;if(!t.done&&t.recur&&t.recur.type!=="none"){var next=nextOccurrence(t.recur,t.due||todayStr());return Object.assign({},t,{due:next,kanban:"todo",subtasks:t.subtasks.map(function(s){return Object.assign({},s,{done:false});})});}return Object.assign({},t,{done:!t.done,kanban:t.done?"todo":"done"});});});}
  function toggleSub(tid,sid){setTasks(function(p){return p.map(function(t){return t.id!==tid?t:Object.assign({},t,{subtasks:t.subtasks.map(function(s){return s.id!==sid?s:Object.assign({},s,{done:!s.done});})});});}); }
  function removeSub(tid,sid){setTasks(function(p){return p.map(function(t){return t.id!==tid?t:Object.assign({},t,{subtasks:t.subtasks.filter(function(s){return s.id!==sid;})});});}); }
  function addSub(tid,title){setTasks(function(p){return p.map(function(t){return t.id!==tid?t:Object.assign({},t,{subtasks:[...t.subtasks,{id:uid(),title:title,done:false}]});});}); }
  function addComment(tid,text){setTasks(function(p){return p.map(function(t){return t.id!==tid?t:Object.assign({},t,{comments:[...t.comments,{id:uid(),text:text,ts:nowTs()}]});});}); }
  function deleteComment(tid,cid){setTasks(function(p){return p.map(function(t){return t.id!==tid?t:Object.assign({},t,{comments:t.comments.filter(function(c){return c.id!==cid;})});});}); }
  function removeTask(id){setTasks(function(p){return p.filter(function(t){return t.id!==id;});});}
  function saveEdit(f){setTasks(function(p){return p.map(function(t){return t.id===editId?f:t;});});setEditId(null);}
  function moveKanban(id,col){setTasks(function(p){return p.map(function(t){return t.id!==id?t:Object.assign({},t,{kanban:col,done:col==="done"});});});}
  function addTask(){if(!form.title.trim())return;setTasks(function(p){return [...p,Object.assign({},form,{id:uid(),done:form.kanban==="done",subtasks:[],comments:[]})];});setForm(emptyForm());setShowForm(false);}

  var allTags=useMemo(function(){return [...new Set(tasks.flatMap(function(t){return t.tags||[];}))];},[tasks]);
  var filtered=useMemo(function(){
    var res=tasks;
    if(filterCat!=="Все")res=res.filter(function(t){return t.cat===filterCat;});
    if(filterStatus==="Активные")res=res.filter(function(t){return !t.done;});
    if(filterStatus==="Выполненные")res=res.filter(function(t){return t.done;});
    if(filterStatus==="Просроченные")res=res.filter(isOverdue);
    if(filterStatus==="Сегодня")res=res.filter(isDueToday);
    if(filterPriority!=="Все")res=res.filter(function(t){return t.priority===filterPriority;});
    if(filterTag)res=res.filter(function(t){return (t.tags||[]).includes(filterTag);});
    if(search.trim())res=res.filter(function(t){return t.title.toLowerCase().includes(search.toLowerCase())||(t.note||"").toLowerCase().includes(search.toLowerCase());});
    return [...res].sort(function(a,b){if(sortBy==="due"){if(!a.due)return 1;if(!b.due)return -1;return a.due.localeCompare(b.due);}if(sortBy==="priority"){var o={"Высокий":0,"Средний":1,"Низкий":2};return o[a.priority]-o[b.priority];}if(sortBy==="title")return a.title.localeCompare(b.title);return 0;});
  },[tasks,filterCat,filterStatus,filterPriority,filterTag,search,sortBy]);

  var total=tasks.length,done=tasks.filter(function(t){return t.done;}).length;
  var overdue=tasks.filter(isOverdue).length,today2=tasks.filter(isDueToday).length;
  var progress=total?Math.round(done/total*100):0;
  var VIEWS=[{k:"dashboard",l:"Неделя"},{k:"list",l:"Список"},{k:"kanban",l:"Канбан"},{k:"calendar",l:"Календарь"},{k:"stats",l:"Статистика"}];

  return React.createElement("div",{style:{maxWidth:900,margin:"0 auto",padding:"1rem 0.5rem",fontFamily:"Arial, sans-serif"}},
    React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem",flexWrap:"wrap",gap:8}},
      React.createElement("div",null,
        React.createElement("h2",{style:{margin:0,fontSize:20,fontWeight:500}},"Задачи операционного менеджера"),
        React.createElement("p",{style:{margin:"2px 0 0",fontSize:13,color:"#888"}},done," из ",total," выполнено")),
      React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},
        VIEWS.map(function(v){return React.createElement("button",{key:v.k,style:btn(view===v.k?{background:"#E6F1FB",borderColor:"#185FA5",color:"#185FA5"}:{}),onClick:function(){setView(v.k);}},v.l);}),
        React.createElement("button",{style:btn({background:"#185FA5",color:"#E6F1FB",border:"none"}),onClick:function(){setShowForm(function(v){return !v;});}},"+ Задача"))),
    React.createElement("div",{style:{height:4,borderRadius:4,background:"#eee",marginBottom:"1rem",overflow:"hidden"}},
      React.createElement("div",{style:{height:"100%",width:progress+"%",background:"#185FA5",borderRadius:4}})),
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8,marginBottom:"1rem"}},
      [["Всего",total,"#E6F1FB","#0C447C"],["Готово",done,"#EAF3DE","#27500A"],["Сегодня",today2,"#FAEEDA","#633806"],["Просрочено",overdue,"#FCEBEB","#791F1F"]].map(function(item){return React.createElement("div",{key:item[0],style:{background:item[2],borderRadius:10,padding:"8px 12px"}},React.createElement("div",{style:{fontSize:11,color:item[3],marginBottom:2}},item[0]),React.createElement("div",{style:{fontSize:20,fontWeight:500,color:item[3]}},item[1]));})),
    React.createElement(PriorityBanner,{tasks:tasks}),
    showForm&&React.createElement("div",{style:{background:"#f5f5f5",border:"0.5px solid #ddd",borderRadius:12,padding:14,marginBottom:"1rem"}},
      React.createElement(TaskFormFields,{f:form,setF:setForm}),
      React.createElement("div",{style:{display:"flex",gap:8,marginTop:10}},
        React.createElement("button",{style:btn({background:"#185FA5",color:"#E6F1FB",border:"none"}),onClick:addTask},"Добавить"),
        React.createElement("button",{style:btn(),onClick:function(){setShowForm(false);}},"Отмена"))),
    view==="list"&&React.createElement("div",null,
      React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:"1rem",alignItems:"center"}},
        React.createElement("input",{style:Object.assign({},inp,{width:150}),placeholder:"Поиск...",value:search,onChange:function(e){setSearch(e.target.value);}}),
        React.createElement("select",{style:Object.assign({},sel,{width:"auto"}),value:filterCat,onChange:function(e){setFilterCat(e.target.value);}},React.createElement("option",null,"Все"),CATEGORIES.map(function(c){return React.createElement("option",{key:c},c);})),
        React.createElement("select",{style:Object.assign({},sel,{width:"auto"}),value:filterStatus,onChange:function(e){setFilterStatus(e.target.value);}},["Все","Активные","Выполненные","Просроченные","Сегодня"].map(function(s){return React.createElement("option",{key:s},s);})),
        React.createElement("select",{style:Object.assign({},sel,{width:"auto"}),value:filterPriority,onChange:function(e){setFilterPriority(e.target.value);}},React.createElement("option",null,"Все"),PRIORITIES.map(function(p){return React.createElement("option",{key:p},p);})),
        allTags.length>0&&React.createElement("select",{style:Object.assign({},sel,{width:"auto"}),value:filterTag,onChange:function(e){setFilterTag(e.target.value);}},React.createElement("option",{value:""},"Все теги"),allTags.map(function(t){return React.createElement("option",{key:t},"#",t);})),
        React.createElement("select",{style:Object.assign({},sel,{width:"auto"}),value:sortBy,onChange:function(e){setSortBy(e.target.value);}},React.createElement("option",{value:"due"},"По сроку"),React.createElement("option",{value:"priority"},"По приоритету"),React.createElement("option",{value:"title"},"По названию"))),
      filtered.length===0?React.createElement("div",{style:{textAlign:"center",padding:"3rem 0",color:"#aaa",fontSize:14}},"Задачи не найдены"):
      filtered.map(function(t){return editId===t.id?React.createElement(EditModal,{key:t.id,t:t,onSave:saveEdit,onCancel:function(){setEditId(null);}}):React.createElement(TaskCard,{key:t.id,t:t,onToggle:toggleTask,onRemove:removeTask,onEdit:function(x){setEditId(x.id);},onToggleSub:function(sid){toggleSub(t.id,sid);},onRemoveSub:function(sid){removeSub(t.id,sid);},onAddSub:function(title){addSub(t.id,title);},onAddComment:function(text){addComment(t.id,text);},onDeleteComment:function(cid){deleteComment(t.id,cid);}});})),
    view==="kanban"&&React.createElement(KanbanView,{tasks:tasks,onToggle:toggleTask,onRemove:removeTask,onEdit:function(x){setEditId(x.id);},onToggleSub:toggleSub,onRemoveSub:removeSub,onAddSub:addSub,onAddComment:addComment,onDeleteComment:deleteComment,onMoveKanban:moveKanban}),
    view==="calendar"&&React.createElement(CalendarView,{tasks:tasks}),
    view==="dashboard"&&React.createElement(WeekDashboard,{tasks:tasks}),
    view==="stats"&&React.createElement(StatsView,{tasks:tasks}));
}
