import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { User, Lock, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }

        // Check if user exists
        const { data: existingUser } = await supabase
          .from('calier_users')
          .select('id')
          .eq('user', username)
          .single();

        if (existingUser) {
          throw new Error('El usuario ya existe');
        }

        const { error: insertError } = await supabase
          .from('calier_users')
          .insert([{ user: username, password: password }]);

        if (insertError) throw insertError;

        onLoginSuccess(username);
      } else {
        const { data, error: authError } = await supabase
          .from('calier_users')
          .select('*')
          .eq('user', username)
          .eq('password', password)
          .single();

        if (authError || !data) {
          throw new Error('Usuario o contraseña incorrectos');
        }

        onLoginSuccess(username);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E11]">
      <div className="w-full max-w-md p-8 rounded-xl bg-[#181D25] border border-[#252C37] shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-[#0B0E11] font-bold text-xl">
            CA
          </div>
          <h1 className="text-xl font-semibold text-[#E8ECF1] mb-1">Calier Argentina</h1>
          <p className="text-[#8B95A5] text-sm">
            {isRegistering ? 'Crear cuenta nueva' : 'Iniciar Sesión'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#5A6577] uppercase tracking-wider">Usuario</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-[#8B95A5]" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#12161C] border border-[#252C37] rounded-lg text-[#E8ECF1] text-sm focus:outline-none focus:border-[#2DD4A8] transition-colors"
                placeholder="Nombre de usuario"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#5A6577] uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#8B95A5]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#12161C] border border-[#252C37] rounded-lg text-[#E8ECF1] text-sm focus:outline-none focus:border-[#2DD4A8] transition-colors"
                placeholder="********"
              />
            </div>
          </div>

          {isRegistering && (
            <div className="space-y-1 animate-fadeIn">
              <label className="text-[11px] font-semibold text-[#5A6577] uppercase tracking-wider">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#8B95A5]" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#12161C] border border-[#252C37] rounded-lg text-[#E8ECF1] text-sm focus:outline-none focus:border-[#2DD4A8] transition-colors"
                  placeholder="********"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#2DD4A8] hover:bg-[#25B892] text-[#0B0E11] font-semibold rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : (isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-xs text-[#8B95A5] hover:text-[#2DD4A8] transition-colors"
          >
            {isRegistering
              ? '¿Ya tienes cuenta? Inicia Sesión'
              : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
