import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { ulid } from 'ulid';
import { db } from '@/lib/firebase/client-app';
import { ProfileData, Message, User } from '@/app/types';



type GetChatHistorySnapshotCallback = (messages: Message[]) => void;

export const getChatHistorySnapshot = (userId: string, sessionId: string, cb: GetChatHistorySnapshotCallback) => {
  const q = query(collection(db, 'users', userId, 'sessions', sessionId, 'messages'), orderBy('createdAt'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data()
        }) as Message
    );
    cb(messages);
  });

  return unsubscribe;
};

export const sendChatMessage = async (userId: string, sessionId: string, content: string, agent: string) => {
  console.log(`sendChatMessage: ${userId}, ${sessionId}, ${content}`)
  await addDoc(collection(db, 'users', userId, 'sessions', sessionId, 'messages'), {
    id: ulid(),
    content: content,
    role: 'user',
    loading: false,
    status: 'success',
    processing: false,
    agent: agent,
    createdAt: serverTimestamp(),
  })
}

export const sendSession = async (userId: string, sessionId: string) => {
  console.log(`sendSession: ${userId}, ${sessionId}`)
  // セッションIDがすでに存在する場合は何もしない
  const docRef = doc(db, 'users', userId, 'sessions', sessionId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    console.log(`Session ${sessionId} already exists for user ${userId}`);
    return;
  }
  await setDoc(docRef, {
    id: sessionId,
    createdAt: serverTimestamp(),
    sessionFirstGreet: 'yet',
  })
  // 考え中のチャットメッセージを作成する
  const messageRef = collection(db, 'users', userId, 'sessions', sessionId, 'messages');
  await addDoc(messageRef, {
    id: ulid(),
    content: "",
    loading: true,
    role: "model",
    status: "thinking",
    processing: false,
    agent: "Misaki",
    createdAt: serverTimestamp(),
  })
}


type GetUserSnapshotCallback = (user: User) => void;

export const getUserSnapshot = (uid: string, cb: GetUserSnapshotCallback) => {
  const q = doc(db, 'users', uid);
  const unsubscribe = onSnapshot(q, (doc) => {
    const user = {
      id: doc.id,
      ...doc.data()
    } as User;
    console.log(`getUserSnapshot: ${user.id}, ${user.status}`)
    cb(user);
  });

  return unsubscribe;
};

export const addUser = async (uid: string, email: string): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', uid), {
      email: email,
      createdAt: serverTimestamp(),
      status: 'creating',
      firstGreet: 'yet'
    });
  } catch (error) {
    console.error('Error adding document: ', error);
  }
};

export const getUserByUid = async (uid: string): Promise<User> => {
  const docRef = await getDoc(doc(db, 'users', uid));
  return {
    id: docRef.id,
    ...docRef.data()
  } as User;
};

export const updateUserProfile = async (uid: string, profile: ProfileData): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      nickname: profile.nickname,
      gender: profile.gender,
      age: profile.age,
      location: profile.location,
      iotDeviceUrl: profile.iotDeviceUrl,
      status: 'creating', // firstGreetが終わった時にcreatedに変更される
      firstGreet: 'yet'
    });
  } catch (error) {
    console.error('Error updating user profile: ', error);
    throw error;
  }
};
