import React, { useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from 'firebase/auth';

const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        if (!auth) return;
        setLoading(true);
        try {
            if (isLogin) await signInWithEmailAndPassword(auth, email, password);
            else await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) { setError('인증 실패! 이메일과 비밀번호를 확인해 주세요.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center p-6 bg-[#F8FAFC]">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-700">
                <div className="text-center">
                    <div className="inline-flex p-4 bg-blue-600 rounded-3xl shadow-xl text-white mb-4"><Award className="w-10 h-10" /></div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase">Climb Log</h2>
                    <p className="text-gray-500 text-sm font-medium mt-2">나의 모든 성장을 데이터로 기록합니다</p>
                </div>
                <form onSubmit={handleAuth} className="space-y-4 text-left">
                    <div className="relative"><Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" /><input type="email" placeholder="Email" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                    <div className="relative"><Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" /><input type="password" placeholder="Password" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={password} onChange={e => setPassword(e.target.value)} required /></div>
                    {error && <p className="text-xs text-rose-500 font-semibold px-2">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl uppercase tracking-widest transition-all hover:bg-gray-800 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : (isLogin ? '로그인' : '회원가입')}
                    </button>
                </form>
                <button onClick={() => setIsLogin(!isLogin)} className="w-full text-sm font-medium text-blue-600 underline underline-offset-4">{isLogin ? '처음이신가요? 계정 만들기' : '이미 계정이 있으신가요? 로그인'}</button>
            </div>
        </div>
    );
};

export default AuthScreen;