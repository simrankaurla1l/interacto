import { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../lib/AuthContext.js';

interface GoogleSignInButtonProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  theme?: 'filled_black' | 'outline' | 'filled_blue';
}

export default function GoogleSignInButton({ onSuccess, onError, theme = 'filled_black' }: GoogleSignInButtonProps) {
  const { signInWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => setWidth(container.getBoundingClientRect().width);
    updateWidth();

    // Only watch for resizes while the layout is still settling (fonts/CSS loading).
    // Once locked, later resizes (e.g. a scrollbar shift when Google's account picker
    // opens) are ignored — otherwise they'd force `key` to change below, remounting
    // the button mid sign-in and silently dropping the in-flight credential callback.
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    const lockTimer = window.setTimeout(() => observer.disconnect(), 1000);

    return () => {
      window.clearTimeout(lockTimer);
      observer.disconnect();
    };
  }, []);

  const buttonWidth = Math.min(400, Math.max(200, Math.round(width)));

  return (
    <div ref={containerRef} className="flex w-full justify-center">
      {width > 0 ? (
        <GoogleLogin
          key={buttonWidth}
          onSuccess={async (credentialResponse) => {
            if (!credentialResponse.credential) {
              onError('Google did not return a credential. Please try again.');
              return;
            }
            try {
              await signInWithGoogle(credentialResponse.credential);
              onSuccess();
            } catch (err: any) {
              onError(err?.response?.data?.error || 'Failed to sign in with Google.');
            }
          }}
          onError={() => onError('Google sign-in was cancelled or failed.')}
          theme={theme}
          shape="pill"
          width={buttonWidth}
        />
      ) : null}
    </div>
  );
}
