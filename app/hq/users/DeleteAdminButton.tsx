'use client';

import { useTransition } from 'react';

interface DeleteAdminButtonProps {
  userId: string;
  email: string;
  deleteAction: (formData: FormData) => Promise<void>;
}

export default function DeleteAdminButton({ userId, email, deleteAction }: DeleteAdminButtonProps) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (!window.confirm(`Delete admin ${email}?\n\nThis will remove their login and all site access.`)) return;
    const formData = new FormData();
    formData.set('user_id', userId);
    startTransition(() => deleteAction(formData));
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      style={{
        background: 'transparent',
        color: pending ? '#94a3b8' : '#ef4444',
        border: `1px solid ${pending ? 'rgba(148,163,184,0.3)' : 'rgba(239,68,68,0.3)'}`,
        padding: '4px 10px', borderRadius: 6, cursor: pending ? 'not-allowed' : 'pointer',
        fontSize: 12, fontWeight: 500, fontFamily: "'Inter', sans-serif",
      }}
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  );
}
