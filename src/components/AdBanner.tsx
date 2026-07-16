'use client';

import { useEffect, useRef } from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

export default function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!clientId || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {}
  }, [clientId]);

  // If no AdSense ID, show placeholder
  if (!clientId) {
    return (
      <div className={`bg-[#111] border border-[#262626] rounded-lg overflow-hidden ${className}`}>
        <div className="flex items-center justify-center py-6 px-4 text-center">
          <div>
            <p className="text-[10px] text-[#363636] mb-1">مساحة إعلانية</p>
            <p className="text-[10px] text-[#262626]">AD</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={adRef} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
