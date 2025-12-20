import './../Firebase/config';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

const auth = getAuth();
const db = getFirestore();
const usersCollection = collection(db, 'users');

export const createUser = async (userData) => {
    const { email, password, nome, apelido, ferramentas, nivelRotina, notificacao } = userData;
    
    const authUser = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(authUser.user, { displayName: nome });
    
    await addDoc(usersCollection, {
        uid: authUser.user.uid,
        nome,
        apelido,
        email,
        ferramentas,
        nivelRotina,
        notificacao,
        createdAt: new Date()
    });
    
    return authUser.user;
};

export const updateUser = async (uid, userData) => {
    const userQuery = query(usersCollection, where('uid', '==', uid));
    const querySnapshot = await getDocs(userQuery);
    
    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), userData);
    }
};

export const deleteUser = async (uid) => {
    const userQuery = query(usersCollection, where('uid', '==', uid));
    const querySnapshot = await getDocs(userQuery);
    
    if (!querySnapshot.empty) {
        await deleteDoc(doc(db, 'users', querySnapshot.docs[0].id));
    }
};

export const getUser = async (uid) => {
    const userQuery = query(usersCollection, where('uid', '==', uid));
    const querySnapshot = await getDocs(userQuery);
    
    return querySnapshot.empty ? null : querySnapshot.docs[0].data();
};

export const getAllUsers = async () => {
    const querySnapshot = await getDocs(usersCollection);
    return querySnapshot.docs.map(doc => doc.data());
};