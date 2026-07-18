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

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {width > 0 ? (
        <GoogleLogin
          key={Math.round(width)}
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
          width={Math.round(width)}
        />
      ) : null}
    </div>
  );
}
