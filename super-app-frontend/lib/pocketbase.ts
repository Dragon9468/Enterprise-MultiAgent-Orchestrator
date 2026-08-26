import PocketBase from 'pocketbase';

const getPocketBaseUrl = () => {
  return process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
};

export const pb = new PocketBase(getPocketBaseUrl());

// Tắt tính năng tự động cancel request cũ
pb.autoCancellation(false);
