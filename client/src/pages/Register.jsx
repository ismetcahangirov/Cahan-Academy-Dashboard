import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useRegisterMutation } from '../features/auth/authApi';
import { setCredentials, selectIsAuthenticated } from '../features/auth/authSlice';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Mail, Lock, User as UserIcon, LogIn, Loader2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Ad ən azı 2 simvoldan ibarət olmalıdır'),
  email: z.string().email('Düzgün email daxil edin'),
  password: z.string().min(6, 'Şifrə ən azı 6 simvoldan ibarət olmalıdır'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifrələr uyğun gəlmir',
  path: ['confirmPassword'],
});

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [registerUser, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    try {
      const userData = await registerUser(data).unwrap();
      dispatch(setCredentials(userData.data));
      toast.success('Qeydiyyat uğurla tamamlandı!');
      navigate('/');
    } catch (err) {
      toast.error(err?.data?.message || 'Qeydiyyat uğursuz oldu');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-bordo rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-bordo rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Qeydiyyat</h1>
          <p className="text-white/60">Cahan Academy ailəsinə xoş gəldiniz</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 block">Ad Soyad</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                {...register('name')}
                type="text"
                className={`w-full bg-black/40 border ${errors.name ? 'border-bordo' : 'border-white/10'} rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder="İsmət Cahangirov"
              />
            </div>
            {errors.name && <p className="text-xs text-bordo mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                {...register('email')}
                type="email"
                className={`w-full bg-black/40 border ${errors.email ? 'border-bordo' : 'border-white/10'} rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder="nümunə@cahan.az"
              />
            </div>
            {errors.email && <p className="text-xs text-bordo mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 block">Şifrə</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                {...register('password')}
                type="password"
                className={`w-full bg-black/40 border ${errors.password ? 'border-bordo' : 'border-white/10'} rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-xs text-bordo mt-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 block">Şifrəni Təsdiqləyin</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                {...register('confirmPassword')}
                type="password"
                className={`w-full bg-black/40 border ${errors.confirmPassword ? 'border-bordo' : 'border-white/10'} rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-bordo mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="w-full bg-bordo hover:bg-bordo/90 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Qeydiyyatdan Keç
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Artıq hesabınız var?{' '}
            <Link to="/login" className="text-bordo font-semibold hover:underline">
              Giriş edin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
