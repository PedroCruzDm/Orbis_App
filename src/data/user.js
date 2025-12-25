import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../services/firebase/firebase_config';

const usersCollection = collection(db, 'Usuarios');

const DEFAULT_FERRAMENTAS = {
  foco: {
    tarefas: {
      lista: [],
      listaFalhada: [],
      listaPendente: [],
      listaConcluida: [],
      listaHistorico: [],
    },
    pontos: {
      total: 0,
      pontosHoje: 0,
      historico: [],
    },
    nivel: {
      nivelAtual: 1,
      progresso: 0,
      xpTotal: 0,
      xpHoje: 0,
      historico: [],
    }
  },
  sono: {
    hoaraioPersonalizado: null,
    lembretesAtivados: false,
    horarioLembrete: null,
    scoreHoje: null,
    historicoSono: [],
    historicoScore: [],
    SonoHoje: null,
    nivel: {
      nivelAtual: 1,
      progresso: 0,
      xpTotal: 0,
      xpHoje: 0,
      historico: [],
    },
  },
  agenda: {
    notificacaoEventos: true,
    eventosFixos: [],
    eventosFlexiveis: [],
    historicoEventos: {
      naoConcluidos: [],
      pendentes: [],
      concluidos: [],
    },
    nivel: {
      nivelAtual: 1,
      progresso: 0,
      xpTotal: 0,
      xpHoje: 0,
      historico: [],
    }
  },
};

const deepMergeDefaults = (obj = {}, defaults = {}) => {
  const out = { ...defaults };
  for (const k of Object.keys(obj)) {
    if (
      obj[k] &&
      typeof obj[k] === 'object' &&
      !Array.isArray(obj[k]) &&
      defaults[k] &&
      typeof defaults[k] === 'object' &&
      !Array.isArray(defaults[k])
    ) {
      out[k] = deepMergeDefaults(obj[k], defaults[k]);
    } else {
      out[k] = obj[k];
    }
  }
  return out;
};

const flattenObject = (obj, prefix = '', res = {}) => {
  for (const [key, val] of Object.entries(obj || {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      flattenObject(val, path, res);
    } else {
      res[path] = val;
    }
  }
  return res;
};

const normalizeFerramentas = (input) => {
  if (Array.isArray(input)) {
    const out = {};
    if (input.includes('modoFoco') || input.includes('foco')) out.foco = DEFAULT_FERRAMENTAS.foco;
    if (input.includes('modoSono') || input.includes('sono')) out.sono = DEFAULT_FERRAMENTAS.sono;
    if (input.includes('agenda')) out.agenda = DEFAULT_FERRAMENTAS.agenda;
    return out;
  }
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    const keys = Object.keys(input);
    // vindo do modal: { modoFoco: boolean, modoSono: boolean, agenda: boolean }
    if (keys.every(k => ['modoFoco','modoSono','agenda'].includes(k))) {
      const out = {};
      if (input.modoFoco) out.foco = DEFAULT_FERRAMENTAS.foco;
      if (input.modoSono) out.sono = DEFAULT_FERRAMENTAS.sono;
      if (input.agenda) out.agenda = DEFAULT_FERRAMENTAS.agenda;
      return out;
    }
    // já no formato final
    return input;
  }
  return DEFAULT_FERRAMENTAS;
};

export const createUser = async (userData) => {
  const {
    email,
    password,
    nome,
    apelido = null,
    idade = null,
    eventoFixoInicial = null,
    notificacao = true,
    ferramentas = {},
    nivelRotina = null,
    gameXPAtivado = false,
    
  } = userData;

  const trimmedEmail = (email || '').trim();
  if (!trimmedEmail || !password || !nome) {
    throw new Error('Email, senha e nome são obrigatórios.');
  }

  const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
  await updateProfile(cred.user, { displayName: nome });

  const ferramentasNormalized = normalizeFerramentas(ferramentas);

  await setDoc(doc(db, 'Usuarios', cred.user.uid), {
    uid: cred.user.uid,
    nome,
    apelido: apelido || null,
    email: trimmedEmail,
    idade: idade ? Number(idade) : null,
    eventoFixoInicial: eventoFixoInicial || null,
    receberNotificacoes: notificacao,
    gameXPAtivado,
    ferramentas: deepMergeDefaults(ferramentasNormalized, DEFAULT_FERRAMENTAS),
    nivelRotina,
    dias_consecutivos: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return cred.user;
};

export const loginUser = (email, password) => {
    const trimmedEmail = (email || '').trim();
    return signInWithEmailAndPassword(auth, trimmedEmail, password);
};

export const getCurrentUser = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuário não autenticado');
  }
  
  // Busca dados completos do Firestore
  const userData = await getUser(currentUser.uid);
  
  return {
    uid: currentUser.uid,
    email: currentUser.email,
    nome: currentUser.displayName || userData?.nome,
    apelido: userData?.apelido,
    ...userData,
  };
};

export const updateUser = async (uid, userData) => {
  if (!uid || !userData) return;
  const payload = { ...userData, updatedAt: new Date() };

  // Evita sobrescrever objetos aninhados: usa caminhos ponto com updateDoc
  const flat = flattenObject(payload);
  await updateDoc(doc(db, 'Usuarios', uid), flat);
};

export const deleteUser = async (uid) => {
    await deleteDoc(doc(db, 'Usuarios', uid));
};

export const getUser = async (uid) => {
    const snap = await getDoc(doc(db, 'Usuarios', uid));
    const data = snap.exists() ? snap.data() : null;
    if (!data) return null;

    // Garante defaults caso campos novos não existam ainda
    return {
      ...data,
      ferramentas: deepMergeDefaults(data.ferramentas, DEFAULT_FERRAMENTAS),
    };
};

export const getAllUsers = async () => {
    const querySnapshot = await getDocs(usersCollection);
    return querySnapshot.docs.map((docSnapshot) => docSnapshot.data());
};

export const addSonoScoreHoje = async (uid, score) => {
  await updateDoc(doc(db, 'Usuarios', uid), {
    'ferramentas.sono.scoreHoje': score,
    'ferramentas.sono.historicoScore': arrayUnion({ score, at: new Date() }),
    updatedAt: new Date(),
  });
};

export const addFocoPontosHoje = async (uid, pontos) => {
  await updateDoc(doc(db, 'Usuarios', uid), {
    'ferramentas.foco.pontos.pontosHoje': pontos,
    'ferramentas.foco.pontos.historico': arrayUnion({ pontos, at: new Date() }),
    updatedAt: new Date(),
  });
};

export const pushAgendaEventoConcluido = async (uid, evento) => {
  await updateDoc(doc(db, 'Usuarios', uid), {
    'ferramentas.agenda.historicoEventos.concluidos': arrayUnion({
      ...evento,
      concluidoEm: new Date(),
    }),
    updatedAt: new Date(),
  });
};