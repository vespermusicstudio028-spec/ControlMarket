import { useState, useEffect, FormEvent } from 'react';
import { 
  Users, Clock, ShieldCheck, Mail, Calendar, AlertCircle, Database, 
  ArrowRight, Search, Plus, Trash2, Edit2, X, Check, Phone, Store, User, Filter 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AppUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  business_name: string;
  created_at: string;
  status: 'active' | 'expired' | 'trial';
  daysLeft: number;
  trial_ends_at?: string;
}

export default function AdminUsersManager({ currentUser }: { currentUser: any }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'expired'>('all');

  // Modal logic
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  // Modal Fields
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBusinessName, setFormBusinessName] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [formTrialDays, setFormTrialDays] = useState('7');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        setNeedsSetup(true);
        return;
      }

      if (data) {
        const formattedUsers = data.map(profile => {
          // If profiles don't contain trial_ends_at, we default using created_at + 7 days
          const days = calculateDaysLeft(profile.created_at, profile.trial_ends_at);
          return {
            id: profile.id,
            email: profile.email || '',
            name: profile.name || '',
            phone: profile.phone || '',
            business_name: profile.business_name || '',
            created_at: profile.created_at,
            status: profile.email === 'controlmarketadmin@gmail.com' ? 'active' : (profile.status || getStatusByDays(days)),
            daysLeft: profile.email === 'controlmarketadmin@gmail.com' ? 999 : days,
            trial_ends_at: profile.trial_ends_at
          };
        });
        setUsers(formattedUsers);
        setNeedsSetup(false);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchUsers();

    // Set up real-time listener for profiles changes
    const channel = supabase
      .channel('realtime-admin-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Real-time profiles database change payload received:', payload);
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calculateDaysLeft = (createdAtString: string, trialEndsAtString?: string) => {
    const expiryDate = trialEndsAtString ? new Date(trialEndsAtString) : (() => {
      const createdDate = new Date(createdAtString);
      const d = new Date(createdDate);
      d.setDate(d.getDate() + 7);
      return d;
    })();
    
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getStatusByDays = (daysLeft: number): AppUser['status'] => {
    if (daysLeft < 0) return 'expired';
    return 'trial';
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormBusinessName('');
    setFormStatus('trial');
    setFormTrialDays('7');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: AppUser) => {
    setModalMode('edit');
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPhone(user.phone);
    setFormBusinessName(user.business_name);
    setFormStatus(user.status);
    
    // Reverse calculate trial days or default
    if (user.status === 'trial') {
      setFormTrialDays(user.daysLeft > 0 ? user.daysLeft.toString() : '7');
    } else {
      setFormTrialDays('7');
    }
    
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formEmail) {
      setFormError("O campo e-mail é obrigatório.");
      return;
    }

    try {
      const trialEndsAt = formStatus === 'trial' 
        ? new Date(Date.now() + parseInt(formTrialDays || '7') * 24 * 60 * 60 * 1000).toISOString()
        : null;

      if (modalMode === 'add') {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zjwpoxqymtvpttoswzhj.supabase.co';
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IdVY-ERlCVmrSekSSh-Zaw_hiq0rtju';
        
        // Criar cliente temporário sem persistência de sessão para não deslogar o admin
        const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        });

        // Senha padrão temporária para o primeiro acesso
        const tempPassword = 'SenhaMarket123!';

        const { data: signUpData, error: signUpError } = await tempSupabase.auth.signUp({
          email: formEmail,
          password: tempPassword,
          options: {
            data: {
              name: formName,
              phone: formPhone,
              business_name: formBusinessName
            }
          }
        });

        if (signUpError) {
          throw new Error(`Erro ao registrar usuário no Auth: ${signUpError.message}`);
        }

        const userId = signUpData.user?.id;
        if (!userId) {
          throw new Error("Não foi possível obter o ID gerado para o usuário.");
        }

        // Aguarda 1.5s para garantir que o trigger do banco criou o perfil antes do update
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Atualizar as informações do perfil criado automaticamente pelo trigger
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            name: formName,
            phone: formPhone,
            business_name: formBusinessName,
            status: formStatus,
            trial_ends_at: trialEndsAt
          })
          .eq('id', userId);

        if (updateError) {
          throw new Error(`Erro ao atualizar perfil do assinante: ${updateError.message}`);
        }

        // Exibir a senha temporária para o administrador
        alert(`Assinante cadastrado com sucesso!\n\nEmail: ${formEmail}\nSenha temporária: ${tempPassword}\n\nInforme estes dados para o usuário acessar o sistema.`);
      } else if (modalMode === 'edit' && editingUserId) {
        const payload: any = {
          email: formEmail,
          name: formName,
          phone: formPhone,
          business_name: formBusinessName,
          status: formStatus,
        };

        if (formStatus === 'trial') {
          payload.trial_ends_at = trialEndsAt;
        } else if (formStatus === 'active') {
          payload.trial_ends_at = null;
        } else {
          payload.trial_ends_at = new Date(1).toISOString(); // expired timestamp long ago
        }

        const { error } = await supabase.from('profiles').update(payload).eq('id', editingUserId);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error("Error saving subscriber profile:", err);
      setFormError(err.message || String(err));
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (user.email === 'controlmarketadmin@gmail.com') {
      alert("Você não pode deletar a conta de administrador.");
      return;
    }

    const confirmed = window.confirm(`Deseja realmente remover o assinante "${user.name || user.email}"? Esta ação removerá apenas o registro de assinatura.`);
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;
      fetchUsers();
    } catch (err: any) {
      console.error("Error deleting subscriber profile:", err);
      alert("Erro ao remover assinante: " + err.message);
    }
  };

  // Filter and search
  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.business_name.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    if (statusFilter === 'all') return matchesSearch;
    return user.status === statusFilter && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="w-8 h-8 border-4 border-cm-blue/20 border-t-cm-blue rounded-full animate-spin"></span>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="bg-white border text-left border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="w-16 h-16 bg-blue-50 text-cm-blue rounded-2xl flex items-center justify-center mb-6">
          <Database className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Configuração Avançada no Supabase</h2>
        <p className="text-slate-600 mb-6 max-w-2xl">
          Para monitorar e criar assinantes em tempo real, sua tabela <strong>profiles</strong> precisa estar configurada com todas as colunas necessárias e o gatilho automático de registro.
        </p>
        
        <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto shadow-inner">
          <h4 className="text-cm-green font-mono text-sm mb-4 flex items-center gap-2">
            <ArrowRight className="w-4 h-4" /> Execute este script SQL completo no SQL Editor do seu Supabase para ativação instantânea:
          </h4>
          <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap select-all leading-relaxed">
{`-- 1. Criar ou atualizar a tabela de perfis completa
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  name text,
  phone text,
  business_name text,
  status text default 'trial',
  trial_ends_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Garantir colunas adicionais se a tabela já existia
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists business_name text;
alter table public.profiles add column if not exists status text default 'trial';
alter table public.profiles add column if not exists trial_ends_at timestamp with time zone;

-- 2. Habilitar RLS (Segurança de Linhas)
alter table public.profiles enable row level security;

-- Políticas de acesso
drop policy if exists "Permitir leitura para todos" on profiles;
create policy "Permitir leitura para todos" on profiles for select using (true);

drop policy if exists "Permitir criação própria" on profiles;
create policy "Permitir criação própria" on profiles for insert with check (auth.uid() = id);

drop policy if exists "Permitir alteração própria" on profiles;
create policy "Permitir alteração própria" on profiles for update with check (auth.uid() = id);

drop policy if exists "Controle administrativo total" on profiles;
create policy "Controle administrativo total" on profiles for all using (true) with check (true);

-- 3. Função automática para capturar dados inseridos em Auth Signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, phone, business_name, status, trial_ends_at, created_at)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'business_name', ''),
    'trial',
    (new.created_at + interval '7 days'),
    new.created_at
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(nullif(excluded.name, ''), profiles.name),
    phone = coalesce(nullif(excluded.phone, ''), profiles.phone),
    business_name = coalesce(nullif(excluded.business_name, ''), profiles.business_name);
  return new;
end;
$$;

-- Vincular gatilho ao cadastro original do Supabase
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();`}
          </pre>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="bg-cm-blue text-white px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-colors shadow-md"
          >
            Já executei o script SQL, recarregar página
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4 text-left">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-cm-blue">Assinantes em Tempo Real</h1>
            <span className="bg-cm-blue text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin
            </span>
          </div>
          <p className="text-slate-500 mt-2">Monitore, crie, altere e exclua todos os usuários cadastrados e controle os períodos de licença.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-cm-green text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-115 transition-all shadow-md self-start md:self-end"
        >
          <Plus className="w-5 h-5" /> Adicionar Assinante
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8 text-left">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-cm-blue rounded-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Registrados</h3>
            <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{users.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Testes Ativos</h3>
            <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{users.filter(u => u.status === 'trial' && u.daysLeft >= 0).length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Check className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Planos Ativos</h3>
            <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{users.filter(u => u.status === 'active').length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-xl shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Licenças Aspiradas</h3>
            <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{users.filter(u => u.status === 'expired' || (u.status === 'trial' && u.daysLeft < 0)).length}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center text-left">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por e-mail, nome, comércio ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-cm-blue outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto self-start md:self-center">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 font-bold text-xs rounded-xl tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${statusFilter === 'all' ? 'bg-cm-blue text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
          >
            <Filter className="w-3.5 h-3.5" /> Todos
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 font-bold text-xs rounded-xl tracking-wider uppercase transition-all whitespace-nowrap ${statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
          >
            Vitalício / Ativo
          </button>
          <button
            onClick={() => setStatusFilter('trial')}
            className={`px-4 py-2 font-bold text-xs rounded-xl tracking-wider uppercase transition-all whitespace-nowrap ${statusFilter === 'trial' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
          >
            Em Teste
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-4 py-2 font-bold text-xs rounded-xl tracking-wider uppercase transition-all whitespace-nowrap ${statusFilter === 'expired' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
          >
            Vencidos
          </button>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">Assinaturas Registradas ({filteredUsers.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-wider">Cliente / Nome</th>
                <th className="py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-wider">Comércio / Contato</th>
                <th className="py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-wider">Data de Cadastro</th>
                <th className="py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-wider">Status do Plano</th>
                <th className="py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-6 text-center text-slate-400 font-medium">
                    Nenhum assinante encontrado para a busca atual.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{user.name || "Sem nome cadastrado"}</p>
                          <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        {user.business_name ? (
                          <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Store className="w-4 h-4 text-cm-blue" />
                            {user.business_name}
                          </p>
                        ) : (
                          <p className="text-slate-400 text-sm italic">Comércio não informado</p>
                        )}
                        {user.phone ? (
                          <p className="text-slate-500 text-xs mt-1 flex items-center gap-1.5 font-mono">
                            <Phone className="w-3.5 h-3.5 text-emerald-500" />
                            {user.phone}
                          </p>
                        ) : (
                          <p className="text-slate-400 text-xs mt-1 italic">Sem telefone</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {user.status === 'active' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Vitalício (Ativo)
                          </span>
                        )}
                        {user.status === 'trial' && user.daysLeft >= 0 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            Fase de Teste ({user.daysLeft} d)
                          </span>
                        )}
                        {(user.status === 'expired' || (user.status === 'trial' && user.daysLeft < 0)) && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            Licença Expirada
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          title="Editar Assinatura"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-800 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          title="Remover Registro"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-800 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 overflow-hidden z-20 text-left animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-extrabold text-cm-blue mb-2">
              {modalMode === 'add' ? 'Adicionar Novo Assinante' : 'Editar Dados de Assinatura'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {modalMode === 'add' 
                ? 'Registre um novo assinante do ControlMarket diretamente na tabela Supabase.'
                : 'Modifique as condições de licença e período de uso do cliente.'}
            </p>

            <form onSubmit={handleSaveUser} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Nome Completo</label>
                  <input
                    type="text"
                    required={modalMode === 'add'}
                    placeholder="Ex: Carlos Oliveira"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-cm-blue outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">E-mail de Licença</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: carlos@supermercado.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    disabled={modalMode === 'edit'}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 disabled:text-slate-500 rounded-xl focus:border-cm-blue outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">WhatsApp / Celular</label>
                  <input
                    type="tel"
                    placeholder="Ex: (11) 98765-4321"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-cm-blue outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Nome do Comércio</label>
                  <input
                    type="text"
                    placeholder="Ex: Mercado Oliveira"
                    value={formBusinessName}
                    onChange={(e) => setFormBusinessName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-cm-blue outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Status da Licença / Acesso</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('trial')}
                    className={`py-3 px-3 font-bold text-xs rounded-xl tracking-wide uppercase transition-all flex flex-col items-center justify-center border ${formStatus === 'trial' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Clock className="w-4 h-4 mb-1" />
                    Teste Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('active')}
                    className={`py-3 px-3 font-bold text-xs rounded-xl tracking-wide uppercase transition-all flex flex-col items-center justify-center border ${formStatus === 'active' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Check className="w-4 h-4 mb-1" />
                    Vitalício
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('expired')}
                    className={`py-3 px-3 font-bold text-xs rounded-xl tracking-wide uppercase transition-all flex flex-col items-center justify-center border ${formStatus === 'expired' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <AlertCircle className="w-4 h-4 mb-1" />
                    Bloqueado
                  </button>
                </div>
              </div>

              {formStatus === 'trial' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in slide-in-from-top-4 duration-150">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Dias de Teste Restantes (a partir de hoje)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={formTrialDays}
                      onChange={(e) => setFormTrialDays(e.target.value)}
                      className="w-24 px-4 py-2 border border-slate-200 rounded-lg outline-none bg-white font-bold"
                    />
                    <span className="text-slate-500 text-sm">dias restantes de teste grátis (padrão: 7 dias)</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-cm-blue hover:brightness-110 text-white rounded-xl font-bold transition-all shadow-md"
                >
                  Salvar Assinante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
