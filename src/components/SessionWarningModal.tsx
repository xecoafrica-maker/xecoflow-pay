// src/components/SessionWarningModal.tsx
'use client';

type Props = {
  open: boolean;
  secondsRemaining: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
};

export default function SessionWarningModal({
  open,
  secondsRemaining,
  onStayLoggedIn,
  onLogout,
}: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.72-3l-6.93-12a2 2 0 00-3.44 0L2.35 16a2 2 0 001.72 3z"
                />
              </svg>
            </div>
            <div>
              <h3
                id="session-warning-title"
                className="text-lg font-bold text-gray-900 dark:text-white"
              >
                Session about to expire
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                You have been inactive for a while
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-slate-300 text-sm mb-6">
            Your session will end in{' '}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {secondsRemaining}s
            </span>
            . For your security, you will be logged out automatically.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
            >
              Log out now
            </button>
            <button
              type="button"
              onClick={onStayLoggedIn}
              className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              Stay logged in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}