import React, { useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from 'firebase/auth';
import {Award, Loader2, Lock, Mail,} from 'lucide-react';

const AuthScreen = ({ auth }) => {
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

    const handleGuestLogin = async () => {
        if (!auth) return;
        setLoading(true);
        try {
            // Firebase에 미리 만들어둔 테스트 계정 정보를 하드코딩해서 바로 쏴줍니다!
            await signInWithEmailAndPassword(auth, 'test@test.com', '12341234');
        } catch (err) {
            setError('테스트 계정 접속에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-700">
                <div className="text-center">
                    {/*<div className="inline-flex p-4 bg-secondary rounded-sm text-white mb-4"><Award className="w-10 h-10" /></div>*/}
                    <h2 className="text-3xl font-extrabold text-primary uppercase">ClimbLog</h2>
                    <p className="text-primary-500 text-xs mt-2">나의 모든 성장을 데이터로 기록합니다</p>
                </div>
                <form onSubmit={handleAuth} className="space-y-4 text-left">
                    <div className="relative"><Mail className="absolute left-4 top-3 w-4 h-4 text-gray-400" /><input type="email" placeholder="Email" className="w-full h-[38px] pl-12 pr-2.5 bg-white border border-border rounded-sm text-xs outline-none focus:ring-1 focus:ring-primary" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                    <div className="relative"><Lock className="absolute left-4 top-3 w-4 h-4 text-gray-400" /><input type="password" placeholder="Password" className="w-full h-[38px] pl-12 pr-2.5 bg-white border border-border rounded-sm text-xs outline-none focus:ring-1 focus:ring-primary" value={password} onChange={e => setPassword(e.target.value)} required /></div>
                    {error && <p className="text-xs text-rose-500 font-semibold px-2">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full h-[38px] px-2.5  bg-primary-500 text-white text-xs rounded-sm  transition-all hover:bg-primary-700 disabled:opacity-50 cursor-pointer">
                        {loading ? <Loader2 className="animate-spin mx-auto w-4 h-4" /> : (isLogin ? '로그인' : '회원가입')}
                    </button>
                    <button type="button" onClick={handleGuestLogin} disabled={loading} className="w-full h-[38px] px-2.5 border border-primary-500 text-primary-500 text-xs rounded-sm  transition-all hover:bg-text-50 disabled:opacity-50 cursor-pointer">
                        게스트로 시작하기
                    </button>
                </form>
                <button onClick={() => setIsLogin(!isLogin)} className="w-full text-xs text-primary-400 underline underline-offset-4">{isLogin ? '처음이신가요? 계정 만들기' : '이미 계정이 있으신가요? 로그인'}</button>
            </div>
        </div>
    );
};

export default AuthScreen;