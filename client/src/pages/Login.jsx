import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from '../features/auth/authApi';
import { setCredentials, selectIsAuthenticated } from '../features/auth/authSlice';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Düzgün email daxil edin'),
  password: z.string().min(6, 'Şifrə ən azı 6 simvoldan ibarət olmalıdır'),
});

const Login = () => {
  const navigate = navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    try {
      const userData = await login(data).unwrap();
      dispatch(setCredentials(userData.data));
      toast.success('Xoş gəldiniz!');
      navigate('/');
    } catch (err) {
      toast.error(err?.data?.message || 'Giriş uğursuz oldu');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-bordo rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-bordo rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Cahan Academy</h1>
          <p className="text-white/60">Giriş edərək dərslərinizə davam edin</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                {...register('email')}
                type="email"
                className={`w-full bg-black/40 border ${errors.email ? 'border-bordo' : 'border-white/10'} rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder="nümunə@cahan.az"
              />
            </div>
            {errors.email && <p className="text-xs text-bordo mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/80 block">Şifrə</label>
              <Link to="/forgot-password" title="Şifrəni unutmusunuz?" className="text-xs text-bordo hover:underline">
                Şifrəni unutmusunuz?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                {...register('password')}
                type="password"
                className={`w-full bg-black/40 border ${errors.password ? 'border-bordo' : 'border-white/10'} rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-xs text-bordo mt-1">{errors.password.message}</p>}
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="w-full bg-bordo hover:bg-bordo/90 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Giriş Et
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            Hesabınız yoxdur?{' '}
            <Link to="/register" className="text-bordo font-semibold hover:underline">
              Qeydiyyatdan keçin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
