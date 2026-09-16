import React, { useState, useEffect } from 'react';
import { PlayCircle, Lock, BookOpen, LogOut, MonitorPlay, ChevronLeft, ListVideo, Play, Settings, Users, ShieldCheck, ToggleRight, ToggleLeft } from 'lucide-react';

// === Firebase 雲端資料庫套件 ===
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";

// === 你的 Firebase 專屬鑰匙 ===
const firebaseConfig = {
apiKey: "AIzaSyCkelvOrhhuin1VlKhjihJROlvuzLdqN_c",
authDomain: "kdrawcourse.firebaseapp.com",
projectId: "kdrawcourse",
storageBucket: "kdrawcourse.firebasestorage.app",
messagingSenderId: "245972957587",
appId: "1:245972957587:web:7d110afe9a5e5dc64e1066"
};

// 啟動 Firebase 連線
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ==========================================
// 👑 老闆專屬設定區
// ==========================================
const ADMIN_EMAIL = "ajwu1688@gmail.com";

// 課程資料庫
const COURSES_DB = [
{
id: 'course_kline_1',
title: '粗細轉折的奧義',
description: '從粗細折線工具介紹到多空架構的完整解析，掌握價格波動強弱。',
thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=400&h=250',
chapters: [
{
id: 'ch_1',
title: '單元一：粗細折線畫線工具介紹及定義',
lessons: [
{ id: 'lesson_1_1', title: 'K線粗細轉折的奧義 (工具介紹、運用定法)', duration: '影片 1', videoEmbedId: 'jx_JT0mFIMw' }
]
},
{
id: 'ch_2',
title: '單元二：細折箱的取法原則與粗折ABC法則',
lessons: [
{ id: 'lesson_2_1', title: '細折箱取箱解說及運用', duration: '影片 1', videoEmbedId: 'evzclVHlSsY' },
{ id: 'lesson_2_2', title: '粗折abc法則應用', duration: '影片 2', videoEmbedId: '9PRAOQCDnsY' }
]
},
{
id: 'ch_3',
title: '單元三：粗折多空架構及運用',
lessons: [
{ id: 'lesson_3_1', title: '粗折架構運用 & 價格波動強弱分辨', duration: '影片 1', videoEmbedId: '37gNiZsGxoA' },
{ id: 'lesson_3_2', title: '如何快速選圖畫粗細折？', duration: '影片 2', videoEmbedId: 'Ob2YiSKCekA' },
{ id: 'lesson_3_3', title: '粗細折應用/強勢波段', duration: '影片 3', videoEmbedId: '6ji2lHfmQgU' }
]
}
]
},
{
id: 'course_tankey_2',
title: '轉折天機',
description: '從趨勢定法到天機模型速選，掌握主力籌碼與隱形天機的實戰選股 SOP。',
thumbnail: 'https://file.vidhubfile.com/imgtok/post/fAXcGME/f_001.jpg',
chapters: [
{
id: 'tankey_ch_1',
title: '單元一：轉折天機完整課程',
lessons: [
{ id: 't_lesson_1', title: '轉折天機', duration: '影片 1', videoEmbedId: '_eQjZ1XQA4g' },
{ id: 't_lesson_2', title: '天機模型速選法', duration: '影片 2', videoEmbedId: 'tu6BW8luOgY' },
{ id: 't_lesson_3', title: '轉折天機-趨勢定法', duration: '影片 3', videoEmbedId: 'cM5eFbJsyz8' },
{ id: 't_lesson_4', title: '轉折天機-模型密碼', duration: '影片 4', videoEmbedId: 'QqwPQWPKa1w' },
{ id: 't_lesson_5', title: '轉折天機-要訣應用1130', duration: '影片 5', videoEmbedId: 'W5qYaJf0QBg' },
{ id: 't_lesson_6', title: '轉折天機-要訣應用1202', duration: '影片 6', videoEmbedId: '4HKK5wEi7rw' },
{ id: 't_lesson_7', title: '轉折天機-主力折磨圖', duration: '影片 7', videoEmbedId: 'eRWXg8hp0DI' },
{ id: 't_lesson_8', title: '轉折天機-隱形天機', duration: '影片 8', videoEmbedId: 'r13PWatiw0A' },
{ id: 't_lesson_9', title: '轉折天機-速選時間可以這樣做', duration: '影片 9', videoEmbedId: 'oztEHayQLbM' },
{ id: 't_lesson_10', title: '轉折天機-天機模型的選股SOP', duration: '影片 10', videoEmbedId: 'WXAkh782_i0' }
]
}
]
}
];

export default function App() {
const [isInitializing, setIsInitializing] = useState(true);
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [user, setUser] = useState(null);
const [isAdmin, setIsAdmin] = useState(false);
const [currentView, setCurrentView] = useState('home');
const [viewingCourse, setViewingCourse] = useState(null);
const [currentLesson, setCurrentLesson] = useState(null);
const [studentsList, setStudentsList] = useState([]);

// 偵測是否使用 LINE 等 APP 內建瀏覽器
const isAppBrowser = /Line|FBAN|FBAV|Instagram|MicroMessenger/i.test(navigator.userAgent);

useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
if (firebaseUser) {
const userRef = doc(db, "users", firebaseUser.uid);
const userSnap = await getDoc(userRef);
let userData;

    if (userSnap.exists()) {
      userData = userSnap.data();
    } else {
      userData = {
        name: firebaseUser.displayName || '無名學生',
        email: firebaseUser.email,
        purchasedCourses: [] 
      };
      await setDoc(userRef, userData);

      // ======== 🚀 Telegram 新學員通知 ========
      const telegramToken = "8858814911:AAFuLDOcZ3v7O9GFgyUanzbNcS8v6LZO5J4";
      const chatId = "7151457316";
      const message = `🚨 報告老闆！有新學員登入平台：\n\n👤 名字：${userData.name}\n✉️ 信箱：${userData.email}\n\n請記得至後台確認是否需開通權限！`;
      
      fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message })
      }).catch(error => console.error("Telegram 發送失敗", error));
    }

    setUser({ id: firebaseUser.uid, ...userData });
    setIsAdmin(firebaseUser.email === ADMIN_EMAIL);
    setIsLoggedIn(true);
  } else {
    setUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
  }
  setIsInitializing(false);
});

return () => unsubscribe();


}, []);

const handleGoogleLogin = async () => {
try {
await signInWithPopup(auth, googleProvider);
} catch (error) {
console.error("登入失敗:", error);
}
};

const handleLogout = async () => {
await signOut(auth);
setViewingCourse(null);
setCurrentLesson(null);
setCurrentView('home');
};

useEffect(() => {
if (isAdmin && currentView === 'admin') {
const fetchStudents = async () => {
const querySnapshot = await getDocs(collection(db, "users"));
const students = [];
querySnapshot.forEach((doc) => {
students.push({ id: doc.id, ...doc.data() });
});
setStudentsList(students);
};
fetchStudents();
}
}, [isAdmin, currentView]);

const toggleStudentCourse = async (studentId, courseId) => {
const student = studentsList.find(s => s.id === studentId);
const hasCourse = student.purchasedCourses.includes(courseId);

const newPurchased = hasCourse 
  ? student.purchasedCourses.filter(id => id !== courseId) 
  : [...student.purchasedCourses, courseId]; 

setStudentsList(prevList => 
  prevList.map(s => s.id === studentId ? { ...s, purchasedCourses: newPurchased } : s)
);

await updateDoc(doc(db, "users", studentId), {
  purchasedCourses: newPurchased
});


};

const hasPurchased = (courseId) => {
return user?.purchasedCourses.includes(courseId);
};

const handleEnterCourse = (course) => {
if (hasPurchased(course.id) || isAdmin) {
setViewingCourse(course);
if (course.chapters.length > 0 && course.chapters[0].lessons.length > 0) {
setCurrentLesson(course.chapters[0].lessons[0]);
}
setCurrentView('course');
}
};

if (isInitializing) {
return (


系統連線中...

);
}

if (!isLoggedIn) {
return (






KDrawCourse 課程
請使用 Google 帳號登入系統


      <div className="space-y-4 mt-8">
        {isAppBrowser ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-xl text-sm text-left shadow-sm">
            <p className="font-bold flex items-center gap-2 mb-2 text-base text-amber-900">
              <span className="text-xl">⚠️</span> 無法在目前的視窗登入
            </p>
            <p className="mb-3 leading-relaxed">Google 系統為了保護您的密碼安全，禁止在 LINE 或 FB 內建的視窗中直接登入。</p>
            <div className="font-bold bg-amber-200 p-3 rounded-lg text-amber-900 text-center leading-relaxed">
              👉 請點擊右上角 <span className="text-lg">⠇</span> 或右下角 <span className="text-lg">⋯</span><br/>
              選擇「以預設瀏覽器開啟」<br/>
              或「在 Safari / Chrome 開啟」
            </div>
          </div>
        ) : (
          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3.5 rounded-lg shadow-sm transition-colors flex justify-center items-center gap-3"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5"/>
            <span className="text-base">使用 Google 帳號登入</span>
          </button>
        )}
      </div>
    </div>
  </div>
);


}

return (



<div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>



KDrawCourse



{user.name} {isAdmin && 管理員}


        {isAdmin && currentView !== 'admin' && (
          <button onClick={() => setCurrentView('admin')} className="bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1 transition-colors px-3 py-1.5 rounded-md shadow-sm">
            <Settings size={16} /> 後台管理
          </button>
        )}

        {isAdmin && currentView === 'admin' && (
          <button onClick={() => setCurrentView('home')} className="bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-1 transition-colors px-3 py-1.5 rounded-md shadow-sm">
             返回前台
          </button>
        )}

        <button onClick={handleLogout} className="text-gray-300 hover:text-white flex items-center gap-1 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-800 border border-slate-700">
          <LogOut size={16} /> 登出
        </button>
      </div>
    </div>
  </nav>

  {currentView === 'admin' && isAdmin && (
    <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8">
      <div className="mb-6 flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-cyan-600" /> 學員權限管理系統
          </h1>
          <p className="text-gray-500 text-sm mt-1">點擊按鈕即可即時開通學員權限</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 text-sm">
                <th className="p-4 font-semibold">學員名稱 / Email</th>
                <th className="p-4 font-semibold text-center w-1/4">課程一：粗細轉折的奧義</th>
                <th className="p-4 font-semibold text-center w-1/4">課程二：轉折天機</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {studentsList.map(student => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleStudentCourse(student.id, 'course_kline_1')} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${student.purchasedCourses.includes('course_kline_1') ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {student.purchasedCourses.includes('course_kline_1') ? <><ToggleRight size={18} className="text-green-600"/> 已開通</> : <><ToggleLeft size={18} /> 未開通</>}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleStudentCourse(student.id, 'course_tankey_2')} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${student.purchasedCourses.includes('course_tankey_2') ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {student.purchasedCourses.includes('course_tankey_2') ? <><ToggleRight size={18} className="text-green-600"/> 已開通</> : <><ToggleLeft size={18} /> 未開通</>}
                    </button>
                  </td>
                </tr>
              ))}
              {studentsList.length === 0 && (
                 <tr><td colSpan="3" className="p-8 text-center text-gray-500">目前還沒有學生註冊登入</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )}

  {currentView === 'home' && (
    <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8">
      <div className="mb-6 flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的課程庫</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COURSES_DB.map(course => {
          const purchased = hasPurchased(course.id) || isAdmin;
          return (
            <div key={course.id} onClick={() => handleEnterCourse(course)} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-all duration-300 ${purchased ? 'border-gray-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer' : 'border-gray-200 opacity-75 grayscale-[50%]'}`}>
              <div className="h-48 overflow-hidden relative bg-slate-800">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                {purchased ? (
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">已購買</div>
                ) : (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                     <div className="bg-gray-900 bg-opacity-80 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"><Lock size={16} /> 尚未擁有此課程</div>
                  </div>
                )}
              </div>
              <div className="p-5 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-gray-500 text-sm flex-grow line-clamp-2 mb-4">{course.description}</p>
                <button className={`w-full py-2.5 rounded-lg font-medium transition-colors flex justify-center items-center gap-2 ${purchased ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
                  {purchased ? <><PlayCircle size={18} /> 開始上課</> : <><Lock size={18} /> 尚未開通</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  )}

  {currentView === 'course' && viewingCourse && (
    <div className="flex-grow flex flex-col md:flex-row bg-white max-w-7xl mx-auto w-full shadow-lg">
      <div className="flex-grow bg-slate-50 flex flex-col w-full md:w-2/3 lg:w-3/4">
        <div className="bg-white p-4 flex items-center gap-3 border-b border-gray-200">
          <button onClick={() => { setViewingCourse(null); setCurrentLesson(null); setCurrentView('home'); }} className="text-gray-600 hover:text-cyan-600 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-cyan-50 font-medium">
            <ChevronLeft size={20} /> 返回課程列表
          </button>
          <span className="text-gray-300">|</span>
          <h2 className="font-bold text-gray-800 line-clamp-1">{viewingCourse.title}</h2>
        </div>
        <div className="bg-black w-full aspect-video relative">
          {currentLesson ? (
            <iframe className="w-full h-full absolute inset-0" src={`https://www.youtube.com/embed/${currentLesson.videoEmbedId}?autoplay=1&rel=0`} title={currentLesson.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">請從右側選單選擇要播放的單元</div>
          )}
        </div>
        <div className="p-6 flex-grow">
          {currentLesson && (
            <><h1 className="text-2xl font-bold text-gray-900 mb-3">{currentLesson.title}</h1><p className="text-gray-500 text-sm flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-cyan-500"></span> 目前播放中</p></>
          )}
        </div>
      </div>
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-l border-gray-200 flex flex-col h-auto md:h-[calc(100vh-64px)] md:sticky md:top-16">
        <div className="p-4 bg-slate-50 border-b border-gray-200 flex items-center gap-2">
          <ListVideo className="text-cyan-600" size={20} /><h3 className="font-bold text-gray-800">課程章節</h3>
        </div>
        <div className="overflow-y-auto flex-grow pb-10">
          {viewingCourse.chapters.map((chapter) => (
            <div key={chapter.id} className="border-b border-gray-100 last:border-0">
              <div className="bg-gray-50 px-4 py-3 font-bold text-gray-700 text-sm border-l-2 border-slate-300">{chapter.title}</div>
              <ul className="flex flex-col">
                {chapter.lessons.map(lesson => {
                  const isPlaying = currentLesson?.id === lesson.id;
                  return (
                    <li key={lesson.id}>
                      <button onClick={() => setCurrentLesson(lesson)} className={`w-full text-left px-4 py-3 flex gap-3 items-start transition-colors duration-200 ${isPlaying ? 'bg-cyan-50 border-l-4 border-cyan-500' : 'border-l-4 border-transparent hover:bg-gray-50'}`}>
                        <div className="mt-0.5">{isPlaying ? <Play size={16} className="text-cyan-600 fill-cyan-600" /> : <PlayCircle size={16} className="text-gray-400" />}</div>
                        <div><div className={`text-sm ${isPlaying ? 'font-bold text-cyan-800' : 'text-gray-700'}`}>{lesson.title}</div></div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* LINE 官方按鈕 */}
  <a 
    href="https://lin.ee/NZmWvUM" 
    target="_blank" 
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 bg-[#06C755] hover:bg-[#05b34c] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
    title="加入官方 LINE 聯繫我們"
  >
    <img 
      src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" 
      alt="LINE" 
      className="w-8 h-8"
    />
  </a>
</div>


);
}