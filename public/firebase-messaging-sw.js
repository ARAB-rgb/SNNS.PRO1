importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js');
firebase.initializeApp({apiKey:"AIzaSyDDEU0ZHDyYQOkBkLflSs8n-gVQ0QAhppE",authDomain:"gen-lang-client-0403650585.firebaseapp.com",projectId:"gen-lang-client-0403650585",storageBucket:"gen-lang-client-0403650585.firebasestorage.app",messagingSenderId:"474484295566",appId:"1:474484295566:web:1dac7693f9d51d2a7b06df"});
const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{
 const d=payload.data||{}, isCall=d.type==='incoming_call'||d.type==='call', isMsg=d.type==='new_message';
 let title=d.title||'SNNS', body=d.body||'لديك تحديث جديد في SNNS', tag='snns-update';
 if(isCall){const n=d.caller_name||'مستخدم SNNS',t=d.call_type==='audio'?'صوتية':'فيديو';title=`SNNS • مكالمة ${t} واردة`;body=`${n} يتصل بك الآن`;tag=d.call_id?`snns-call-${d.call_id}`:'snns-incoming-call'}
 else if(isMsg){title=d.title?`${d.title} • SNNS`:'رسالة جديدة • SNNS';tag=d.message_id?`snns-message-${d.message_id}`:'snns-new-message'}
 return self.registration.showNotification(title,{body,icon:'/icon-192.png',badge:'/icon-192.png',tag,renotify:true,requireInteraction:isCall,vibrate:isCall?[250,120,250,120,400]:[120,80,120],data:{url:d.url||'/',call_id:d.call_id||'',sender_id:d.sender_id||'',type:d.type||'update'}});
});
self.addEventListener('notificationclick',event=>{event.notification.close();const target=new URL(event.notification.data?.url||'/',self.location.origin).href;event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if(c.url.startsWith(self.location.origin)&&'focus'in c){if('navigate'in c)c.navigate(target);return c.focus()}}return clients.openWindow?clients.openWindow(target):undefined}))});
