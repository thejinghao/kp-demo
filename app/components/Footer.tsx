import React from 'react';

export default function Footer() {
  return (
    <footer className="text-center pt-[18px] pb-4 bg-black text-[var(--color-primary-offwhite)]">
      <div className="container mx-auto px-4">
        <p>
          Questions? <a href="mailto:jing.hao@klarna.com" className="underline hover:underline text-[var(--color-primary-offwhite)]">Contact Us</a>
        </p>
      </div>
    </footer>
  );
}
