import type { SVGProps } from "react";

export function ClubsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.37,2.1a2.3,2.3,0,0,0-4.2,1.8,2.3,2.3,0,0,0,1.8,2.1,6.5,6.5,0,0,1,2.4-4Zm-6.5,9.7A2.3,2.3,0,0,0,2,12.3a2.3,2.3,0,0,0,2.1,1.8,6.5,6.5,0,0,1-1.8-2.3Zm9.8,2.4a2.3,2.3,0,0,0,2.1-1.8,2.3,2.3,0,0,0-1.8-2.3,6.5,6.5,0,0,1-2.4,4Zm.5,3.7a2.3,2.3,0,0,0,1.8,2.1,2.3,2.3,0,0,0,2.3-1.8,6.5,6.5,0,0,1-4-2.4Zm-4.2.5A6.5,6.5,0,0,1,6,17.9a2.3,2.3,0,0,0,4,2.3,2.3,2.3,0,0,0,2.1-1.8Z" />
    </svg>
  );
}

export function DiamondsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0L2.245 12 12 24l9.755-12L12 0z" />
    </svg>
  );
}

export function HeartsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function SpadesIcon(props: SVGProps<SVGSVGElement>) {
    return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12,2A10,10,0,0,0,5.1,5.28C8.32,4.45,11.08,6.7,12,11.45,12.92,6.7,15.68,4.45,18.9,5.28A10,10,0,0,0,12,2Zm0,20a.82.82,0,0,1-.69-.37c-1.55-2.5-4.31-7.18-4.31-7.18S9.46,19.3,11.31,21.63A.82.82,0,0,1,12,22a.82.82,0,0,1,.69-.37c1.85-2.33,4.31-7.18,4.31-7.18S13.55,19.3,12,21.63A.82.82,0,0,1,12,22Z"/>
    </svg>
    );
}

export function ChipIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" {...props}>
        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM128 288a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm96-96a32 32 0 1 1-64 0 32 32 0 1 1 64 0zM320 224a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm64 96a32 32 0 1 1 64 0 32 32 0 1 1-64 0zM288 128a32 32 0 1 1-64 0 32 32 0 1 1 64 0z"/>
      </svg>
    );
}

export function LogoIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" />
        <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
        <path d="M12 15a3 3 0 0 0-3 3" />
        <path d="M12 9a3 3 0 0 0 3 3" />
        <path d="M12 9a3 3 0 0 1-3-3" />
        <path d="M12 15a3 3 0 0 1 3-3" />
      </svg>
    )
}
